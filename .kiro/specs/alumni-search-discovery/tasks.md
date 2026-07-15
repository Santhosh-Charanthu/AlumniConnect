# Implementation Plan: Alumni Search and Discovery

## Overview

Implement the alumni search and discovery feature across backend and frontend. The backend adds an optional-auth middleware, two new controller functions, and two new routes. The frontend adds an AlumniCard component, an Explore Alumni page with debounced search, a public alumni profile page, and a StudentSidebar update.

## Tasks

- [x] 1. Add `optionalAuth` middleware to `backend/middleware/auth.middleware.js`
  - Export a named `optionalAuth` function alongside the existing default export
  - If `Authorization` header is present and the JWT is valid, set `req.user` and call `next()`
  - If the header is missing or the token is invalid/expired, call `next()` without setting `req.user` (no 401)
  - _Requirements: 1.3, 1.4_

- [x] 2. Implement `searchAlumni` and `getAlumniById` in `backend/controllers/alumni.controller.js`
  - [x] 2.1 Implement `searchAlumni`
    - Build a `$regex` query object from whichever of `name`, `college`, `company`, `jobTitle`, `skills` are present in `req.query`
    - If no filter params are provided and `req.user` exists, look up the student's User document by `req.user.userId`, read its `college`, and filter alumni by matching that college via a join/populate condition
    - If no filter params and no `req.user`, return all alumni (no college filter)
    - Populate `userId` with `name` and `college`
    - Apply sort: `sort=rating` → sort by `rating` desc; `sort=sessions` → sort by `totalSessions` desc
    - Return `{ success: true, alumni: [...] }` on success; `{ success: false, message: "Server error" }` with HTTP 500 on DB error
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 2.2 Write property test for `searchAlumni` — filter matching
    - **Property 1: Search filter results match provided params**
    - **Validates: Requirements 1.2**

  - [ ]* 2.3 Write property test for `searchAlumni` — default auth college filter
    - **Property 2: Default search with auth returns same-college alumni only**
    - **Validates: Requirements 1.3**

  - [ ]* 2.4 Write property test for `searchAlumni` — populated user fields
    - **Property 3: Search results always include populated user fields**
    - **Validates: Requirements 1.5**

  - [ ]* 2.5 Write property test for `searchAlumni` — sort ordering invariant
    - **Property 4: Sort ordering invariant**
    - **Validates: Requirements 1.6, 1.7**

  - [x] 2.6 Implement `getAlumniById`
    - Find `AlumniProfile` by `req.params.id`, populate `userId` with `name` and `college`
    - Return HTTP 404 `{ success: false, message: "Alumni not found" }` if not found
    - Find sessions where `alumniId` matches and `status === "scheduled"`, sorted by `startTime` ascending
    - Return `{ success: true, alumni, user: alumni.userId, sessions }` on success
    - Return HTTP 500 `{ success: false, message: "Server error" }` on DB error
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 2.7 Write property test for `getAlumniById` — response shape and populated user
    - **Property 5: Profile API response shape and populated user**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.8 Write property test for `getAlumniById` — sessions filter and order
    - **Property 6: Profile sessions are scheduled and ascending**
    - **Validates: Requirements 2.3**

