# Design Document: Alumni-Student Platform Extension

## Overview

This document describes the technical design for extending the existing alumni-student connect platform. The extension adds a dedicated Alumni My Sessions management page with full CRUD, builds the complete student-facing frontend (sidebar, layout, dashboard, my sessions, profile, notifications, messaging), and introduces new backend endpoints for session CRUD and student profile/session management.

The platform is a Next.js (App Router, JavaScript) frontend with a Node.js/Express backend and MongoDB via Mongoose. Authentication uses JWT stored in localStorage. The UI uses plain CSS and lucide-react icons throughout.

---

## Architecture

The system follows a client-server architecture with three layers:

```
Frontend (Next.js App Router)
  └── (dashboard)/alumni/*   - existing alumni pages
  └── (dashboard)/student/*  - new student pages (new layout group)

Backend (Express)
  └── /api/alumni/*          - existing + new session CRUD routes
  └── /api/student/*         - new student routes

Database (MongoDB / Mongoose)
  └── User, AlumniProfile, StudentProfile, Session, Registration
```

### Route Groups

The existing `(dashboard)` route group uses a single layout wrapping alumni pages. Student pages will live in a new `(student-dashboard)` route group with its own layout, keeping the two layouts independent.

```
frontend/src/app/
  (dashboard)/
    layout.js              ← existing alumni layout
    alumni/...
  (student-dashboard)/
    layout.js              ← new student layout
    student/...
```

### Data Flow

```
Page Component
  → useEffect → authFetch → Express route → auth middleware → controller
  → MongoDB query → JSON response → setState → render
```

---

## Components and Interfaces

### Frontend Components

#### StudentSidebar (`frontend/src/app/components/StudentSidebar.js`)

Mirrors the existing `Sidebar.js` structure exactly. Accepts `{ isOpen, setIsOpen }` props.

Nav items:
| Label | Route | Icon |
|---|---|---|
| Dashboard | /student/dashboard | LayoutDashboard |
| My Sessions | /student/my-sessions | CalendarCheck |
| Profile | /student/profile | User |
| Notifications | /student/notifications | Bell |
| Messaging | /student/messages | MessageSquare |

Active state: compares `usePathname()` to each `href`, applies `active` CSS class (same pattern as alumni sidebar).

Logout: clears `localStorage.removeItem("token")`, calls `router.push("/login")`.

#### Student Layout (`frontend/src/app/(student-dashboard)/layout.js`)

Identical structure to the alumni `DashboardLayout`. Uses `StudentSidebar` instead of `Sidebar`. Imports the same CSS files (`Sidebar.css`, `Navbar.css`, `Layout.css`) so styling is consistent.

#### Alumni My Sessions Page (`frontend/src/app/(dashboard)/alumni/my-sessions/page.js`)

State: `sessions[]`, `activeTab` ("upcoming"|"completed"), `editingSession` (null or session object), `showDeleteConfirm` (null or session id).

On mount: `GET /api/alumni/my-sessions` (existing endpoint).

Tab filter: `sessions.filter(s => new Date(s.startTime) > new Date())` for upcoming, inverse for completed.

Edit flow: clicking Edit sets `editingSession` to the session object, renders an inline modal/form pre-populated with all fields. On submit: `PATCH /api/alumni/sessions/:id`. On success: update sessions state in place.

Delete flow: clicking Delete sets `showDeleteConfirm` to the session id. Confirmation dialog calls `DELETE /api/alumni/sessions/:id`. On success: filter session out of state.

Validation: before submitting edit form, check that title, startTime, duration, meetLink, and category are non-empty. Show inline error if not.

#### Student Dashboard (`frontend/src/app/(student-dashboard)/student/dashboard/page.js`)

On mount: `GET /api/student/dashboard`.

Displays: stat cards (total, upcoming, completed counts) + list of upcoming registered sessions.

#### Student My Sessions (`frontend/src/app/(student-dashboard)/student/my-sessions/page.js`)

On mount: `GET /api/student/my-sessions`.

Same tab pattern as Alumni My Sessions (upcoming/completed split by `startTime`).

Session card fields: title, cover image, alumni name, date, time, duration, category, status.

