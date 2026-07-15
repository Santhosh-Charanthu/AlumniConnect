# AlumniConnect — Technical Report

---

## 1. System Architecture

AlumniConnect is a full-stack web application built on a decoupled client-server model with a persistent WebSocket layer running alongside the REST API on the same HTTP server.

```
┌─────────────────────────────────────────────────────────┐
│                  Browser (Next.js 16 / React 19)        │
│                                                         │
│   REST (Axios)  ◄──────────────────►  Socket.IO Client  │
└────────┬────────────────────────────────────┬───────────┘
         │ HTTP/HTTPS                         │ WebSocket
         ▼                                    ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js — Express 5 + Socket.IO 4          │
│                                                         │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────┐  │
│  │ REST API │  │ Socket.IO │  │Cloudinary│  │Razorpay│ │
│  └────┬─────┘  └─────┬─────┘  └──────────┘  └───────┘  │
│       │              │                │                  │
│       ▼              ▼                │ HTTP (internal)  │
│         MongoDB (Mongoose 9)          ▼                  │
│         Nodemailer / Gmail SMTP  ┌─────────────────┐    │
│                                  │  Python / Flask  │    │
│                                  │  AI Service      │    │
│                                  │  (all-MiniLM-L6) │    │
│                                  └─────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

The HTTP server is created with `http.createServer(app)`. Socket.IO is initialised on the same server instance via `initSocket(httpServer)`, so both REST and WebSocket traffic share a single port. The `io` instance is stored on the Express app (`app.set('io', io)`) so controllers can emit events directly.

---

## 2. Tech Stack

### Backend

| Layer          | Technology                         | Version       |
| -------------- | ---------------------------------- | ------------- |
| Runtime        | Node.js                            | LTS           |
| Framework      | Express                            | 5.1.0         |
| Database ODM   | Mongoose                           | 9.0.0         |
| Authentication | jsonwebtoken + bcryptjs            | 9.0.2 / 3.0.3 |
| Real-time      | Socket.IO                          | 4.8.1         |
| File uploads   | Multer + multer-storage-cloudinary | 2.0.2 / 4.0.0 |
| Media CDN      | Cloudinary                         | v1.41.3       |
| Payments       | Razorpay SDK                       | 2.9.6         |
| Email          | Nodemailer                         | 8.0.4         |
| Validation     | Joi                                | 18.0.2        |
| Security       | helmet + express-rate-limit        | 8.1.0 / 8.2.1 |
| Environment    | dotenv                             | 17.2.3        |

### Frontend

| Layer       | Technology                     | Version |
| ----------- | ------------------------------ | ------- |
| Framework   | Next.js (App Router)           | 16.1.1  |
| UI Library  | React                          | 19.2.3  |
| Icons       | lucide-react                   | 0.577.0 |
| HTTP client | Axios                          | 1.14.0  |
| Real-time   | socket.io-client               | 4.8.3   |
| Styling     | Plain CSS Modules + global CSS | —       |
| Payment UI  | Razorpay Checkout.js           | CDN     |

---

## 3. Database Schema & Relationships

### 3.1 Entity Map

```
User  ──────────────────────────────────────────────────────────────────┐
 │  (role: student | alumni | admin)                                     │
 │  email must contain .edu (Mongoose custom validator)                  │
 │                                                                       │
 ├──1:1── AlumniProfile                                                  │
 │           ├── experiences[]  → Experience                             │
 │           ├── projects[]     → Project                                │
 │           └── achievements[] → Achievement                            │
 │                                                                       │
 └──1:1── StudentProfile                                                 │
              └── followedAlumni[] → User                                │
                                                                         │
Session (alumniId → AlumniProfile._id)                                   │
 ├── Registration[] (studentId → User, sessionId → Session)              │
 ├── Transaction[]  (userId → User, sessionId → Session)                 │
 ├── Review[]       (studentId → User, alumniId → User)                  │
 └── GroupChat      (1:1 auto-created on session creation)               │
       └── Message[] (senderId → User, receiverId → User | groupId)      │
                                                                         │
