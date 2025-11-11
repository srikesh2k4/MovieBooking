
```markdown
# 🎬 BookMyShow Clone – BMS Ultimate Dynamic  
**Developed by [Kotipalli Srikesh](https://github.com/kotipallisrikesh)**  

---

## 🧠 Overview  

This is a **full-stack dynamic movie ticket booking system** inspired by **BookMyShow**, built using:  
🖥️ **React (Frontend)** • ⚙️ **Express.js (Backend)** • 💾 **SQLite (Database)**  
It supports **real-time seat updates**, **PDF ticket generation**, **admin dashboard**, **secure JWT login**, and **live data management**.

---

## 🚀 Features  

### 🎟️ User Features
- Register & login via JWT authentication  
- Browse movies, shows, and cinemas dynamically  
- Real-time seat selection (Socket.IO)  
- Book tickets and generate **PDF e-tickets**  
- View booking history and download past tickets  

### 🛠️ Admin Features
- Secure Admin Login (`admin` / `admin123`)  
- Add / Delete movies with posters  
- Add cinemas and custom screens with dynamic seat layouts  
- Create shows linked to movies and screens  
- Upload homepage banners linked to movies  
- View & delete existing banners and movies  

### 💾 Backend Highlights
- Express REST API  
- SQLite3 lightweight relational database  
- Multer for file uploads  
- PDFKit for ticket PDF generation  
- Socket.IO for real-time seat status  
- bcryptjs for password hashing  
- JSON Web Token (JWT) for authentication  

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React + TailwindCSS |
| Backend | Node.js + Express |
| Database | SQLite3 |
| Authentication | JWT + bcryptjs |
| Real-time | Socket.IO |
| File Uploads | Multer |
| Ticket PDF | PDFKit |

---

## 📁 Folder Structure  

```

bms_ultimate_dynamic/
│
├── server/
│   ├── server.js              # Main Express server
│   ├── data.sqlite            # SQLite database (auto-created)
│   ├── public/
│   │   ├── assets/posters/    # Movie posters
│   │   ├── assets/banners/    # Homepage banners
│   │   └── tickets/           # Generated PDF tickets
│   └── temp/                  # Temporary uploads
│
├── client/
│   ├── src/
│   │   ├── pages/             # All UI pages
│   │   │   ├── Admin.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── MovieDetail.jsx
│   │   │   └── SeatBooking.jsx
│   │   ├── api.js             # Axios API setup
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md

````

---

## ⚡ Installation Guide  

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/kotipallisrikesh/bms_ultimate_dynamic.git
cd bms_ultimate_dynamic
````

---

### 2️⃣ Backend Setup

```bash
cd server
npm install
```

#### Dependencies Installed

```bash
npm install express body-parser multer sqlite3 nanoid cors jsonwebtoken bcryptjs pdfkit socket.io
```

Run the backend:

```bash
node server.js
```

✅ Backend URL → **[http://localhost:4000](http://localhost:4000)**

---

### 3️⃣ Frontend Setup

In a new terminal:

```bash
cd ../client
npm install
npm run dev
```

✅ Frontend URL → **[http://localhost:5173](http://localhost:5173)**

---

### 4️⃣ Default Admin Login

| Username | Password   |
| -------- | ---------- |
| `admin`  | `admin123` |

---

## 💾 Database Setup

SQLite is auto-created when you run the backend.
No manual setup needed.

Tables automatically created:

* admins
* users
* movies
* cinemas
* screens
* shows
* show_seats
* bookings
* banners

---

## 🔐 Environment Variables (Optional)

Create `.env` inside `/server` if needed:

```bash
JWT_SECRET=supersecret-demo
PORT=4000
```

---

## 📡 API Endpoints

| Method | Endpoint                 | Description                           |
| ------ | ------------------------ | ------------------------------------- |
| POST   | `/api/auth/register`     | Register new user                     |
| POST   | `/api/auth/login`        | Login user                            |
| POST   | `/api/admin/login`       | Admin login                           |
| POST   | `/api/admin/movies`      | Add movie                             |
| DELETE | `/api/admin/movies/:id`  | Delete movie (with dependent cleanup) |
| POST   | `/api/admin/cinemas`     | Add cinema                            |
| POST   | `/api/admin/screens`     | Add screen                            |
| POST   | `/api/admin/shows`       | Create show                           |
| POST   | `/api/admin/banners`     | Upload homepage banner                |
| DELETE | `/api/admin/banners/:id` | Delete banner                         |
| POST   | `/api/book`              | Book seats                            |
| POST   | `/api/payment`           | Confirm payment + generate ticket PDF |
| GET    | `/api/my/bookings`       | Fetch user bookings                   |
| GET    | `/api/movies`            | Get all movies                        |
| GET    | `/api/shows`             | Get all shows                         |

---

## 🧾 PDF Ticket Contains

* Official **BookMyShow branding**
* Movie poster and name
* Cinema name, date, and time
* Seats and amount
* Booking ID and payment details
* Authenticated footer with “Powered by Pixel_AI_Labs”

---

## 🧹 Delete Movie Logic

To safely delete a movie and its related data:

```js
// DELETE /api/admin/movies/:id
app.delete("/api/admin/movies/:id", authAdmin, (req, res) => {
  const movieId = req.params.id;

  db.serialize(() => {
    db.run("DELETE FROM banners WHERE movie_id=?", [movieId]);
    db.run("DELETE FROM bookings WHERE movie_id=?", [movieId]);
    db.run("DELETE FROM shows WHERE movie_id=?", [movieId]);

    db.get("SELECT poster FROM movies WHERE id=?", [movieId], (err, row) => {
      if (row && row.poster) {
        try {
          const posterPath = path.join(__dirname, row.poster.replace(/^\\/public\\//, "public/"));
          if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
        } catch {}
      }
    });

    db.run("DELETE FROM movies WHERE id=?", [movieId], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Movie not found" });
      res.json({ success: true });
    });
  });
});
```

---

## 🧩 Commands Summary

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm install`        | Install all dependencies |
| `node server.js`     | Run backend              |
| `npm run dev`        | Run frontend             |
| `rm data.sqlite`     | Reset database           |
| `npx kill-port 4000` | Kill stuck backend port  |
| `ctrl + c`           | Stop running server      |

---

## 🛠️ Common Issues

### ❌ `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`

➡ Occurs when deleting a movie linked to bookings/shows.
✅ Fixed with the above **manual delete route** or by adding
`ON DELETE CASCADE` in table definitions.

### ❌ `Command not found: vite`

➡ Install vite globally:

```bash
npm install -g vite
```

### ❌ PDF not showing movie details

➡ Check that the movie was uploaded with a valid image and file path.

---

## 💡 Future Enhancements

* Real online payments (Stripe / Razorpay)
* QR verification on ticket scanning
* Email notifications for booking confirmation
* Multi-city filtering and search
* Admin dashboard analytics

---

## 👨‍💻 Developer

**Created & Maintained by:**
🧑‍💻 **Kotipalli Srikesh**
🎨 Pixel_AI_Labs — Creating AI-driven visuals and software
📍 SRM University | Team Envision

---

## 🏁 License

MIT License © 2025 — **Developed by Kotipalli Srikesh**

```

