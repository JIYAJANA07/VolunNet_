# VolunNet - Volunteer Coordination System Backend

VolunNet is a Volunteer Coordination Platform backend built using **Node.js**, **Express.js**, **MongoDB**, **JWT authentication**, **Firebase Auth & FCM**, and **Socket.io**.

---

## Features

- **Authentication & Security:**
  - Dual authentication: Custom JWT authentication + Firebase Auth ID token verification.
  - Role-based authorization (`volunteer` and `admin` roles).
  - Request validation using `express-validator`.
- **Event Management:**
  - Create, view, update, and delete volunteer events (Admin-restricted).
  - Track volunteer capacity and real-time available slots.
- **Signups & Real-time WebSockets:**
  - Volunteers can sign up for events and cancel signups.
  - Automatic slot decrement and replenishment.
  - Real-time event availability broadcasts to all connected clients via Socket.io.
- **Hours Tracking:**
  - Volunteers can log their contribution hours linked to events.
  - Validation against negative hours.
- **Impact & Event Reports:**
  - Aggregate statistics on total events, total volunteers, and total hours served.
  - Detailed event listings.
- **Push Notifications & Reminders:**
  - Firebase Cloud Messaging (FCM) integration for push notifications.
  - Send direct notifications and mass event reminders to signed-up volunteers.
- **Advanced Gamification (Optional Features):**
  - **Badges API:** Auto-awarded volunteer tiers (Bronze, Silver, Gold, Platinum).
  - **Certificates API:** Official certificate generation and tracking for volunteer milestones.

---

## Technologies Used

- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT), bcryptjs, Firebase Admin SDK
- **Real-Time Communication:** Socket.io
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Validation:** express-validator
- **Tooling:** Postman Collection, Nodemon, dotenv

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or MongoDB Atlas URI)

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/JIYAJANA07/VolunNet.git
cd VolunNet
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (refer to `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/volunnet
JWT_SECRET=your_jwt_secret_key_here
```

### 4. Firebase Configuration (Optional)
To enable live Firebase Push Notifications and Firebase Auth ID token validation:
1. Download your service account private key JSON from the [Firebase Console](https://console.firebase.google.com/) (`Project Settings` > `Service Accounts`).
2. Save the file as `firebasedata.json` in the root directory.
*(Note: If `firebasedata.json` is not provided, the server runs in safe fallback mode using custom JWT authentication).*

### 5. Running the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server starts at `http://localhost:5000`.

---

## API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user (Email/Password or Firebase `idToken`) | Public |
| `POST` | `/api/auth/login` | Login (Email/Password or Firebase `idToken`) | Public |

### Events (`/api/events`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Get all events | Authenticated |
| `GET` | `/api/events/:id` | Get event by ID | Authenticated |
| `POST` | `/api/events` | Create new event | Admin |
| `PUT` | `/api/events/:id` | Update event details | Admin |
| `DELETE` | `/api/events/:id` | Delete event | Admin |

### Signups (`/api/signups`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/signups` | Register for an event (broadcasts real-time availability) | Authenticated |
| `GET` | `/api/signups` | View all signups | Authenticated |
| `GET` | `/api/signups/user/:userId` | View signups for a specific user | Authenticated |
| `DELETE` | `/api/signups/:id` | Cancel signup (restores available slot) | Authenticated |

### Hours Tracking (`/api/hours`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/hours` | Log volunteer service hours | Authenticated |
| `GET` | `/api/hours` | View all logged volunteer hours | Authenticated |
| `GET` | `/api/hours/user/:userId` | View hours logged by a specific user | Authenticated |
| `PUT` | `/api/hours/:id` | Update hour entry | Authenticated |
| `DELETE` | `/api/hours/:id` | Delete hour entry | Authenticated |

### Reports (`/api/reports`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/impact` | Aggregate report: total events, volunteers, hours | Authenticated |
| `GET` | `/api/reports/events` | Detailed event summary report | Authenticated |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/notifications/fcm-token` | Save device FCM token for push notifications | Authenticated |
| `POST` | `/api/notifications/send` | Send push notification to user or mass event reminder | Authenticated |
| `GET` | `/api/notifications` | Get user notifications list | Authenticated |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read | Authenticated |

### Badges & Certificates (`/api/badges`, `/api/certificates`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/badges` | View current user's earned badges | Authenticated |
| `GET` | `/api/badges/user/:userId` | View badges for a volunteer | Authenticated |
| `GET` | `/api/certificates` | View current user's certificates | Authenticated |
| `POST` | `/api/certificates` | Issue a certificate to a volunteer | Admin |

---

## WebSocket & Real-time Events (Socket.io)

Clients can connect to the Socket.io server at `http://localhost:5000`.

- **Room Join:** `socket.emit("joinUser", userId)` — joins user-specific room `user_<userId>`.
- **Direct Notification:** `socket.emit("sendNotification", { userId, title, message })` — emits notification to target user.
- **Event Availability Broadcast (Server to Clients):**
  - Event: `"eventAvailability"`
  - Payload: `{ eventId, availableSlots, capacity }`
  - Broadcasted whenever any user signs up or cancels an event registration.

---

## Postman Collection

Import `VolunNet.postman_collection.json` located in the root directory into Postman for ready-to-test requests across all endpoints with environment variable configuration.