Notification (userId → User, polymorphic type enum)  ───────────────────┘
```

### 3.2 Critical Indexes

```js
// Prevent double-payment
Transaction.index({ userId: 1, sessionId: 1 }, { unique: true });

// Prevent duplicate registration
Registration.index({ sessionId: 1, studentId: 1 }, { unique: true });

// Fast DM thread queries
Message.index({ senderId: 1, receiverId: 1 });

// Fast group message queries with time ordering
Message.index({ groupId: 1, createdAt: -1 });

// Fast group membership lookups
GroupChat.index({ "members.user": 1 });

// Razorpay ID lookups
Transaction.index({ razorpayOrderId: 1 });
Transaction.index({ razorpayPaymentId: 1 });
```

### 3.3 Model Summaries

**User**

```
name, email (.edu enforced), password (bcrypt), role (student|alumni|admin),
college, isVerified, otp, otpExpiresAt
```

**AlumniProfile**

```
userId (ref User), profileImage {url, filename}, department, batchYear,
company, jobTitle, skills[], bio, about, hourlyRate, availability,
rating, totalSessions, experiences[], projects[], achievements[]
```

**StudentProfile**

```
userId (ref User), profileImage {url, filename}, department, batchYear,
interests[], followedAlumni[]
```

**Session**

```
alumniId (ref AlumniProfile), title, coverImage, description, startTime,
deadline, duration (minutes), price, isPaid, bookedStudents[], currentSeats,
category, rating, reviewsCount, status (scheduled|live|completed|cancelled),
meetLink, actualStartTime, actualEndTime
```

**Registration**

```
sessionId, studentId, isActive (soft-delete), attended
```

**Transaction**

```
userId, sessionId, amount (INR), razorpayOrderId, razorpayPaymentId,
status (paid|pending|refund_pending|refunded|failed)
```

**Message**

```
senderId, receiverId (DM), groupId (group), type (direct|group),
content, isRead, readBy[], edited, isSystem,
mediaUrl, mediaType (image|video|pdf), mediaName
```

**GroupChat**

```
name, description, createdBy, members[{user, role (admin|member), joinedAt}],
sessionId (optional link), isActive, lastMessage, lastMessageAt
```

**Notification**

```
userId, type (session_booking|group_invite|session_cancelled|
new_session|session_live|session_completed), message, meta (Mixed), isRead
```

**Review**

```
sessionId, studentId, alumniId, rating (1–5), comment
```

**Experience / Project / Achievement** — alumni profile sub-documents stored as separate collections and referenced by ObjectId arrays on AlumniProfile.

---

## 4. Authentication & Authorization

### 4.1 Registration — 3-Step OTP Flow

```
Step 1 — POST /api/auth/send-otp
  ├── Validate .edu domain (split on @, check parts[1].includes('.edu'))
  ├── Check for existing verified user → 409 if found
  ├── crypto.randomInt(100000, 999999) → 6-digit OTP
  ├── otpExpiresAt = Date.now() + 10 * 60 * 1000
  ├── User.findOneAndUpdate({ email }, { otp, otpExpiresAt }, { upsert: true })
  └── sendOtpEmail(email, otp) via Nodemailer

Step 2 — POST /api/auth/verify-otp
  ├── Find user by email, check otp field exists
  ├── Check otpExpiresAt > now
  ├── Compare otp strings (trimmed)
  └── Clear otp + otpExpiresAt, save({ validateBeforeSave: false })

Step 3 — POST /api/auth/register  (multipart/form-data)
  ├── Confirm user exists with otp cleared (= verified)
  ├── bcrypt.hash(password, 10)
  ├── Upload profile image → Cloudinary (via Multer middleware)
  ├── Update User: name, password, role, college, isVerified = true
  ├── Create AlumniProfile or StudentProfile with parsed skills/interests
  └── jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' }) → return token
