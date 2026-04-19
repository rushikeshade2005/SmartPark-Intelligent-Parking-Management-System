# SmartPark - Intelligent Parking Management System

A full-stack Smart Parking Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring real-time updates, QR-based check-in/out, email notifications, and a comprehensive admin dashboard.

---

## Features

### User Features
- **User Registration & Login** with JWT authentication
- **Email Verification** on registration
- **Forgot/Reset Password** via email link
- **Browse Parking Lots** with search, filters (price, availability, city), and sorting
- **Book Parking Slots** with real-time availability
- **QR Code Check-in/Check-out** for seamless entry & exit
- **Vehicle Management** – register and manage multiple vehicles
- **Payment Processing** with receipt/invoice download
- **Reviews & Ratings** for completed bookings
- **Persistent Notifications** with real-time updates via Socket.io
- **Get Directions** to parking lots via interactive maps
- **Nearby Parking** – find lots near your current location
- **Contact/Messages** – send messages to admin and view replies

### Admin Features
- **Dashboard Overview** with key metrics and charts
- **Manage Parking Lots** – CRUD operations with images
- **Manage Parking Slots** – assign slots to floors and lots
- **Manage Users** – view and manage registered users
- **Manage Bookings** – view, complete, or cancel bookings
- **Payment Management** – view all transactions
- **Analytics Dashboard** with revenue charts and occupancy data
- **Message Center** – reply to user messages (emails auto-sent)
- **System Settings** – configure pricing, security, notifications
- **Activity Log** – track all admin actions
- **Real-time Updates** via Socket.io

### Technical Features
- **Responsive Design** – mobile-first with Tailwind CSS
- **Dark Mode** support
- **Responsive Sidebar** with mobile hamburger menu
- **Email Notifications** via Nodemailer (booking confirmations, cancellations, password reset)
- **Rate Limiting** and security middleware (Helmet, CORS)
- **Real-time Communication** via Socket.io

---

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.io (real-time)
- Nodemailer (emails)
- QR Code generation
- Express Validator
- Helmet + CORS + Rate Limiting

### Frontend
- React 18 (Vite)
- Tailwind CSS 3
- React Router 6
- Framer Motion (animations)
- Recharts (charts)
- React Leaflet (maps)
- Socket.io Client
- React Hot Toast

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartpark.git
   cd smartpark
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env    # Configure your environment variables
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/api/health

### Default Admin Credentials
```
Email: admin@smartpark.com
Password: admin123
```

---

## Environment Variables

See `backend/.env.example` for all available environment variables.

Key variables:
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smartparking` |
| `JWT_SECRET` | JWT signing secret | – |
| `JWT_EXPIRE` | Token expiry | `7d` |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` |
| `SMTP_HOST` | Email SMTP host | – |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email username | – |
| `SMTP_PASS` | Email password | – |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/auth/verify-email/:token` | Verify email |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile |

### Parking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parking-lots` | List all lots |
| POST | `/api/parking-lots` | Create lot (admin) |
| GET | `/api/parking-lots/:id/slots` | Get lot slots |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/create` | Create booking |
| GET | `/api/bookings/user` | User bookings |
| GET | `/api/bookings/all` | All bookings (admin) |
| PUT | `/api/bookings/check-in/:id` | Check in |
| PUT | `/api/bookings/check-out/:id` | Check out |
| DELETE | `/api/bookings/cancel/:id` | Cancel booking |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List user vehicles |
| POST | `/api/vehicles` | Add vehicle |
| PUT | `/api/vehicles/:id` | Update vehicle |
| DELETE | `/api/vehicles/:id` | Delete vehicle |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit review |
| GET | `/api/reviews/lot/:lotId` | Lot reviews |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | User notifications |
| PUT | `/api/notifications/read-all` | Mark all read |

### Settings (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/settings/activity-log` | Activity log |

---

## Project Structure

```
SmartPark/
├── backend/
│   ├── config/         # Database configuration
│   ├── controllers/    # Route handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── services/        # Email, socket, seed services
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth context
│   │   ├── layouts/     # Dashboard & admin layouts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service
│   │   └── utils/       # Helper functions
│   └── index.html
├── README.md
├── docker-compose.yml
└── .gitignore
```

---

## Docker Deployment

```bash
docker-compose up --build
```

This starts:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend on port 80

---

## License

MIT License

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
