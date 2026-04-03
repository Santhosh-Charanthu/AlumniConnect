# AlumniConnect

A full-stack web platform that bridges college students with alumni through mentoring sessions, real-time messaging, and career guidance. Built exclusively for `.edu` institutional email addresses to keep the network trusted and college-specific.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Real-Time Events](#real-time-events)
- [Payment Flow](#payment-flow)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### For Students

- **Explore Alumni** — browse and search alumni by name, company, job title, or skills; defaults to same-college alumni
- **Book Sessions** — register for free sessions instantly or pay securely for paid sessions via Razorpay
- **Real-Time Chat** — direct messages with alumni and group chats auto-created for every session
- **Live Notifications** — instant alerts when a session goes live, is cancelled, or a new session is posted by a college alumni
- **Attendance & Reviews** — mark attendance during live sessions and submit star ratings + comments after completion
- **My Bookings** — full payment and booking history with refund status

### For Alumni

- **Rich Profile** — showcase work experience, projects, achievements, skills, and hourly rate
- **Create Sessions** — host free or paid mentoring sessions with cover image, category, deadline, and duration
- **Session Management** — start sessions with a meet link, end them, view registered participants, cancel with auto-refund
- **Auto Group Chat** — a dedicated group chat is created for every session the moment it is published
- **Notifications** — real-time alerts when students register or unregister

### Platform-Wide

- **OTP Email Verification** — 3-step registration with `.edu` email enforcement
- **Secure Payments** — Razorpay integration with HMAC-SHA256 signature verification and webhook-driven refund tracking
- **Media Sharing** — images, videos, and PDFs in chat, all stored on Cloudinary
- **Typing Indicators & Read Receipts** — full messaging UX
- **Refund System** — automatic refunds on cancellation, tracked through webhook events

---

## Tech Stack

### Backend

|              |                                    |
| ------------ | ---------------------------------- |
| Runtime      | Node.js                            |
| Framework    | Express 5                          |
| Database     | MongoDB + Mongoose 9               |
| Auth         | JWT + bcryptjs                     |
| Real-time    | Socket.IO 4                        |
| File Uploads | Multer + multer-storage-cloudinary |
| Media CDN    | Cloudinary                         |
| Payments     | Razorpay                           |
| Email        | Nodemailer (Gmail SMTP)            |
| Security     | helmet, express-rate-limit         |

### Frontend

|           |                          |
| --------- | ------------------------ |
| Framework | Next.js 16 (App Router)  |
| UI        | React 19                 |
| Icons     | lucide-react             |
| HTTP      | Axios                    |
| Real-time | socket.io-client         |
| Styling   | CSS Modules + global CSS |
| Payments  | Razorpay Checkout.js     |

---

## Project Structure

```
AlumniConnect/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js       # Cloudinary SDK config
│   │   ├── db.js               # MongoDB connection
│   │   ├── mailer.js           # Nodemailer + email templates
│   │   └── razorpay.js         # Razorpay SDK config
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── alumni.controller.js
│   │   ├── student.controller.js
│   │   ├── chat.controller.js
│   │   ├── paymentController.js
│   │   ├── experience.controller.js
│   │   ├── project.controller.js
│   │   └── achievement.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT verification
│   │   └── upload.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Alumni.js
│   │   ├── Student.js
│   │   ├── Session.js
│   │   ├── Registration.js
│   │   ├── Transaction.js
│   │   ├── GroupChat.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Review.js
│   │   ├── Experience.js
│   │   ├── Project.js
│   │   └── Achievement.js
│   ├── routes/
│   ├── socket/
│   │   └── socket.js           # Socket.IO server + event handlers
│   ├── utils/
│   │   ├── registerStudent.js  # Shared registration logic
│   │   └── sendNotificationEmail.js
│   ├── app.js                  # Express app entry point
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── (dashboard)/        # Alumni route group
    │   │   └── alumni/
    │   │       ├── dashboard/
    │   │       ├── profile/
    │   │       ├── edit-profile/
    │   │       ├── create-session/
    │   │       ├── my-sessions/
    │   │       ├── session/[id]/participants/
    │   │       ├── messages/
    │   │       └── notifications/
    │   ├── (student-dashboard)/ # Student route group
    │   │   └── student/
    │   │       ├── dashboard/
    │   │       ├── explore-alumni/
    │   │       ├── alumni/[id]/
    │   │       ├── explore-sessions/
    │   │       ├── session/[id]/
    │   │       ├── my-sessions/
    │   │       ├── my-bookings/
    │   │       ├── messages/
    │   │       ├── group-chat/
    │   │       └── notifications/
    │   ├── components/
    │   ├── context/
    │   │   └── ToastContext.js
    │   ├── login/
    │   ├── register/
    │   ├── payment/
    │   ├── contact/
    │   ├── privacy/
    │   ├── terms/
    │   ├── refund-policy/
    │   ├── layout.js
    │   └── page.js             # Landing page
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Razorpay account
- Gmail account with an App Password enabled

---

### Backend Setup

```bash
cd AlumniConnect/backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) below), then start the server:

```bash
# Development (with nodemon)
npx nodemon app.js

# Production
node app.js
```

The server runs on `http://localhost:5000` by default.

---

### Frontend Setup