- [x] 3. Register new routes in `backend/routes/alumni.routes.js`
  - Import `optionalAuth` from `auth.middleware.js`
  - Import `searchAlumni` and `getAlumniById` from `alumni.controller.js`
  - Add `router.get("/search", optionalAuth, searchAlumni)` BEFORE any parameterized routes
  - Add `router.get("/:id", getAlumniById)` BEFORE any existing parameterized routes
  - _Requirements: 1.1, 2.6_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create `AlumniCard` component
  - [x] 5.1 Create `frontend/src/app/components/AlumniCard.js`
    - Accept `{ alumni }` prop where alumni has `_id`, `profileImage.url`, `bio`, `company`, `jobTitle`, `skills[]`, `rating`, `userId.name`
    - Render profile image (`profileImage.url`) or a placeholder div/img if absent
    - Render alumni name, "JobTitle @ Company" string, up to 3 skill tags, star rating, and bio truncated to ~100 characters
    - On click, call `router.push(`/student/alumni/${alumni._id}`)`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Create `frontend/src/app/components/AlumniCard.css`
    - Style the card with image, name, job line, skill tags, rating, and bio sections
    - Add a hover animation (e.g. `transform: translateY` or `box-shadow` transition)
    - _Requirements: 4.7_

  - [ ]* 5.3 Write property test for `AlumniCard` — renders required fields
    - **Property 7: AlumniCard renders required fields for any alumni**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 5.4 Write property test for `AlumniCard` — click navigation
    - **Property 8: AlumniCard click navigates to correct profile route**
    - **Validates: Requirements 4.6**

- [x] 6. Create Explore Alumni page
  - [x] 6.1 Create `frontend/src/app/(student-dashboard)/student/explore-alumni/page.js`
    - Declare state: `filters` (`{ name, college, company, jobTitle, skills }`), `sort`, `alumni`, `loading`
    - On mount, call `authFetch` GET `/api/alumni/search` (no params — backend applies college filter from JWT)
    - On any filter or sort change, apply a 300ms debounce before rebuilding the query string and calling `authFetch`
    - While `loading` is true, render skeleton loading cards
    - When `alumni.length > 0`, render a responsive grid of `AlumniCard` components
    - When `alumni.length === 0` and not loading, render a "No results found" empty state with an icon
    - Render a sort control with "Highest Rating" (`sort=rating`) and "Most Sessions" (`sort=sessions`) options
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 6.2 Create `frontend/src/app/(student-dashboard)/student/explore-alumni/explore-alumni.css`
    - Style the page layout: search/filter bar at top, responsive card grid, skeleton cards, empty state
    - _Requirements: 3.6, 3.7, 3.8_

  - [ ]* 6.3 Write property test for debounce behavior
    - **Property 10: Debounce — API called at most once per input burst**
    - **Validates: Requirements 3.5**

- [x] 7. Create Alumni Public Profile page
  - [x] 7.1 Create `frontend/src/app/(student-dashboard)/student/alumni/[id]/page.js`
    - On mount, fetch GET `http://localhost:5000/api/alumni/${id}` (plain `fetch`, no auth)
    - While loading, render a loading state
    - If the response is 404, render "Alumni not found" message
    - Render header: profile image (or placeholder), name, job title, company, skills, bio
    - Render stats section: rating, `totalSessions`, and count of upcoming sessions (`sessions.length`)
    - Render sessions list: for each session show title, formatted `startTime`, price, available seats (`maxSeats - currentSeats`), and a "Book Session" button (UI only, no action)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 7.2 Create `frontend/src/app/(student-dashboard)/student/alumni/[id]/alumni-profile.css`
    - Style the header, stats, and sessions list sections
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 7.3 Write property test for profile page — renders all required alumni data
    - **Property 9: Profile page renders all required alumni data**
    - **Validates: Requirements 5.3, 5.4, 5.5**

- [x] 8. Update `StudentSidebar` to add "Explore Alumni" nav item
  - Import `Compass` from `lucide-react`
  - Add `{ name: "Explore Alumni", href: "/student/explore-alumni", icon: Compass }` to `menuItems` after "My Sessions"
  - The existing `isActive` logic already handles active styling via `pathname === item.href`
  - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 8.1 Write property test for sidebar active state
    - **Property 11: Sidebar active state matches current route**
    - **Validates: Requirements 6.3**

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Routes 3 (`/search` and `/:id`) must be registered before any existing parameterized routes to avoid route conflicts
- The "Book Session" button is UI-only — no booking logic is wired up in this feature
- Property tests use fast-check with a minimum of 100 iterations per test
