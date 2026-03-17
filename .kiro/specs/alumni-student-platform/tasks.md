# Implementation Tasks

## Tasks

- [x] 1. Backend: Session CRUD endpoints (get, update, delete)
  - [x] 1.1 Add `getSessionById`, `updateSession`, `deleteSession` exports to `backend/controllers/alumni.controller.js`
  - [x] 1.2 Add GET/PATCH/DELETE `/api/alumni/sessions/:id` routes to `backend/routes/alumni.routes.js`
  - Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

- [x] 2. Backend: Student controller
  - [x] 2.1 Create `backend/controllers/student.controller.js` with `getMyProfile`, `updateProfile`, `getMySessions`, `getDashboard`
  - Validates: Requirements 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4, 8.5

- [x] 3. Backend: Student routes and app.js registration
  - [x] 3.1 Create `backend/routes/student.routes.js` with GET/PATCH `/api/student/profile`, GET `/api/student/my-sessions`, GET `/api/student/dashboard`
  - [x] 3.2 Register student routes in `backend/app.js`
  - Validates: Requirements 6.1, 6.2, 8.1, 8.2

- [x] 4. Frontend: Alumni My Sessions page
  - [x] 4.1 Create `frontend/src/app/(dashboard)/alumni/my-sessions/page.js` with upcoming/completed tabs, session cards, edit modal, delete confirmation
  - [x] 4.2 Create `frontend/src/app/(dashboard)/alumni/my-sessions/my-sessions.css`
  - Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10

- [x] 5. Frontend: Verify alumni Sidebar has My Sessions link
  - [x] 5.1 Confirm `frontend/src/app/components/Sidebar.js` has My Sessions item pointing to `/alumni/my-sessions`
  - Validates: Requirement 1.11

- [x] 6. Frontend: StudentSidebar component
  - [x] 6.1 Create `frontend/src/app/components/StudentSidebar.js` with Dashboard, My Sessions, Profile, Notifications, Messaging nav items using lucide-react icons, active state, and logout
  - Validates: Requirements 3.1, 3.2, 3.3, 3.6

- [x] 7. Frontend: Student layout
  - [x] 7.1 Create `frontend/src/app/(student-dashboard)/layout.js` wrapping student pages with StudentSidebar and Navbar
  - Validates: Requirements 3.4, 3.5

- [x] 8. Frontend: Student Dashboard page
  - [x] 8.1 Create `frontend/src/app/(student-dashboard)/student/dashboard/page.js` with stat cards and upcoming sessions list
  - [x] 8.2 Create `frontend/src/app/(student-dashboard)/student/dashboard/dashboard.css`
  - Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5

- [x] 9. Frontend: Student My Sessions page
  - [x] 9.1 Create `frontend/src/app/(student-dashboard)/student/my-sessions/page.js` with upcoming/completed tabs and session cards
  - [x] 9.2 Create `frontend/src/app/(student-dashboard)/student/my-sessions/my-sessions.css`
  - Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6

- [x] 10. Frontend: Student Profile page
  - [x] 10.1 Create `frontend/src/app/(student-dashboard)/student/profile/page.js` with view/edit mode, image preview, interests tag management
  - [x] 10.2 Create `frontend/src/app/(student-dashboard)/student/profile/profile.css`
  - Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8

- [x] 11. Frontend: Student Notifications page (frontend-only)
  - [x] 11.1 Create `frontend/src/app/(student-dashboard)/student/notifications/page.js` with mock notifications list and empty state
  - [x] 11.2 Create `frontend/src/app/(student-dashboard)/student/notifications/notifications.css`
  - Validates: Requirements 9.1, 9.2, 9.3, 9.4

- [x] 12. Frontend: Student Messaging page (frontend-only)
  - [x] 12.1 Create `frontend/src/app/(student-dashboard)/student/messages/page.js` with two-panel layout, mock contacts, mock thread, non-functional input
  - [x] 12.2 Create `frontend/src/app/(student-dashboard)/student/messages/messages.css`
  - Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6

- [ ]* 13. Property-based tests
  - [ ]* 13.1 Install fast-check in frontend dev dependencies
  - [ ]* 13.2 Create test file covering Properties 1–15 from the design doc
  - Validates: All correctness properties