```

### 4.2 Login

```
POST /api/auth/login
  ├── User.findOne({ email })
  ├── bcrypt.compare(password, user.password)
  ├── Optional role check (if role param provided, must match user.role)
  └── jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' }) → return token
```

### 4.3 Middleware

**authMiddleware** (applied to all protected routes):

```js
const token = req.headers.authorization.split(" ")[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // { userId, role }
```

**optionalAuth** — same logic but non-blocking; used on alumni search so unauthenticated requests still work but authenticated requests get college-filtered defaults.

**Socket.IO auth middleware:**

```js
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.userId;
  socket.userRole = decoded.role;
  next();
});
```

---

## 5. REST API — Full Endpoint Reference

### Auth `/api/auth`

| Method | Path        | Auth | Description                       |
| ------ | ----------- | ---- | --------------------------------- |
| POST   | /send-otp   | No   | Send OTP to .edu email            |
| POST   | /verify-otp | No   | Verify OTP                        |
| POST   | /register   | No   | Complete registration (multipart) |
| POST   | /login      | No   | Login, returns JWT                |

### Alumni `/api/alumni`

| Method | Path                       | Auth     | Description                      |
| ------ | -------------------------- | -------- | -------------------------------- |
| GET    | /profile                   | Yes      | Own profile (populated)          |
| PUT    | /profile                   | Yes      | Update profile + optional image  |
| PUT    | /about                     | Yes      | Update about section             |
| POST   | /sessions                  | Yes      | Create session + auto GroupChat  |
| GET    | /sessions                  | Yes      | Own sessions list                |
| GET    | /sessions/:id              | Yes      | Single session (ownership check) |
| PUT    | /sessions/:id              | Yes      | Update session                   |
| DELETE | /sessions/:id              | Yes      | Delete + refund + notify         |
| POST   | /sessions/:id/start        | Yes      | Set live, provide meet link      |
| POST   | /sessions/:id/end          | Yes      | Set completed                    |
| GET    | /sessions/:id/participants | Yes      | Registered students list         |
| GET    | /search                    | Optional | Search/filter alumni             |
| GET    | /:id                       | No       | Public alumni profile            |
| GET    | /notifications             | Yes      | Alumni notifications             |
| PUT    | /notifications/read        | Yes      | Mark all read                    |

### Student `/api/student`

| Method | Path                            | Auth | Description                          |
| ------ | ------------------------------- | ---- | ------------------------------------ |
| GET    | /profile                        | Yes  | Own profile                          |
| PUT    | /profile                        | Yes  | Update profile + optional image      |
| GET    | /dashboard                      | Yes  | Stats + upcoming sessions            |
| GET    | /sessions                       | Yes  | Registered sessions                  |
| GET    | /sessions/upcoming              | Yes  | All scheduled future sessions        |
| GET    | /sessions/:id                   | Yes  | Session detail + registration status |
| POST   | /sessions/:sessionId/register   | Yes  | Register (free sessions only)        |
| DELETE | /sessions/:sessionId/unregister | Yes  | Unregister + refund if paid          |
| POST   | /sessions/:sessionId/attend     | Yes  | Mark attendance (first 30 min)       |
| GET    | /sessions/:sessionId/meet-link  | Yes  | Get meet link (live only)            |
| POST   | /sessions/:sessionId/review     | Yes  | Submit review (completed only)       |
| PUT    | /reviews/:reviewId              | Yes  | Update own review                    |
| GET    | /sessions/:sessionId/reviews    | Yes  | All reviews for session              |
| GET    | /bookings                       | Yes  | Payment transaction history          |
| POST   | /groups/:groupId/join           | Yes  | Join session group chat              |
| GET    | /notifications                  | Yes  | Student notifications                |
| PUT    | /notifications/read             | Yes  | Mark all read                        |

### Payment `/api/payment`

| Method | Path     | Auth      | Description                     |
| ------ | -------- | --------- | ------------------------------- |
| POST   | /order   | Yes       | Create Razorpay order           |
| POST   | /verify  | Yes       | Verify payment signature + book |
| POST   | /webhook | No (HMAC) | Razorpay webhook handler        |

### Chat `/api/chat`

| Method | Path                      | Auth | Description                       |
| ------ | ------------------------- | ---- | --------------------------------- |
| GET    | /dm/:userId               | Yes  | Paginated DM history              |
| GET    | /dm/conversations         | Yes  | Conversation list + unread counts |
| POST   | /groups                   | Yes  | Create group chat                 |
| GET    | /groups                   | Yes  | My groups + unread counts         |
| GET    | /groups/:groupId/messages | Yes  | Paginated group history           |
| POST   | /groups/:groupId/members  | Yes  | Add members (admin only)          |
| DELETE | /groups/:groupId/leave    | Yes  | Leave group                       |
| GET    | /unread-count             | Yes  | Total unread DM + group count     |
| POST   | /upload                   | Yes  | Upload chat media to Cloudinary   |
| GET    | /proxy-download           | Yes  | Proxy Cloudinary PDF download     |

### AI `/api/ai`

| Method | Path            | Auth | Description                                       |
| ------ | --------------- | ---- | ------------------------------------------------- |
| GET    | /matched-alumni | Yes  | Returns top-5 alumni matched to student interests |

### Other

| Method | Path              | Description                |
| ------ | ----------------- | -------------------------- |
| POST   | /api/contact      | Contact form → Nodemailer  |
| CRUD   | /api/experience   | Alumni experience entries  |
| CRUD   | /api/projects     | Alumni project entries     |
| CRUD   | /api/achievements | Alumni achievement entries |

---

## 6. Payment Technical Workflow

### 6.1 Order Creation

```
POST /api/payment/order
  ├── Authenticate user (JWT)
  ├── Session.findById(sessionId)
  ├── Validate: status === 'scheduled', deadline not passed
  ├── Registration.findOne({ sessionId, studentId, isActive: true }) → 400 if exists
  ├── Transaction.findOne({ userId, sessionId, status: 'paid' }) → 400 if exists
  ├── razorpay.orders.create({ amount: price * 100, currency: 'INR', receipt })
  └── Return { order_id, amount, currency }
