# 🏫 Primary School Student Management System

A full-stack web application for teachers and parents to manage and monitor primary school students.

---

## 🛠 Technology Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Backend    | Node.js, Express.js, JWT, MariaDB     |
| Frontend   | React.js (Hooks), Axios, React Router |
| Database   | MariaDB 10.11                         |
| Containers | Docker, Docker Compose, Nginx         |

---

## 🚀 Quick Start (Docker)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run with Docker Compose

```bash
# Clone / navigate to the project folder
cd PJ_Docker

# Build and start all services
docker-compose up --build

# Stop services
docker-compose down

# Stop and remove all data volumes (full reset)
docker-compose down -v
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

---

## 🔑 Demo Credentials

All demo accounts use the password: **`password123`**

| Role    | Email               | Description                          |
| ------- | ------------------- | ------------------------------------ |
| Teacher | teacher@school.com  | Ms. Johnson — full management access |
| Teacher | teacher2@school.com | Mr. Smith — full management access   |
| Parent  | parent@school.com   | Alice Parker — 2 children linked     |
| Parent  | parent2@school.com  | Bob Williams — 1 child linked        |

> Demo data (students, attendance, scores) is seeded automatically on first startup.

---

## 📁 Project Structure

```
PJ_Docker/
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── server.js               # Express app entry point + seeder
│   ├── .env                    # Environment variables (local dev)
│   ├── init.sql                # Database schema (auto-run by MariaDB container)
│   ├── package.json
│   ├── config/
│   │   └── db.js               # MySQL2 connection pool
│   ├── middleware/
│   │   └── auth.js             # JWT authentication + role guard
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── attendanceController.js
│   │   └── scoreController.js
│   └── routes/
│       ├── auth.js
│       ├── students.js
│       ├── attendance.js
│       └── scores.js
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf              # Nginx config (proxies /api to backend)
    ├── package.json
    └── src/
        ├── App.js              # Router config
        ├── App.css             # Global design system styles
        ├── index.js
        ├── services/
        │   └── api.js          # Axios instance + all API service functions
        ├── hooks/
        │   └── useAuth.js      # Auth context + useAuth hook
        ├── components/
        │   ├── Navbar.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── TeacherDashboard.jsx
            ├── ParentDashboard.jsx
            ├── StudentList.jsx
            ├── StudentForm.jsx
            ├── StudentProfile.jsx
            ├── AttendanceManage.jsx
            └── ScoreManage.jsx
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint        | Description              | Auth |
| ------ | --------------- | ------------------------ | ---- |
| POST   | /api/auth/login | Login, returns JWT token | No   |
| GET    | /api/auth/me    | Get current user profile | Yes  |

### Students

| Method | Endpoint              | Description                  | Role    |
| ------ | --------------------- | ---------------------------- | ------- |
| GET    | /api/students         | List all / parent's children | Both    |
| GET    | /api/students/:id     | Get student by ID            | Both    |
| POST   | /api/students         | Create student               | Teacher |
| PUT    | /api/students/:id     | Update student               | Teacher |
| DELETE | /api/students/:id     | Delete student               | Teacher |
| GET    | /api/students/parents | List all parent accounts     | Teacher |

### Attendance

| Method | Endpoint                   | Description                       | Role    |
| ------ | -------------------------- | --------------------------------- | ------- |
| POST   | /api/attendance            | Record single attendance          | Teacher |
| POST   | /api/attendance/bulk       | Record bulk attendance for a date | Teacher |
| GET    | /api/attendance/:studentId | Get student's attendance history  | Both    |
| GET    | /api/attendance/class      | Get all attendance by date/class  | Teacher |
| PUT    | /api/attendance/:id        | Update attendance record          | Teacher |

### Scores

| Method | Endpoint               | Description          | Role    |
| ------ | ---------------------- | -------------------- | ------- |
| POST   | /api/scores            | Add a score          | Teacher |
| GET    | /api/scores/:studentId | Get student's scores | Both    |
| PUT    | /api/scores/:id        | Update a score       | Teacher |
| DELETE | /api/scores/:id        | Delete a score       | Teacher |

---

## 🗄 Database Schema

```sql
users       (id, name, email, password, role)
students    (id, name, date_of_birth, gender, class, parent_id → users.id)
attendance  (id, student_id → students.id, date, status, note)  -- UNIQUE(student_id, date)
scores      (id, student_id → students.id, subject, score, term)
```

---

## 👤 User Roles & Features

### Teacher

- View dashboard with attendance summary stats
- Full CRUD on student records
- Mark/update bulk daily attendance
- Enter, edit, and delete scores per subject & term
- View any student's full profile

### Parent

- View dashboard with all linked children
- See each child's attendance rate and average score
- View full score history grouped by term
- View attendance history with calendar date

---

## 💻 Local Development (without Docker)

### Backend

```bash
cd backend
npm install
# Make sure MariaDB is running locally with credentials matching .env
npm run dev   # Uses nodemon for hot-reload
```

### Frontend

```bash
cd frontend
npm install
npm start     # CRA dev server on http://localhost:3000
              # Proxies /api to http://localhost:5000 via package.json proxy
```

---

## 🔒 Security Notes

- Passwords are hashed with **bcryptjs** (10 rounds)
- All API routes (except `/api/auth/login`) require a valid JWT
- Role-based guards prevent teachers accessing parent-only routes and vice versa
- Parents can only read their own children's data
- JWT secret should be changed in production via the `JWT_SECRET` environment variable
