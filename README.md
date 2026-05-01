# ⚡ TaskFlow — Team Task Manager

A modern, full-stack task management platform designed for teams to collaborate efficiently. TaskFlow enables teams to organize projects, assign and track tasks, manage team members with role-based access control, and stay synchronized in real-time. Built with cutting-edge technologies including React for a responsive UI, Node.js/Express for a robust backend, and Neon PostgreSQL for scalable data management, with JWT-based authentication for secure access.

---

## 🚀 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express |
| Database | **Neon PostgreSQL** (pg driver) |
| Auth | JWT + bcrypt |
| Deployment | Render backend + Vercel frontend |

---

## 📁 Project Structure

```
taskflow/
├── backend/         # Express API
│   ├── db/          # Neon DB connection + schema
│   ├── middleware/  # JWT auth middleware
│   ├── routes/      # auth, projects, tasks
│   └── server.js
└── frontend/        # React SPA
    └── src/
        ├── context/ # Auth context
        ├── pages/   # Dashboard, Projects, Tasks, Team
        └── components/
```

---

## ⚙️ Local Development

### 1. Get your Neon Database URL

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project (e.g. `taskflow`)
3. Copy the **connection string** — looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env and paste your Neon DATABASE_URL
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api (default)
npm install
npm start
# Runs on http://localhost:3000
```

---

## 🌐 Deploy on Render

Deploy as **two separate services** from the same GitHub repo, or import the included `render.yaml` blueprint.

Note: I deployed the backend on Render and the frontend on Vercel because my Railway trial ended.

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### Step 2 — Deploy Backend

1. Go to [render.com](https://render.com) → **New** → **Blueprint** or **Web Service**
2. Select your repo
3. If creating manually, set **Root Directory** to `backend`
4. Go to **Variables** and add:
   ```
   DATABASE_URL=your_neon_connection_string
   JWT_SECRET=some_long_random_secret_string
   FRONTEND_URL=https://your-frontend.onrender.com
   ```
5. Deploy — copy the generated URL (e.g. `https://taskflow-backend.onrender.com`)

### Step 3 — Deploy Frontend

1. Create a second **Web Service** in Render for the frontend
2. Root Directory: set to `frontend`
3. Go to **Variables** and add:
   ```
   REACT_APP_API_URL=https://taskflow-backend.onrender.com/api
   ```
4. Deploy — your app is live!

---

## 🔐 Role-Based Access Control

| Feature | Admin | Member |
|---------|-------|--------|
| Create projects | ✅ | ❌ |
| Delete projects | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create/edit/delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| View all projects | ✅ | Only joined |
| View team page | ✅ | ❌ |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | List all users |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (admin) |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project (admin) |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/dashboard` | Dashboard summary |
| GET | `/api/tasks/project/:projectId` | List project tasks |
| POST | `/api/tasks/project/:projectId` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

---

## ✅ Features Checklist

- [x] JWT Authentication (Signup/Login)
- [x] Role-Based Access Control (Admin/Member)
- [x] Project creation & management
- [x] Team member management per project
- [x] Task creation with title, description, priority, due date
- [x] Task assignment to team members
- [x] Kanban board view (Todo / In Progress / Done)
- [x] List view with sorting by priority + due date
- [x] Dashboard with stats, overdue tasks, my tasks
- [x] Input validation on all endpoints
- [x] Neon PostgreSQL with proper foreign keys
- [x] Railway deployment ready
