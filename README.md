# **Movie Booking Project – README**
### *Full-Stack Movie Booking Clone (Based on BookMyShow)*

---

## Overview
This is a **full-stack movie booking application** built with **React (Frontend)** and **Node.js/Express (Backend)**. It features user authentication, movie browsing, seat selection, admin dashboard for managing movies/cinemas, and real-time updates.

**Repo:** [https://github.com/srikesh2k4/MovieBooking](https://github.com/srikesh2k4/MovieBooking)

---

## Features
- **User Features**: Register/Login, Browse Movies, Book Seats, View Bookings
- **Admin Features**: Add/Delete Movies, Manage Cinemas/Screens, Upload Banners
- **Real-time**: Seat booking sync (Socket.IO)
- **PDF**: Generate tickets with QR codes

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Axios, Socket.IO Client |
| **Backend** | Node.js, Express, SQLite, JWT, Multer, Sharp, PDFKit |
| **Database** | SQLite (auto-setup) |

---

## Project Structure
```
MovieBooking/
├── backend/          # Node.js + Express
│   ├── server.js
│   ├── routes/
│   ├── config/
│   └── public/uploads/
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── api.js
│   └── vite.config.js
└── README.md
```

---

## Prerequisites
- **Node.js**: v18+ (Download: [nodejs.org](https://nodejs.org))
- **npm**: v9+ (Comes with Node.js)
- **Git**: Latest (Download: [git-scm.com](https://git-scm.com))

Verify:
```bash
node --version
npm --version
git --version
```

---

## Installation Commands (Step-by-Step)

### 1. Clone the Repository
```bash
git clone https://github.com/srikesh2k4/MovieBooking.git
cd MovieBooking
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Start Backend
```bash
cd backend
npm run dev
```
> **Backend runs on:** [http://localhost:4000](http://localhost:4000)

### 5. Start Frontend (New Terminal)
```bash
cd frontend
npm run dev
```
> **Frontend runs on:** [http://localhost:5173](http://localhost:5173)

---

## One-Command Setup (Root Level)
Add to root `package.json`:
```json
{
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install && cd ..",
    "start": "npm-run-all --parallel start:backend start:frontend",
    "start:backend": "cd backend && npm run dev",
    "start:frontend": "cd frontend && npm run dev"
  }
}
```

Then:
```bash
npm install  # Root deps (npm-run-all)
npm run install:all  # Install all
npm start  # Run both
```

---

## Default Credentials
| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **User** | Register via app | — |

Admin: [http://localhost:5173/admin](http://localhost:5173/admin)

---

## Stop Servers
Check ports:
```bash
lsof -i :4000  # Backend
lsof -i :5173  # Frontend
```

Kill process:
```bash
kill -9 <PID>  # Replace <PID> with process ID
```

Or:
```bash
pkill -f "node server.js"  # Backend
pkill -f "vite"  # Frontend
```

---

## Build for Production
```bash
cd frontend
npm run build  # Output: frontend/dist/
cd ../backend
npm start  # Serve static files from dist/
```

---

## Troubleshooting
| Issue | Command/Fix |
|-------|-------------|
| **Port in use** | `lsof -i :4000` → `kill -9 PID` |
| **No uploads** | `mkdir -p backend/public/uploads` |
| **Tailwind missing** | `npm install` in `frontend/` |
| **Admin fails** | Clear localStorage: `localStorage.clear()` in console |
| **Database error** | Delete `backend/data.sqlite` and restart backend |

---

## Commands Summary
| Action | Command |
|--------|---------|
| Install All | `npm run install:all` (root) |
| Start Both | `npm start` (root) |
| Backend Only | `cd backend && npm run dev` |
| Frontend Only | `cd frontend && npm run dev` |
| Kill Backend | `kill -9 $(lsof -t -i:4000)` |
| Kill Frontend | `kill -9 $(lsof -t -i:5173)` |
| Build Frontend | `cd frontend && npm run build` |

---

## License
MIT License – Free for commercial/educational use.

---

**Made with ❤️ in India**  
**Happy Booking!**