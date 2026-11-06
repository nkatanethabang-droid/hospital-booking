# CarePoint Hospital Appointment Booking System

A full-stack local demonstration project using React, Express, Node.js and MySQL.

## Features
- Patient registration and login with bcrypt password hashing and JWT authentication.
- Public doctor directory with search and department filtering.
- Doctor profiles and available appointment slots.
- Appointment request, patient appointment list, cancellation and rescheduling.
- Administrator dashboard with patient and appointment views, doctor creation, doctor schedule creation and appointment status updates.
- MySQL tables for users, patients, doctors, departments, appointments, doctor availability and notifications.
- Responsive layout for desktop and mobile.

## Requirements
- Node.js 18 or newer
- MySQL Server 8 or compatible MySQL version
- VS Code or another code editor

## 1. Create the database
Open MySQL Workbench or the MySQL command line and run the complete file:

`database/hospital_booking.sql`

This creates the `hospital_booking` database, tables and sample departments/doctors.

## 2. Configure the backend
Open a terminal in the project folder:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env`. Set `DB_USER` and `DB_PASSWORD` to your actual MySQL username and password. Change `JWT_SECRET` to a long random secret. Set a new administrator password before running the app.

The backend creates the administrator account automatically the first time it starts, using `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

Start the API:

```powershell
npm run dev
```

Expected address: `http://localhost:5000`

Test the database connection in a browser:
`http://localhost:5000/api/health`

It should return `{"status":"ok","database":"connected"}`.

## 3. Start the frontend
Open a SECOND terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite address shown in the terminal, normally `http://localhost:5173`.

## 4. First-time use
- Register a patient account through the website.
- Sign in as a patient to search doctors and request appointments.
- Sign in as administrator using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env` to access `/admin`.
- As administrator, add availability for a doctor. Patients can only select generated available slots.
- Confirm or reject appointment requests from the administrator dashboard.

## API summary
- `POST /api/auth/register` — register a patient
- `POST /api/auth/login` — login
- `GET /api/auth/me` — current user
- `GET /api/doctors` — search doctors
- `GET /api/doctors/departments` — departments
- `GET /api/doctors/:id` — doctor details
- `POST /api/doctors` — admin adds doctor
- `PUT /api/doctors/:id` — admin edits doctor
- `DELETE /api/doctors/:id` — admin deactivates doctor
- `GET /api/appointments/availability/:doctorId` — available time slots
- `GET /api/appointments` — current patient's appointments or all appointments for admin
- `POST /api/appointments` — request appointment
- `PATCH /api/appointments/:id/cancel` — patient cancels own appointment
- `PATCH /api/appointments/:id/reschedule` — patient reschedules own appointment
- `PATCH /api/appointments/:id/status` — admin changes status
- `GET /api/admin/stats` — admin statistics
- `GET /api/admin/patients` — admin patient list
- `POST /api/admin/availability` — admin creates doctor availability
- `GET /api/admin/notifications` — current user's notifications
- `PATCH /api/admin/notifications/:id/read` — mark notification read
- `GET /api/profile`, `PUT /api/profile` — current user's profile

## Important notes and production hardening
This is a functional educational/local project, not a production-ready clinical system. Before real deployment, add HTTPS, rate limiting, audit logs, stronger role administration, privacy/consent workflows, automated reminder delivery (email/SMS provider), timezone policy, database backups, formal validation/testing, and professional security review. The included notifications are stored in the database; email/SMS delivery is not configured. Appointment uniqueness prevents two active requests for the same doctor/date/time. For a real hospital, use a dedicated slot table or transaction-safe slot reservation and review the booking rules with the hospital.

## Troubleshooting
- **Access denied for MySQL root:** check `DB_USER` and `DB_PASSWORD` in `backend/.env`. Do not guess the password; use the one configured in MySQL.
- **Unknown database:** import `database/hospital_booking.sql` first.
- **Port in use:** change `PORT` in backend `.env`, and update `VITE_API_URL` if needed.
- **Frontend cannot reach API:** make sure backend is running and `CLIENT_URL` is `http://localhost:5173`.
- **No appointment times:** log in as admin, add doctor availability, then reload the booking page.