#### Student Profile (`frontend/src/app/(student-dashboard)/student/profile/page.js`)

On mount: `GET /api/student/profile`.

View mode: displays name, department, batchYear, interests (as tags), profile image.

Edit mode: toggled by "Edit Profile" button. Form pre-populated with current data. Image selection shows a local preview via `URL.createObjectURL`. Interests managed as a local array with add/remove tag UI. Submit: `PATCH /api/student/profile` with `FormData` (to support image upload).

Validation: name field must be non-empty before submit.

#### Student Notifications (`frontend/src/app/(student-dashboard)/student/notifications/page.js`)

Frontend-only. Hardcoded mock notifications array. Each item: `{ id, title, description, timestamp, read }`. Renders list with read/unread visual indicator. Empty state when array is empty.

#### Student Messaging (`frontend/src/app/(student-dashboard)/student/messages/page.js`)

Frontend-only. Two-panel layout via CSS flexbox. Left panel: mock contacts list. Right panel: mock message thread for selected contact + non-functional input/send. State: `selectedContact` (null or contact id).

### Backend Controllers

#### Session Controller additions (`backend/controllers/alumni.controller.js`)

New exports:
- `getSessionById` — GET `/api/alumni/sessions/:id`
- `updateSession` — PATCH `/api/alumni/sessions/:id`
- `deleteSession` — DELETE `/api/alumni/sessions/:id`

All three verify `session.alumniId.toString() === alumni._id.toString()` for ownership.

#### Student Controller (`backend/controllers/student.controller.js`)

New file. Exports:
- `getMyProfile` — GET `/api/student/profile`
- `updateProfile` — PATCH `/api/student/profile`
- `getMySessions` — GET `/api/student/my-sessions`
- `getDashboard` — GET `/api/student/dashboard`

### Backend Routes

#### Alumni routes additions (`backend/routes/alumni.routes.js`)

```
GET    /api/alumni/sessions/:id   → auth → getSessionById
PATCH  /api/alumni/sessions/:id   → upload.single("coverImage") → auth → updateSession
DELETE /api/alumni/sessions/:id   → auth → deleteSession
```

#### Student routes (new file `backend/routes/student.routes.js`)

```
GET   /api/student/profile        → auth → getMyProfile
PATCH /api/student/profile        → upload.single("profileImage") → auth → updateProfile
GET   /api/student/my-sessions    → auth → getMySessions
GET   /api/student/dashboard      → auth → getDashboard
```

Registered in `backend/app.js`:
```js
app.use("/api/student", studentRoutes);
```

---

## Data Models

All models already exist. No schema changes are required.

### Session (existing)

Key fields used by new endpoints:
- `alumniId: ObjectId` — ownership check
- `title, startTime, duration, price, meetLink, maxSeats, category, status, coverImage`
- `currentSeats` — enrolled student count

### Registration (existing)

Key fields:
- `sessionId: ObjectId → Session`
- `studentId: ObjectId → User`
- `paymentStatus, attended`

Used by student endpoints to find all sessions a student is registered for.

### StudentProfile (existing)

Key fields:
- `userId: ObjectId → User` (unique)
- `profileImage: { url, filename }`
- `department, batchYear, interests[]`

The `getMyProfile` endpoint will upsert: `StudentProfile.findOneAndUpdate({ userId }, data, { upsert: true, new: true })`.

### AlumniProfile (existing)

Referenced when populating alumni name on student session cards via `Session.alumniId → User`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Session categorization correctness

*For any* list of sessions with arbitrary `startTime` values, the categorization function must place every session with `startTime > now` into the "upcoming" bucket and every session with `startTime <= now` into the "completed" bucket, with no session appearing in both or neither bucket.

**Validates: Requirements 1.2, 5.2**

### Property 2: Edit form pre-population round trip

*For any* session (or student profile) loaded from the backend, opening the edit form must result in every editable field being pre-populated with the value from the loaded document — i.e., `formState[field] === loadedDocument[field]` for all editable fields.

**Validates: Requirements 1.5, 7.2**

### Property 3: Session update round trip

*For any* valid PATCH payload sent to `/api/alumni/sessions/:id`, the response document must reflect all updated fields, and a subsequent GET to the same endpoint must return the same updated values.