```

### 6.2 Payment Verification

```
POST /api/payment/verify
  ├── Extract: razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId
  ├── HMAC-SHA256: hmac(razorpay_order_id + '|' + razorpay_payment_id, RAZORPAY_KEY_SECRET)
  ├── Compare expectedSignature === razorpay_signature → 400 on mismatch
  ├── Transaction.findOne({ razorpayPaymentId }) → return alreadyBooked if exists
  ├── Transaction.create({ userId, sessionId, razorpayOrderId, razorpayPaymentId, amount, status: 'paid' })
  ├── registerStudent({ userId, sessionId, req })
  │     ├── Registration.create / reactivate
  │     ├── Session.$inc currentSeats, $addToSet bookedStudents
  │     ├── Notification.create for alumni (session_booking)
  │     ├── Notification.create for student (group_invite)
  │     ├── Socket: emit notification:new to online users
  │     └── Socket: socketsJoin group room for student
  └── Return { success: true }
```

### 6.3 Webhook Handler

```
POST /api/payment/webhook  (raw body, registered before express.json())
  ├── HMAC-SHA256 verify against RAZORPAY_WEBHOOK_SECRET
  ├── Parse event from raw buffer
  ├── event === 'refund.processed'
  │     └── Transaction.findOneAndUpdate({ razorpayPaymentId }, { status: 'refunded' })
  └── Return { success: true }
```

### 6.4 Refund Flow

```
Student unregisters (> 1 hour before session start)
  ├── Registration.isActive = false
  ├── Transaction.status = 'refund_pending'
  ├── razorpay.payments.refund(razorpayPaymentId, { amount: price * 100 })
  │     └── On failure: rollback Transaction.status = 'paid', return 500
  ├── Session.$inc currentSeats -1, $pull bookedStudents
  ├── Remove student from GroupChat.members
  ├── Post system message in group: "X left the group"
  └── Notify alumni via Notification + Socket

