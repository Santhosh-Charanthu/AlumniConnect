# Requirements Document

## Introduction

This feature extends an existing Next.js + Node.js/Express + MongoDB alumni-student connect platform. It adds a dedicated "My Sessions" page for alumni with full CRUD, and builds the entire student-facing frontend (dashboard, my sessions, profile, notifications, messaging) along with a student sidebar and layout. New backend endpoints are required for session CRUD operations and student profile/session management. The UI uses plain CSS and lucide-react icons throughout.

## Glossary

- **System**: The alumni-student connect platform as a whole
- **Alumni_Dashboard**: The existing alumni dashboard page at `/alumni/dashboard`
- **Alumni_My_Sessions**: The new dedicated sessions management page for alumni at `/alumni/my-sessions`
- **Session**: A scheduled or completed mentoring/webinar event created by an alumni, stored in the Session model
- **Student_Dashboard**: The new overview page for students at `/student/dashboard`
- **Student_My_Sessions**: The new page showing sessions a student has registered for at `/student/my-sessions`
- **Student_Profile**: The new page for students to view and edit their profile at `/student/profile`
- **Student_Notifications**: The new frontend-only notifications page at `/student/notifications`
- **Student_Messaging**: The new frontend-only messaging page at `/student/messages`
- **Student_Sidebar**: The new sidebar component for student-facing pages
- **Student_Layout**: The new Next.js layout wrapping all student pages with Student_Sidebar and Navbar
- **Alumni_Sidebar**: The existing `Sidebar.js` component used in the alumni dashboard layout
- **Session_Controller**: The backend controller handling session CRUD operations
- **Student_Controller**: The backend controller handling student profile and session queries
- **authFetch**: The existing frontend utility that attaches the JWT Bearer token to all API requests
- **Registration**: The MongoDB model linking a student to a session they have registered for
- **StudentProfile**: The MongoDB model storing student-specific profile data (department, batchYear, interests, profileImage)
- **JWT**: JSON Web Token stored in `localStorage` under the key `"token"`, used for authentication

---

## Requirements

### Requirement 1: Alumni My Sessions Page

**User Story:** As an alumni, I want a dedicated My Sessions page, so that I can manage all my sessions in one place without relying on the dashboard.

#### Acceptance Criteria

1. THE Alumni_My_Sessions SHALL display all sessions belonging to the authenticated alumni, fetched from the backend.
2. WHEN the page loads, THE Alumni_My_Sessions SHALL categorize sessions into "Upcoming" (startTime in the future) and "Completed" (startTime in the past or status is completed) tabs.
3. WHEN the alumni clicks the "Upcoming" or "Completed" tab, THE Alumni_My_Sessions SHALL display only the sessions matching that category.
4. THE Alumni_My_Sessions SHALL display each session card with: title, cover image, date, time, duration, enrolled student count, price, category, and status.
5. WHEN the alumni clicks "Edit" on a session card, THE Alumni_My_Sessions SHALL open an edit form pre-populated with the session's existing data.
6. WHEN the alumni submits the edit form with valid data, THE Session_Controller SHALL update the session in the database and THE Alumni_My_Sessions SHALL reflect the updated data.
7. WHEN the alumni clicks "Delete" on a session card, THE Alumni_My_Sessions SHALL prompt for confirmation before deletion.
8. WHEN the alumni confirms deletion, THE Session_Controller SHALL delete the session from the database and THE Alumni_My_Sessions SHALL remove the card from the list.
9. IF the alumni submits the edit form with missing required fields (title, startTime, duration, meetLink, category), THEN THE Alumni_My_Sessions SHALL display a validation error message without submitting.
10. IF a backend request fails, THEN THE Alumni_My_Sessions SHALL display an error notification using the existing Toast system.
11. THE Alumni_Sidebar SHALL include a "My Sessions" navigation item linking to `/alumni/my-sessions`.

---