```bash
cd AlumniConnect/frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory (see [Environment Variables](#environment-variables) below), then start the dev server:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

---

## Environment Variables

### `backend/.env`

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB
DB_URL=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

> For `EMAIL_PASS`, use a Gmail App Password — not your regular Gmail password.  
> Go to Google Account → Security → 2-Step Verification → App Passwords.

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

> Never expose `RAZORPAY_KEY_SECRET` in the frontend. Only the public key ID belongs here.

---

## API Overview

### Auth — `/api/auth`

| Method | Endpoint      | Description                                 |
| ------ | ------------- | ------------------------------------------- |
| POST   | `/send-otp`   | Send OTP to a `.edu` email                  |
| POST   | `/verify-otp` | Verify the OTP                              |
| POST   | `/register`   | Complete registration (multipart/form-data) |
| POST   | `/login`      | Login and receive JWT                       |

### Alumni — `/api/alumni`

| Method | Endpoint                     | Description                       |
| ------ | ---------------------------- | --------------------------------- |
| GET    | `/profile`                   | Get own profile                   |
| PUT    | `/profile`                   | Update profile                    |
| POST   | `/sessions`                  | Create a session                  |
| GET    | `/sessions`                  | List own sessions                 |
| PUT    | `/sessions/:id`              | Update a session                  |
| DELETE | `/sessions/:id`              | Delete session + trigger refunds  |
| POST   | `/sessions/:id/start`        | Start session (provide meet link) |
| POST   | `/sessions/:id/end`          | End session                       |
| GET    | `/sessions/:id/participants` | View registered students          |
| GET    | `/search`                    | Search/filter alumni              |
| GET    | `/:id`                       | Public alumni profile             |

### Student — `/api/student`

| Method | Endpoint                          | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/dashboard`                      | Dashboard stats                      |
| GET    | `/sessions/upcoming`              | All upcoming sessions                |
| GET    | `/sessions/:id`                   | Session detail + registration status |
| POST   | `/sessions/:sessionId/register`   | Register for a free session          |
| DELETE | `/sessions/:sessionId/unregister` | Unregister (with refund if paid)     |
| POST   | `/sessions/:sessionId/attend`     | Mark attendance                      |
| GET    | `/sessions/:sessionId/meet-link`  | Get meet link (live sessions only)   |
| POST   | `/sessions/:sessionId/review`     | Submit a review                      |
| GET    | `/bookings`                       | Payment/booking history              |
| POST   | `/groups/:groupId/join`           | Join a session group chat            |

### Payment — `/api/payment`

| Method | Endpoint   | Description                                  |
| ------ | ---------- | -------------------------------------------- |
| POST   | `/order`   | Create Razorpay order                        |
| POST   | `/verify`  | Verify payment signature and confirm booking |
| POST   | `/webhook` | Razorpay webhook (refund tracking)           |

### Chat — `/api/chat`

| Method | Endpoint                    | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/dm/:userId`               | DM history (paginated)               |
| GET    | `/dm/conversations`         | All conversations with unread counts |
| GET    | `/groups`                   | My group chats                       |
| GET    | `/groups/:groupId/messages` | Group message history                |
| POST   | `/upload`                   | Upload chat media (image/video/PDF)  |
| GET    | `/unread-count`             | Total unread message count           |

---

## Real-Time Events

AlumniConnect uses Socket.IO for all real-time features. The client connects with a JWT token:

```js
import { io } from "socket.io-client";

const socket = io(SOCKET_URL, {
  auth: { token: localStorage.getItem("token") },
});
```

### Key Events

| Event               | Direction       | Description                 |
| ------------------- | --------------- | --------------------------- |
| `dm:send`           | Client → Server | Send a direct message       |
| `dm:receive`        | Server → Client | Receive a direct message    |
| `dm:read`           | Client → Server | Mark DMs as read            |
| `group:send`        | Client → Server | Send a group message        |
| `group:receive`     | Server → Client | Receive a group message     |
| `group:read`        | Client → Server | Mark group messages as read |
| `message:edit`      | Client → Server | Edit a sent message         |
| `message:delete`    | Client → Server | Delete a message            |
| `typing:start`      | Client → Server | Broadcast typing indicator  |
| `typing:stop`       | Client → Server | Stop typing indicator       |
| `notification:new`  | Server → Client | Push a live notification    |
| `group:deactivated` | Server → Client | Session group was closed    |
| `user:online`       | Server → Client | User came online            |
| `user:offline`      | Server → Client | User went offline           |

---

## Payment Flow

```
1. Student clicks "Book Session"
        ↓
2. POST /api/payment/order
   → Razorpay order created server-side
        ↓
3. Razorpay Checkout modal opens in browser
   → Student pays via UPI / card / net banking
        ↓
4. POST /api/payment/verify
   → HMAC-SHA256 signature verified server-side
   → Transaction recorded
   → Student registered for session
   → Group chat invite notification sent
        ↓
5. Razorpay Webhook → POST /api/payment/webhook
   → Tracks refund.processed events
   → Updates transaction status to "refunded"
```

**Refunds** are triggered automatically when:

- A student unregisters more than 1 hour before the session starts
- An alumni deletes a session that has paid registrations

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please make sure your code follows the existing structure and does not commit any `.env` files or secrets.

---

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).