Session deleted by alumni
  ├── Transaction.find({ sessionId }) → Promise.allSettled(refunds)
  ├── Registration.updateMany({ sessionId }, { isActive: false })
  ├── Notification.create for each registered student (session_cancelled)
  ├── GroupChat: post system cancel message, set isActive = false
  ├── Socket: emit group:receive (cancel msg) + group:deactivated
  └── Session.findByIdAndDelete
```

---

## 7. Real-Time Layer — Socket.IO

### 7.1 Connection & Auth

```js
// Server-side middleware
io.use((socket, next) => {
  const decoded = jwt.verify(socket.handshake.auth.token, JWT_SECRET);
  socket.userId = decoded.userId;
  next();
});

// On connect
onlineUsers.set(userId, socket.id);
io.emit("user:online", { userId });

// Auto-join all group rooms
const groups = await GroupChat.find({ "members.user": userId });
groups.forEach((g) => socket.join(`group:${g._id}`));
```

### 7.2 Event Reference

| Event               | Direction | Payload                                           | Behaviour                                                                   |
| ------------------- | --------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| `dm:send`           | C→S       | `{ to, content, mediaUrl, mediaType, mediaName }` | Persist Message, deliver to recipient socket, echo to sender                |
| `dm:receive`        | S→C       | populated Message                                 | Incoming DM                                                                 |
| `dm:read`           | C→S       | `{ from }`                                        | `Message.updateMany` isRead=true, emit `dm:read_ack` to sender              |
| `dm:read_ack`       | S→C       | `{ by }`                                          | Sender knows messages were read                                             |
| `group:send`        | C→S       | `{ groupId, content, mediaUrl, ... }`             | Verify membership, persist, update GroupChat.lastMessage, broadcast to room |
| `group:receive`     | S→C       | populated Message                                 | Incoming group message                                                      |
| `group:read`        | C→S       | `{ groupId }`                                     | `$addToSet readBy`, notify senders via `group:read_ack`                     |
| `group:read_ack`    | S→C       | `{ groupId, readBy, totalMembers }`               | Read receipt data                                                           |
| `group:join_room`   | C→S       | `{ groupId }`                                     | On-demand room join for newly created groups                                |
| `group:deactivated` | S→C       | `{ groupId }`                                     | Group closed (session cancelled)                                            |
| `message:edit`      | C→S       | `{ messageId, content }`                          | Update content + edited=true, broadcast `message:edited`                    |
| `message:edited`    | S→C       | populated Message                                 | Updated message                                                             |
| `message:delete`    | C→S       | `{ messageId }`                                   | Delete doc, broadcast `message:deleted`                                     |
| `message:deleted`   | S→C       | `{ messageId }`                                   | Remove from UI                                                              |
| `typing:start`      | C→S       | `{ to?, groupId? }`                               | Forward to recipient or room                                                |
| `typing:stop`       | C→S       | `{ to?, groupId? }`                               | Forward to recipient or room                                                |
| `notification:new`  | S→C       | Notification doc                                  | Push live notification                                                      |
| `user:online`       | S→C       | `{ userId }`                                      | Presence update                                                             |
| `user:offline`      | S→C       | `{ userId }`                                      | Presence update                                                             |

### 7.3 Online Presence

```js
const onlineUsers = new Map(); // userId (string) → socketId (string)
```

In-memory map. Exported from `socket.js` and imported by controllers to target specific sockets. Not suitable for multi-process deployment without a Redis adapter.

### 7.4 Unread Count Aggregation (REST)

```js
// Unread DMs
Message.countDocuments({ type: "direct", receiverId: me, isRead: false });

