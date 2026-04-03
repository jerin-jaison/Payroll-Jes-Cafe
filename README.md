# ☕ KASA BREW — Cafe Management System

A full-stack, offline-capable cafe management system with a **Django** backend and a **React + Vite** frontend, served entirely via a single Django dev server.

---

## 🚀 Quick Setup (5 Steps)

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Migrations
```bash
cd backend
python manage.py migrate
```

### 3. Create Admin Superuser
```bash
cd backend
python manage.py createsuperuser
```
Follow the prompts to set username, email, and password.

### 4. Build Frontend (first time only)
```bash
cd frontend
npm install
npm run build
```
This compiles the React app into `backend/staticfiles/frontend/`.

### 5. Start the Server
```bash
cd backend
python manage.py runserver
```

Open your browser at: **http://localhost:8000**

---

## 📖 Using the System

### Receptionist Side (no login)
- Open **http://localhost:8000** — table grid shows immediately
- Click a green (available) table → browse menu → add items → pay
- Use **Active Orders** to track and update order status
- Use **Today's Orders** for full day order history

### Admin Side
- Open **http://localhost:8000/admin-panel/login**
- Login with your **superuser** credentials
- Navigate using the gold sidebar

---

## 🔧 Admin Panel Features

| Page | Features |
|------|----------|
| **Dashboard** | Today's revenue, monthly stats, 3 charts, recent transactions |
| **Menu** | Add/edit/delete items, image upload, categories, availability toggle |
| **Tables** | Visual floor map, status management |
| **Employees** | CRUD, salary, shifts, worked hours tracker |
| **Profit Calc** | Monthly revenue, expenses, salaries → Net P&L with PDF report |
| **Transactions** | Filter by date/method/table, paginated, CSV + PDF export |
| **Inventory** | Stock management, low-stock alerts |
| **Shifts** | Who is working today per shift |

---

## 📁 Folder Structure

```
kasa_brew/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3               ← database (auto-created)
│   ├── kasa_brew/               ← Django project settings
│   │   ├── settings.py
│   │   └── urls.py
│   └── cafe/                    ← Main app
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/           ← Dashboard, Menu, Tables, etc.
│   │   │   └── receptionist/   ← TableSelection, OrderTaking, Payment, etc.
│   │   ├── components/          ← Sidebar, Charts, Modal, etc.
│   │   ├── api/axios.js         ← API client
│   │   └── App.jsx              ← Router
│   └── vite.config.js
└── README.md
```

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | SQLite (fully offline, zero setup) |
| PDF | ReportLab |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |

---

## 🎨 Theme

- **Background**: Deep Black `#0a0a0a`
- **Accent**: Premium Gold `#FFD700`
- **Cards**: Dark Gray `#1a1a1a`
- **Font**: Inter + Poppins

---

## 💡 Tips

- The database file (`db.sqlite3`) is stored in `backend/`. Back it up to save your data.
- Uploaded menu images go to `backend/media/menu_images/`.
- To reset all data: delete `db.sqlite3` and run `python manage.py migrate` again.
- To rebuild the frontend after code changes: `cd frontend && npm run build`