**Validates: Requirements 1.6, 2.2**

### Property 4: Session deletion removes document

*For any* session owned by an authenticated alumni, after a successful DELETE to `/api/alumni/sessions/:id`, a subsequent GET to the same endpoint must return 404.

**Validates: Requirements 1.8, 2.3**

### Property 5: Edit form validation rejects incomplete submissions

*For any* edit form submission where at least one required field (title, startTime, duration, meetLink, category) is empty or whitespace-only, the form must not call the backend and must display a validation error message.

**Validates: Requirements 1.9**

### Property 6: Ownership enforcement returns 403

*For any* session and any authenticated alumni who is not the owner of that session, GET, PATCH, and DELETE requests to `/api/alumni/sessions/:id` must return HTTP 403.

**Validates: Requirements 2.4**

### Property 7: Active sidebar item matches current route

*For any* route under `/student/*`, the StudentSidebar must mark exactly one nav item as active — the one whose `href` matches the current pathname — and all other items must be inactive.

**Validates: Requirements 3.2**

### Property 8: Student dashboard stats aggregation correctness

*For any* set of Registration documents belonging to a student, the dashboard endpoint must return `total = registrations.length`, `upcoming = count of sessions with startTime > now`, and `completed = count of sessions with startTime <= now`, where `upcoming + completed === total`.

**Validates: Requirements 4.2, 6.2**

### Property 9: Student sessions endpoint returns populated data

*For any* authenticated student with registrations, GET `/api/student/my-sessions` must return all Registration documents for that student with the `sessionId` field populated (containing at minimum title, startTime, duration, category, status, coverImage) and the alumni User name populated.

**Validates: Requirements 6.1, 5.1**

### Property 10: Student profile upsert correctness

*For any* authenticated student, GET `/api/student/profile` must always return a StudentProfile document — creating one if none exists — with the associated User's name and email populated.

**Validates: Requirements 8.1, 8.4**

### Property 11: Student profile update round trip

*For any* valid PATCH payload sent to `/api/student/profile`, the response document must reflect all updated fields, and a subsequent GET must return the same updated values.

**Validates: Requirements 8.2, 7.3**

### Property 12: batchYear validation rejects out-of-range values

*For any* PATCH request to `/api/student/profile` where `batchYear` is non-numeric or outside the range 1900–2100, the endpoint must return HTTP 400.

**Validates: Requirements 8.5**

### Property 13: Interests tag list mutation correctness

*For any* current interests array, adding a tag must increase the array length by exactly 1 and the new tag must appear in the array; removing a tag must decrease the array length by exactly 1 and the removed tag must no longer appear.

**Validates: Requirements 7.6**

### Property 14: Notification item renders required fields

*For any* mock notification object `{ title, description, timestamp, read }`, the rendered notification item must contain the title text, description text, a formatted timestamp, and a visual read/unread indicator.

**Validates: Requirements 9.2**

### Property 15: Messaging conversation selection updates thread panel

*For any* mock contact selected from the conversation list, the thread panel must display the messages associated with that contact and not the messages of any other contact.

**Validates: Requirements 10.4**

---

## Error Handling

### Backend

- All controller functions are wrapped in `try/catch`. Unexpected errors return `500` with `{ success: false, message: "Server error" }`.
- Ownership violations return `403 Forbidden`.
- Missing documents return `404 Not Found`.
- Validation failures (e.g., invalid batchYear) return `400 Bad Request` with a descriptive message.
- The auth middleware returns `401` for missing or invalid tokens.

### Frontend

- All `authFetch` calls are wrapped in `try/catch`.
- On non-ok responses, the page calls `showToast("error", message)` using the existing `ToastContext`.
- Loading states are managed with a boolean `loading` state; pages render a loading indicator until data arrives.
- Form validation errors are shown as inline text beneath the relevant field, not via Toast.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and pure utility functions:

- Session categorization utility: verify a session exactly at `now` goes to "completed", a session 1ms in the future goes to "upcoming".
- Edit form validation: verify each required field individually triggers an error when empty.
- batchYear validation: verify boundary values (1900, 2100 pass; 1899, 2101, "abc" fail).
- Interests tag mutation: verify add/remove on an empty array, a single-item array, and a multi-item array.
- Student dashboard stats: verify `upcoming + completed === total` for a known fixture.
- Sidebar active state: verify correct item is active for each of the 5 student routes.

### Property-Based Tests

Property-based tests use **fast-check** (JavaScript PBT library) with a minimum of **100 iterations** per test.

Each test is tagged with a comment in the format:
`// Feature: alumni-student-platform, Property N: <property_text>`

**Property 1 — Session categorization correctness**
Generate an arbitrary array of session objects with random `startTime` values (past and future). Assert that every session appears in exactly one bucket and the bucket assignment matches `startTime > now`.
`// Feature: alumni-student-platform, Property 1: session categorization correctness`

**Property 2 — Edit form pre-population round trip**
Generate an arbitrary session object. Simulate loading it into the edit form state. Assert all editable fields in form state equal the source object fields.
`// Feature: alumni-student-platform, Property 2: edit form pre-population round trip`

**Property 3 — Session update round trip**
Generate an arbitrary valid session update payload. Call the update handler with a mock repository. Assert the returned document reflects all updated fields.
`// Feature: alumni-student-platform, Property 3: session update round trip`

**Property 4 — Session deletion removes document**
Generate an arbitrary session. Call delete. Assert subsequent get returns null/404.
`// Feature: alumni-student-platform, Property 4: session deletion removes document`

**Property 5 — Edit form validation rejects incomplete submissions**
Generate form states where at least one required field is empty or whitespace. Assert the submit handler returns early with an error and does not call the API.
`// Feature: alumni-student-platform, Property 5: edit form validation rejects incomplete submissions`

**Property 6 — Ownership enforcement returns 403**
Generate a session with a random `alumniId` and a different random requesting alumni id. Assert the controller returns 403.
`// Feature: alumni-student-platform, Property 6: ownership enforcement returns 403`

**Property 7 — Active sidebar item matches current route**
Generate each of the 5 student routes. Assert exactly one nav item has the active class.
`// Feature: alumni-student-platform, Property 7: active sidebar item matches current route`

**Property 8 — Student dashboard stats aggregation correctness**
Generate an arbitrary array of registrations with random session startTimes. Assert `upcoming + completed === total` and counts match the filter results.
`// Feature: alumni-student-platform, Property 8: student dashboard stats aggregation correctness`

**Property 9 — Student sessions endpoint returns populated data**
Generate an arbitrary student with registrations. Assert the endpoint response includes populated session and alumni fields.
`// Feature: alumni-student-platform, Property 9: student sessions endpoint returns populated data`

**Property 10 — Student profile upsert correctness**
Generate an arbitrary student userId with no existing profile. Assert GET creates and returns a profile document.
`// Feature: alumni-student-platform, Property 10: student profile upsert correctness`

**Property 11 — Student profile update round trip**
Generate an arbitrary valid profile update payload. Assert the response and subsequent GET reflect the updated values.
`// Feature: alumni-student-platform, Property 11: student profile update round trip`

**Property 12 — batchYear validation rejects out-of-range values**
Generate arbitrary integers outside [1900, 2100] and non-numeric strings. Assert the controller returns 400 for all of them.
`// Feature: alumni-student-platform, Property 12: batchYear validation rejects out-of-range values`

**Property 13 — Interests tag list mutation correctness**
Generate an arbitrary interests array and a new tag string. Assert add increases length by 1 and tag is present; assert remove decreases length by 1 and tag is absent.
`// Feature: alumni-student-platform, Property 13: interests tag list mutation correctness`

**Property 14 — Notification item renders required fields**
Generate arbitrary mock notification objects. Assert the rendered output contains title, description, timestamp, and read/unread indicator.
`// Feature: alumni-student-platform, Property 14: notification item renders required fields`

**Property 15 — Messaging conversation selection updates thread panel**
Generate a set of mock contacts each with distinct messages. For each contact, simulate selection and assert the thread panel shows only that contact's messages.
`// Feature: alumni-student-platform, Property 15: messaging conversation selection updates thread panel`
