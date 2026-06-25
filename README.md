# EHR System — Frontend (Next.js + Tailwind)

The web client for a Healthcare **Electronic Health Record (EHR)** system, built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. It talks to a separate **.NET 8 Web API** using JWT authentication.

> 🔗 **Backend repo: https://github.com/Piyush091201/ehr-backend.git**

---

## ✨ Features

- 🔐 **JWT login** with four roles — each lands on a **different experience**
- 🩺 **Staff workspace** (Admin / Doctor / Receptionist):
  - Role-aware **dashboard** (clinic stats vs. a doctor's patient queue)
  - **Patients** — register, edit, search, and a tabbed profile (history, prescriptions, invoices)
  - **Consultations** — doctors record symptoms, diagnosis, treatment notes & prescriptions
  - **Appointments** — book, assign doctor, check-in, complete, reschedule, cancel
  - **Billing** — create invoices with line items, record payments, download PDFs
- 👤 **Patient Portal** — dashboard, my appointments (cancel/reschedule), medical records, prescriptions, and invoices (PDF download)
- ✅ **Inline form validation** — server validation errors are shown per-field with red highlighting
- 🎨 Clean, responsive UI; protected routes redirect by role

---

## 🧱 Tech Stack

| Concern   | Choice                          |
| --------- | ------------------------------- |
| Framework | Next.js (App Router)            |
| Language  | TypeScript                      |
| Styling   | Tailwind CSS                    |
| Auth      | JWT in `localStorage` + React Context |
| Data      | `fetch` wrapper (`lib/api.ts`) with field-error parsing |

---

## 🚀 Running Locally

### Prerequisites
- [Node.js 20.9+](https://nodejs.org)
- The backend API running locally (default `http://localhost:5080`)

### Steps

```bash
cd frontend
npm install
cp .env.example .env.local   # adjust if your API runs elsewhere
npm run dev
```

Open **http://localhost:3000** and sign in with a demo account:

| Role         | Email               | Password        | Lands on |
| ------------ | ------------------- | --------------- | -------- |
| Admin        | `admin@ehr.com`     | `Admin@123`     | Staff dashboard |
| Doctor       | `doctor@ehr.com`    | `Doctor@123`    | Doctor dashboard |
| Receptionist | `reception@ehr.com` | `Reception@123` | Staff dashboard |
| Patient      | `patient@ehr.com`   | `Patient@123`   | Patient portal |

> The login page has one-click buttons that fill these credentials.

---

## ⚙️ Environment Variables

| Variable              | Description                  | Example                  |
| --------------------- | ---------------------------- | ------------------------ |
| `NEXT_PUBLIC_API_URL` | Base URL of the .NET EHR API | `http://localhost:5080`  |

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── login/                # Login screen (role-based redirect)
│   ├── (app)/                # Staff workspace (guarded)
│   │   ├── dashboard/        # Role-aware overview
│   │   ├── patients/         # List + [id] tabbed profile (+ record consultation)
│   │   ├── appointments/     # Book / assign / status / reschedule
│   │   └── billing/          # Invoices, payments, PDF
│   └── (portal)/portal/      # Patient portal (guarded)
│       ├── appointments/     # My appointments
│       ├── records/          # My medical records
│       ├── prescriptions/    # My prescriptions
│       └── invoices/         # My invoices (PDF download)
├── components/               # Sidebar, Topbar, Modal, UI kit
└── lib/                      # api.ts, auth.tsx, types.ts
```

---

## 🧭 Notes

- Auth state is held in React Context and persisted to `localStorage`. A 401 from the API
  clears the token and redirects to `/login`.
- Server-side validation errors (ASP.NET Core `ValidationProblemDetails`) are parsed in
  `lib/api.ts` and surfaced under the relevant field.
- This is a portfolio demo — the JWT lives in `localStorage` for simplicity; a production app
  would typically use httpOnly cookies.