// Unread group messages (not sent by me, not in my readBy)
Message.countDocuments({
  type: "group",
  groupId: { $in: myGroupIds },
  senderId: { $ne: me },
  readBy: { $nin: [me] },
});
```

---

## 8. Session Lifecycle — State Machine

```
                    ┌─────────────┐
                    │  scheduled  │ ← default on creation
                    └──────┬──────┘
                           │ alumni calls POST /sessions/:id/start
                           │ (±60 min window, meetLink required)
                           ▼
                    ┌─────────────┐
                    │    live     │
                    └──────┬──────┘
                           │ alumni calls POST /sessions/:id/end
                           │ (≥50% of duration elapsed)
                           ▼
                    ┌─────────────┐
                    │  completed  │ → students can submit reviews
                    └─────────────┘

  Any state → cancelled  (via DELETE /sessions/:id)
              triggers: refunds, group deactivation, notifications
```

---

## 9. Notification System

### 9.1 Types & Recipients

| Type                | Recipient               | Trigger                          |
| ------------------- | ----------------------- | -------------------------------- |
| `session_booking`   | Alumni                  | Student registers or unregisters |
| `group_invite`      | Student                 | After successful registration    |
| `session_cancelled` | Student (registered)    | Alumni deletes session           |
| `new_session`       | Students (same college) | Alumni creates session           |
| `session_live`      | Students (registered)   | Alumni starts session            |
| `session_completed` | Students (registered)   | Alumni ends session              |

### 9.2 Delivery Pipeline

```
1. Notification.create({ userId, type, message, meta })
2. Notification post('save') hook → sendNotificationEmail(doc) [fire-and-forget]
3. onlineUsers.get(userId.toString()) → socketId
4. io.to(socketId).emit('notification:new', notif)
```

### 9.3 Role Filtering

- Alumni query: `type: { $ne: 'group_invite' }`
- Student query: `type: { $in: ['group_invite', 'session_cancelled', 'new_session', 'session_live', 'session_completed'] }`

### 9.4 group_invite Enrichment

For each `group_invite` notification returned to a student, the controller checks `GroupChat.findOne({ _id: meta.groupId, 'members.user': userId })` and appends `meta.alreadyJoined = true/false` so the frontend can show the correct CTA.

---

## 10. Media Handling

### 10.1 Profile & Session Cover Images

- Multer configured with `multer-storage-cloudinary` — streams directly to Cloudinary during multipart upload
- `req.file.path` = Cloudinary secure URL, `req.file.filename` = public_id
- On update: `cloudinary.uploader.destroy(oldFilename)` before uploading new

### 10.2 Chat Media

- Multer with `memoryStorage()` — file buffered in memory
- Uploaded via `cloudinary.uploader.upload_stream` to `alumniconnect/chat/` folder
- `resource_type` set based on MIME: `image/*` → `image`, `video/*` → `video`, `application/pdf` → `image` (Cloudinary handles PDF as image resource)
- Returns `{ url, mediaType, mediaName }` to client

### 10.3 PDF Proxy Download

```
GET /api/chat/proxy-download?url=<cloudinary_url>&name=<filename>
  ├── axios.get(url, { responseType: 'stream' })
  ├── Set Content-Type: application/pdf
  ├── Set Content-Disposition: attachment; filename="..."
  └── upstream.data.pipe(res)
```

Avoids CORS issues when downloading raw Cloudinary files from the browser.

---

## 11. Email System

All email sent via Nodemailer with Gmail SMTP (`service: 'gmail'`).

| Email               | Trigger                          | Template                                        |
| ------------------- | -------------------------------- | ----------------------------------------------- |
| OTP verification    | `POST /api/auth/send-otp`        | HTML with 36px OTP code, 10-min expiry note     |
| Contact form        | `POST /api/contact`              | Formatted table with name/email/subject/message |
| Notification emails | `Notification.post('save')` hook | Fire-and-forget via `sendNotificationEmail()`   |

---

## 12. Frontend Architecture

### 12.1 Route Groups

```
app/
├── page.js                         ← Landing page (SSR/CSR hybrid)
├── login/page.js                   ← Role-tab login form
├── register/                       ← Multi-step OTP registration
├── payment/                        ← Payment result handler
├── contact/, privacy/, terms/, refund-policy/
│
├── (dashboard)/                    ← Alumni route group
│   ├── layout.js                   ← Alumni sidebar + auth guard
│   └── alumni/
│       ├── dashboard/page.js
│       ├── profile/page.js
│       ├── edit-profile/page.js
│       ├── create-session/page.js
│       ├── my-sessions/page.js
│       ├── session/[id]/participants/page.js
│       ├── messages/page.js
│       └── notifications/page.js
│
└── (student-dashboard)/            ← Student route group
    ├── layout.js                   ← Student sidebar + auth guard
    └── student/
        ├── dashboard/page.js
        ├── profile/page.js
        ├── explore-alumni/page.js
        ├── alumni/[id]/page.js     ← Public alumni profile
        ├── explore-sessions/page.js
        ├── session/[id]/page.js
        ├── my-sessions/page.js
        ├── my-bookings/page.js
        ├── messages/page.js
        ├── group-chat/page.js
        └── notifications/page.js
```

### 12.2 Shared Components

- `AlumniCard` — alumni listing card with rating, company, skills
- `Sidebar` / `StudentSidebar` — role-specific navigation
- `Navbar` — top navigation
- `Footer` — site footer with legal links
- `Loader` — full-page loading spinner
- `Toast` — toast notification UI
- `ReviewModal` — star rating + comment modal
- `PayButton` — Razorpay checkout trigger component

### 12.3 Context

**ToastContext** — global toast system

```js
showToast(type, message); // immediate toast
showToastAfterRedirect(type, msg); // persists message across router.push()
```

### 12.4 Auth Flow (Frontend)

```
Login → JWT stored in localStorage
Layout.js → reads token, decodes role, redirects if wrong role
API calls → Axios interceptor attaches Authorization: Bearer <token>
Socket → connects with { auth: { token } }
```

### 12.5 Razorpay Integration

```js
// layout.js — loaded once, lazily
<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

// PayButton.jsx flow
1. POST /api/payment/order → { order }
2. new window.Razorpay({ key, order, handler }) .open()
3. handler({ razorpay_payment_id, razorpay_order_id, razorpay_signature })
4. POST /api/payment/verify → { success }
5. Show success toast, refresh session data
```

---

## 13. Security Implementation

| Concern              | Implementation                                                                       |
| -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| Password storage     | bcryptjs, salt rounds = 10                                                           |
| Session tokens       | JWT, HS256, 7-day expiry, `JWT_SECRET` env var                                       |
| Payment verification | HMAC-SHA256 on `order_id                                                             | payment_id`with`RAZORPAY_KEY_SECRET` |
| Webhook verification | HMAC-SHA256 on raw body with `RAZORPAY_WEBHOOK_SECRET`                               |
| HTTP headers         | `helmet` middleware                                                                  |
| Rate limiting        | `express-rate-limit`                                                                 |
| Email domain         | `.edu` enforced at Mongoose schema + controller level                                |
| CORS                 | Restricted to `CLIENT_URL` env variable                                              |
| Cloudinary secrets   | `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`           |
| Webhook raw body     | Registered before `express.json()` using `express.raw({ type: 'application/json' })` |
| Ownership checks     | All session mutations verify `session.alumniId === alumni._id`                       |
| Group membership     | All group message sends verify `GroupChat.findOne({ _id, 'members.user': userId })`  |

---

## 14. AI Matching Service

### 14.1 Overview

The AI matching feature is a dedicated Python microservice that recommends the top 5 alumni to a student based on semantic similarity between the student's interests and each alumni's skill set.

### 14.2 Architecture

```
Student Dashboard (Next.js)
        │
        │ GET /api/ai/matched-alumni  (JWT)
        ▼
Node.js Backend (ai.controller.js)
        │
        │ POST /recommend  (internal HTTP)
        ▼
Python AI Service (Flask — port 7000)
        │
        ├── SentenceTransformer: all-MiniLM-L6-v2
        └── Returns ranked recommendations
```

The AI service runs as a separate container (`ai-service` in `docker-compose.yml`) and is called internally by the Node.js backend via `AI_SERVICES_URL` env var.

### 14.3 Python Service — `app.py`

**Model:** `sentence-transformers/all-MiniLM-L6-v2` — a lightweight transformer model that produces 384-dimensional semantic embeddings.

**Endpoint:** `POST /recommend`

**Request payload:**

```json
{
  "studentInterests": ["machine learning", "web development"],
  "alumni": [
    { "id": "<alumniId>", "skills": ["Python", "TensorFlow", "React"] }
  ]
}
```

**Response:**

```json
[
  {
    "alumniId": "<id>",
    "semanticScore": 0.87,
    "matchPercentage": 75
  }
]
```

**Algorithm:**

1. Student interests and alumni skills are each joined into single strings.
2. Both are encoded into embeddings using the transformer model.
3. Cosine similarity is computed between the student embedding and every alumni embedding.
4. Alumni with similarity < 0.2 are filtered out.
5. For surviving alumni, a `matchPercentage` is computed by iterating each student interest against each alumni skill — a pair is considered matched if their embedding cosine similarity exceeds 0.5.
6. Results are sorted by `semanticScore` descending and the top 5 are returned.

**Caching:** Individual skill/interest embeddings are cached in a local `embedding_cache` dict to avoid recomputing the same string during the match percentage calculation loop.

### 14.4 Backend Controller — `ai.controller.js`

```
GET /api/ai/matched-alumni
  ├── Authenticate user (JWT)
  ├── Student.findOne({ userId }) → fetch student interests
  ├── Alumni.find() → fetch all alumni with skills
  ├── POST AI_SERVICES_URL/recommend → ranked list of { alumniId, semanticScore, matchPercentage }
  ├── Promise.all → Alumni.findById(alumniId).populate('userId') for each result
  └── Return enriched recommendations: { alumniId, name, skills, image, company, jobTitle, score }
```

### 14.5 Frontend — `AiMatchModal.js`

- Rendered as a modal overlay triggered from the student dashboard.
- Fetches recommendations lazily on first open; result is cached in component state (`fetched` flag) to avoid repeat API calls within the same session.
- Each alumni card shows: rank badge, profile image (or initial fallback), job title, company, a visual match-percentage bar, top 3 skills, and a direct Message button.
- Clicking a card navigates to the alumni's full profile page.
- Keyboard accessible: `Escape` closes the modal.

### 14.6 Tech Stack — AI Service

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Runtime    | Python 3.11                                  |
| Framework  | Flask                                        |
| ML Model   | sentence-transformers (all-MiniLM-L6-v2)     |
| Similarity | scikit-learn cosine_similarity               |
| Deploy     | Docker container (Procfile for Heroku-style) |

---

## 15. Known Technical Issues

| Issue                                   | Location                              | Impact                                                                                   |
| --------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Payment` model imported but never used | `paymentController.js`                | Dead import; `Transaction` handles payment records                                       |
| `razorpayPaymentId` param unused        | `registerStudent.js`                  | Dead parameter                                                                           |
| `onlineUsers` is in-memory              | `socket/socket.js`                    | Not horizontally scalable; requires Redis adapter for multi-instance                     |
| Double Alumni lookup                    | `alumni.controller.js → getMyProfile` | `findOne` then `findById` on same data — one query is redundant                          |
| N+1 in getDashboard                     | `student.controller.js`               | Individual `User.findById` per upcoming session inside `Promise.all` — should be batched |
| `Booking` model unused                  | `models/Booking.js`                   | Legacy model, superseded by `Registration` + `Transaction`                               |
| Large commented block                   | `student.controller.js`               | Old `registerSession` implementation (~80 lines) left in file                            |
