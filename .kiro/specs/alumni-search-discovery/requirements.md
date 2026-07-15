# Requirements Document

## Introduction

The Alumni Search and Discovery feature enables students to find and explore alumni profiles within the AlumniConnect platform. Students can search and filter alumni by name, college, company, job title, and skills. The feature provides a browsable grid of alumni cards at `/student/explore-alumni`, a public profile page at `/student/alumni/[id]` showing alumni details and upcoming sessions, and a backend search API. By default, the search surfaces alumni from the same college as the logged-in student. The StudentSidebar is updated to include an "Explore Alumni" navigation item.

## Glossary

- **Search_API**: The backend Express endpoint `GET /api/alumni/search` that queries and returns alumni profiles
- **Profile_API**: The backend Express endpoint `GET /api/alumni/:id` that returns a single alumni's full profile and sessions
- **Explore_Page**: The Next.js page at `/student/explore-alumni` where students browse and search alumni
- **Profile_Page**: The Next.js dynamic page at `/student/alumni/[id]` showing a single alumni's public profile
- **Alumni_Card**: A UI component displaying a summary of an alumni profile in the grid
- **AlumniProfile**: The MongoDB document containing alumni-specific data (department, company, skills, bio, rating, etc.)
- **User**: The MongoDB document containing base user data (name, email, role, college)
- **Session**: The MongoDB document representing a bookable session created by an alumni
- **StudentSidebar**: The navigation sidebar component used in the student dashboard layout
- **authFetch**: The frontend utility that attaches the JWT Bearer token to fetch requests

## Requirements

### Requirement 1: Alumni Search API

**User Story:** As a student, I want to search for alumni using filters, so that I can find relevant mentors based on my interests and background.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/alumni/search`, THE Search_API SHALL return a JSON response with shape `{ success: true, alumni: [...] }`
2. WHEN query parameters `name`, `college`, `company`, `jobTitle`, or `skills` are provided, THE Search_API SHALL apply only the provided filters using case-insensitive partial matching via MongoDB `$regex`
3. WHEN no query parameters are provided and the request includes a valid JWT, THE Search_API SHALL return alumni whose associated User has a `college` field matching the requesting student's college
4. WHEN no query parameters are provided and the request does not include a valid JWT, THE Search_API SHALL return all alumni profiles without college filtering
5. THE Search_API SHALL populate each result with the associated User's `name` and `college` fields
6. WHEN a `sort` query parameter of `rating` is provided, THE Search_API SHALL return results sorted by `rating` in descending order
7. WHEN a `sort` query parameter of `sessions` is provided, THE Search_API SHALL return results sorted by `totalSessions` in descending order
8. IF a database error occurs during search, THEN THE Search_API SHALL return a response with HTTP status 500 and `{ success: false, message: "Server error" }`

### Requirement 2: Alumni Public Profile API

**User Story:** As a student, I want to view a detailed alumni profile, so that I can learn about their background and available sessions before booking.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/alumni/:id` with a valid AlumniProfile `_id`, THE Profile_API SHALL return `{ success: true, alumni, user, sessions }`
2. THE Profile_API SHALL populate the `user` field with the associated User's `name` and `college`
3. THE Profile_API SHALL return only sessions with `status: "scheduled"` for that alumni, sorted by `startTime` ascending
4. IF the provided `:id` does not match any AlumniProfile document, THEN THE Profile_API SHALL return HTTP status 404 and `{ success: false, message: "Alumni not found" }`
5. IF a database error occurs, THEN THE Profile_API SHALL return HTTP status 500 and `{ success: false, message: "Server error" }`
6. THE Profile_API SHALL be accessible without authentication

### Requirement 3: Explore Alumni Page

**User Story:** As a student, I want a dedicated page to browse and search alumni, so that I can discover mentors relevant to my goals.

#### Acceptance Criteria

1. THE Explore_Page SHALL render at the route `/student/explore-alumni` within the student dashboard layout
2. THE Explore_Page SHALL display a search bar at the top of the page
3. THE Explore_Page SHALL display filter inputs for `name`, `college`, `company`, `jobTitle`, and `skills`
4. WHEN the page first loads, THE Explore_Page SHALL fetch and display alumni from the same college as the logged-in student by calling the Search_API with the student's auth token
5. WHEN a user types in the search bar or any filter input, THE Explore_Page SHALL wait 300ms after the last keystroke before sending a new request to the Search_API
6. WHILE a search request is in flight, THE Explore_Page SHALL display skeleton loading cards in place of the alumni grid
7. WHEN search results are returned, THE Explore_Page SHALL render the results as a responsive grid of Alumni_Cards
8. WHEN the Search_API returns an empty array, THE Explore_Page SHALL display a "No results found" empty state with an icon
9. THE Explore_Page SHALL provide a sort control allowing the student to sort results by highest rating or most sessions

### Requirement 4: Alumni Card Component

**User Story:** As a student, I want each alumni displayed as a card with key information, so that I can quickly assess relevance without opening each profile.

#### Acceptance Criteria

1. THE Alumni_Card SHALL display the alumni's profile image, or a placeholder image if none is set
2. THE Alumni_Card SHALL display the alumni's name, job title, and company in the format "Job Title @ Company"
3. THE Alumni_Card SHALL display up to 3 skills as tags
4. THE Alumni_Card SHALL display the alumni's star rating
5. THE Alumni_Card SHALL display a truncated version of the alumni's bio
6. WHEN a student clicks an Alumni_Card, THE Explore_Page SHALL navigate to `/student/alumni/[id]` where `[id]` is the AlumniProfile `_id`
7. THE Alumni_Card SHALL apply a hover animation when the cursor is positioned over the card

### Requirement 5: Alumni Public Profile Page

**User Story:** As a student, I want to view a full alumni profile page, so that I can see their complete background and available sessions.

#### Acceptance Criteria

1. THE Profile_Page SHALL render at the dynamic route `/student/alumni/[id]` within the student dashboard layout
2. WHEN the page loads, THE Profile_Page SHALL call the Profile_API using the `[id]` route parameter
3. THE Profile_Page SHALL display a header section containing the alumni's profile image, name, job title, company, skills, and bio
4. THE Profile_Page SHALL display a stats section showing the alumni's rating, total sessions count, and count of upcoming scheduled sessions
5. THE Profile_Page SHALL display a sessions section listing each scheduled session with its title, formatted start date and time, price, available seats (maxSeats minus currentSeats), and a "Book Session" button
6. WHILE the Profile_API request is in flight, THE Profile_Page SHALL display a loading state
7. IF the Profile_API returns a 404 response, THEN THE Profile_Page SHALL display a "Alumni not found" message
8. THE "Book Session" button SHALL be rendered as a UI element only, with no booking action wired up

### Requirement 6: StudentSidebar Navigation Update

**User Story:** As a student, I want an "Explore Alumni" link in the sidebar, so that I can navigate to the search page from anywhere in the dashboard.

#### Acceptance Criteria

1. THE StudentSidebar SHALL include a navigation item with the label "Explore Alumni" linking to `/student/explore-alumni`
2. THE StudentSidebar SHALL render a Compass or Search icon from `lucide-react` alongside the "Explore Alumni" label
3. WHEN the current route is `/student/explore-alumni`, THE StudentSidebar SHALL apply the active styling to the "Explore Alumni" item, consistent with other active menu items
