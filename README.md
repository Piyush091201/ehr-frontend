# EHR System — Frontend (Next.js + Tailwind)

The web client for a Healthcare **Electronic Health Record (EHR)** system, built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. It talks to a separate **.NET 8 Web API** using JWT authentication.

> 🔗 **Backend repo:** _add your backend GitHub URL here_

---

## ✨ Features

- 🔐 **JWT login** with three demo roles (Admin / Doctor / Receptionist)
- 📊 **Dashboard** with live stats and upcoming appointments
- 👥 **Patients** — searchable list, create/edit, patient detail page
- 📋 **Medical records** — per-patient clinical history (Doctor/Admin can add)
- 📅 **Appointments** — schedule, update status, cancel
- 🎨 Clean, responsive UI with role-aware actions
- Protected routes (client-side guard) that redirect unauthenticated users to `/login`

---

## 🧱 Tech Stack

| Concern   | Choice                          |
| --------- | ------------------------------- |
| Framework | Next.js (App Router)            |
| Language  | TypeScript                      |
| Styling   | Tailwind CSS                    |
| Auth      | JWT stored in `localStorage` + React Context |
| Data      | `fetch` wrapper (`lib/api.ts`)  |

---

## 🚀 Running Locally

### Prerequisites
- [Node.js 20.9+](https://nodejs.org)
- The [backend API](#) running locally (default `http://localhost:5080`)

### Steps

```bash
cd frontend
npm install
cp .env.example .env.local   # then edit if your API runs elsewhere
npm run dev
```

Open **http://localhost:3000** and sign in with a demo account:

| Role         | Email               | Password        |
| ------------ | ------------------- | --------------- |
| Admin        | `admin@ehr.com`     | `Admin@123`     |
| Doctor       | `doctor@ehr.com`    | `Doctor@123`    |
| Receptionist | `reception@ehr.com` | `Reception@123` |

> The login page also has one-click buttons that fill these credentials for you.

---

## ⚙️ Environment Variables

| Variable              | Description                          | Example                          |
| --------------------- | ------------------------------------ | -------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the .NET EHR API         | `http://localhost:5080`          |

In production, set this to your deployed backend URL (e.g. `https://ehr-api.onrender.com`).

---

## ☁️ Deploying to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo.
   Vercel auto-detects Next.js — no build settings needed.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://<your-backend>.onrender.com`
4. Click **Deploy**.
5. Copy your Vercel URL (e.g. `https://ehr-system.vercel.app`) and add it to the backend's
   `Cors__AllowedOrigins__0` setting, then redeploy the backend so the browser is allowed to call it.

> ⚠️ Because `NEXT_PUBLIC_API_URL` is baked in at build time, **redeploy** the frontend after changing it.

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── login/page.tsx        # Login screen
│   ├── (app)/                # Authenticated route group
│   │   ├── layout.tsx        # Sidebar + topbar + auth guard
│   │   ├── dashboard/        # Stats overview
│   │   ├── patients/         # List, create/edit, [id] detail
│   │   └── appointments/     # Schedule & manage
│   └── layout.tsx            # Root layout + AuthProvider
├── components/               # Sidebar, Topbar, Modal, UI helpers
└── lib/                      # api.ts (fetch + JWT), auth.tsx (context), types.ts
```

---

## 🧭 Notes

- Auth state is held in React Context and persisted to `localStorage`. A 401 from the API
  automatically clears the token and bounces the user back to `/login`.
- This is a portfolio demo — the JWT lives in `localStorage` for simplicity. For a production
  app you'd typically use httpOnly cookies.