### Requirement 2: Session CRUD Backend Endpoints

**User Story:** As an alumni, I want backend endpoints to get, edit, and delete individual sessions, so that the My Sessions page can perform full CRUD operations.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/alumni/sessions/:id` with a valid JWT, THE Session_Controller SHALL return the session document if the authenticated alumni owns it.
2. WHEN a PATCH request is made to `/api/alumni/sessions/:id` with valid fields and a valid JWT, THE Session_Controller SHALL update the session and return the updated document.
3. WHEN a DELETE request is made to `/api/alumni/sessions/:id` with a valid JWT, THE Session_Controller SHALL delete the session and return a success response.
4. IF the session does not belong to the authenticated alumni, THEN THE Session_Controller SHALL return a 403 Forbidden response.
5. IF the session ID does not exist, THEN THE Session_Controller SHALL return a 404 Not Found response.
6. WHEN a PATCH request includes a new cover image file, THE Session_Controller SHALL upload the image via the existing Cloudinary middleware and update the coverImage field.

---

### Requirement 3: Student Layout and Sidebar

**User Story:** As a student, I want a consistent sidebar navigation, so that I can move between all student pages easily.

#### Acceptance Criteria

1. THE Student_Sidebar SHALL display navigation items for: Dashboard (`/student/dashboard`), My Sessions (`/student/my-sessions`), Profile (`/student/profile`), Notifications (`/student/notifications`), and Messaging (`/student/messages`).
2. THE Student_Sidebar SHALL highlight the currently active route using a distinct visual style matching the alumni sidebar's active state.
3. THE Student_Sidebar SHALL include a Logout button that clears the JWT from localStorage and redirects to `/login`.
4. THE Student_Layout SHALL wrap all pages under `/student/*` with Student_Sidebar and the existing Navbar component.
5. THE Student_Layout SHALL be responsive, collapsing the sidebar on mobile with an overlay toggle matching the alumni layout behavior.
6. THE Student_Sidebar SHALL use lucide-react icons for all navigation items.

---

### Requirement 4: Student Dashboard

**User Story:** As a student, I want a dashboard overview, so that I can see my activity stats and browse available sessions.

#### Acceptance Criteria

1. WHEN the Student_Dashboard loads, THE Student_Dashboard SHALL fetch and display the authenticated student's profile and registered sessions from the backend.
2. THE Student_Dashboard SHALL display stat cards showing: total registered sessions, upcoming sessions count, and completed sessions count.
3. THE Student_Dashboard SHALL display a list of the student's upcoming registered sessions with session title, alumni name, date, time, and status.
4. IF the student has no registered sessions, THEN THE Student_Dashboard SHALL display an empty state message.
5. IF a backend request fails, THEN THE Student_Dashboard SHALL display an error notification using the existing Toast system.

---

### Requirement 5: Student My Sessions Page

**User Story:** As a student, I want to see all sessions I have registered for, so that I can track my upcoming and completed learning sessions.

#### Acceptance Criteria

1. WHEN the Student_My_Sessions page loads, THE Student_My_Sessions SHALL fetch all registrations for the authenticated student from the backend.
2. THE Student_My_Sessions SHALL categorize sessions into "Upcoming" (startTime in the future) and "Completed" (startTime in the past) tabs.
3. WHEN the student clicks a tab, THE Student_My_Sessions SHALL display only sessions matching that category.
4. THE Student_My_Sessions SHALL display each session card with: title, cover image, alumni name, date, time, duration, category, and status.
5. IF the student has no sessions in a category, THEN THE Student_My_Sessions SHALL display an empty state message for that tab.
6. IF a backend request fails, THEN THE Student_My_Sessions SHALL display an error notification using the existing Toast system.

---

### Requirement 6: Student Sessions Backend Endpoint

**User Story:** As a student, I want a backend endpoint to retrieve my registered sessions, so that the student frontend can display them.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/student/my-sessions` with a valid JWT, THE Student_Controller SHALL return all Registration documents for the authenticated student, with the associated Session and alumni User data populated.
2. WHEN a GET request is made to `/api/student/dashboard` with a valid JWT, THE Student_Controller SHALL return the student's profile and aggregated session stats (total, upcoming, completed counts).
3. IF no registrations exist for the student, THEN THE Student_Controller SHALL return an empty array with a success response.

---

### Requirement 7: Student Profile Page

**User Story:** As a student, I want to view and edit my profile, so that I can keep my information up to date.

#### Acceptance Criteria

1. WHEN the Student_Profile page loads, THE Student_Profile SHALL fetch and display the authenticated student's profile data: name, department, batchYear, interests, and profile image.
2. WHEN the student clicks "Edit Profile", THE Student_Profile SHALL display an editable form pre-populated with the current profile data.
3. WHEN the student submits the edit form with valid data, THE Student_Controller SHALL update the StudentProfile in the database and THE Student_Profile SHALL display the updated data.
4. WHEN the student selects a new profile image, THE Student_Profile SHALL preview the selected image before submission.
5. WHEN the student submits a new profile image, THE Student_Controller SHALL upload it via the existing Cloudinary middleware and update the profileImage field.
6. THE Student_Profile SHALL allow the student to add and remove interests as a list of text tags.
7. IF the student submits the form with an empty name field, THEN THE Student_Profile SHALL display a validation error without submitting.
8. IF a backend request fails, THEN THE Student_Profile SHALL display an error notification using the existing Toast system.

---

### Requirement 8: Student Profile Backend Endpoints

**User Story:** As a student, I want backend endpoints to get and update my profile, so that the student profile page can read and persist changes.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/student/profile` with a valid JWT, THE Student_Controller SHALL return the StudentProfile document for the authenticated student, with the associated User name and email populated.
2. WHEN a PATCH request is made to `/api/student/profile` with valid fields and a valid JWT, THE Student_Controller SHALL update the StudentProfile and return the updated document.
3. WHEN a PATCH request to `/api/student/profile` includes a profile image file, THE Student_Controller SHALL upload it via the existing Cloudinary middleware and store the resulting URL and filename.
4. IF no StudentProfile exists for the authenticated user, THEN THE Student_Controller SHALL create one and return it.
5. IF a PATCH request is made with an invalid batchYear (non-numeric or outside the range 1900–2100), THEN THE Student_Controller SHALL return a 400 Bad Request response.

---

### Requirement 9: Student Notifications Page (Frontend Only)

**User Story:** As a student, I want a notifications page, so that I can see a placeholder UI for future notification features.

#### Acceptance Criteria

1. THE Student_Notifications SHALL render a page accessible at `/student/notifications` within the Student_Layout.
2. THE Student_Notifications SHALL display a list of mock notification items with a title, description, timestamp, and read/unread visual indicator.
3. THE Student_Notifications SHALL display a "No new notifications" empty state when the mock list is empty.
4. THE Student_Notifications SHALL use lucide-react icons for notification type indicators.

---

### Requirement 10: Student Messaging Page (Frontend Only)

**User Story:** As a student, I want a messaging page, so that I can see a placeholder UI for future messaging features.

#### Acceptance Criteria

1. THE Student_Messaging SHALL render a page accessible at `/student/messages` within the Student_Layout.
2. THE Student_Messaging SHALL display a two-panel layout: a conversation list on the left and a message thread area on the right.
3. THE Student_Messaging SHALL populate the conversation list with mock contact entries showing a name, avatar placeholder, and last message preview.
4. WHEN a mock conversation is selected, THE Student_Messaging SHALL display mock messages in the thread panel.
5. THE Student_Messaging SHALL render a message input field and send button in the thread panel (non-functional, UI only).
6. THE Student_Messaging SHALL use lucide-react icons for UI elements such as send, search, and back navigation.
