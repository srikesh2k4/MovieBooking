// backend/utils/pdfGenerator.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { fileTypeFromBuffer } = require("file-type"); // <-- NEW DEPENDENCY

// ---------------------------------------------------------------------
//  CONFIG
// ---------------------------------------------------------------------
const LOGO_PATH = path.join(__dirname, "../public/assets/logo.png");
const SUPPORTED_MIME = new Set(["image/png", "image/jpeg", "image/jpg"]);

// Helper: DB path → absolute path
function dbPathToAbs(dbPath) {
  if (!dbPath) return null;
  return path.resolve(__dirname, "..", dbPath.replace(/^\/public\//, "public/"));
}

// Helper: Validate image file
async function isValidImage(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const buffer = fs.readFileSync(filePath);
    const type = await fileTypeFromBuffer(buffer);
    return type && SUPPORTED_MIME.has(type.mime);
  } catch (err) {
    console.warn("Image validation failed:", err.message);
    return false;
  }
}

// Helper: Draw grey placeholder
function drawPlaceholder(doc) {
  doc.rect(20, 70, 80, 110).stroke("#ccc");
  doc.fillColor("#999").fontSize(10).text("No Image", 35, 120, { align: "center" });
}

// ---------------------------------------------------------------------
async function generateTicketPDF(booking, filePath) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: [420, 300], margin: 0 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // -------------------------- HEADER --------------------------
    doc.rect(0, 0, 420, 50).fill("#e11d48");

    // Logo in header
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, 5, 5, { width: 40, height: 40 });
      } catch (_) {}
    }

    doc.fillColor("#fff")
       .fontSize(18)
       .text("BookMyShow", 55, 15);
    doc.fontSize(10)
       .text("Official Movie Ticket", 330, 20);

    // ----------------------- MOVIE IMAGE -----------------------
    const posterAbs = dbPathToAbs(booking.movie_poster);

    let imageDrawn = false;

    if (posterAbs && await isValidImage(posterAbs)) {
      try {
        doc.image(posterAbs, 20, 70, { width: 80, height: 110, fit: [80, 110] });
        imageDrawn = true;
      } catch (err) {
        console.error("Poster render failed (even after validation):", err.message);
      }
    }

    if (!imageDrawn) {
      // Fallback: logo
      if (fs.existsSync(LOGO_PATH)) {
        try {
          doc.image(LOGO_PATH, 20, 70, { width: 80, height: 110, fit: [80, 110] });
          imageDrawn = true;
        } catch (_) {}
      }
      // Final fallback: placeholder
      if (!imageDrawn) drawPlaceholder(doc);
    }

    // ----------------------- MOVIE DETAILS --------------------
    doc.fontSize(14).fillColor("#111")
       .text(booking.movie_title || "Untitled", 120, 70);
    doc.fontSize(10).fillColor("#333");
    doc.text(`Cinema: ${booking.cinema_name || "N/A"} (${booking.cinema_city || ""})`, 120, 90);
    doc.text(`Date: ${booking.show_date}`, 120, 105);
    doc.text(`Time: ${booking.show_time}`, 120, 120);
    doc.text(`Seats: ${booking.seats}`, 120, 135);
    doc.text(`Amount Paid: ₹${booking.amount}`, 120, 150);
    doc.text(`Payment Method: ${booking.method || "N/A"}`, 120, 165);
    doc.text(`Booking ID: ${booking.id}`, 120, 180, { width: 250 });

    // ------------------- CONFIRMATION BOX --------------------
    doc.rect(20, 200, 380, 60).stroke("#e11d48");
    doc.fontSize(13).fillColor("#e11d48")
       .text("Confirmed Booking", 140, 210);
    doc.fontSize(10).fillColor("#444")
       .text("Please present this ticket at the entrance.", 100, 230, { align: "center" });

    // -------------------------- CUT LINE -----------------------
    doc.moveTo(20, 270).lineTo(400, 270).dash(3, { space: 3 }).stroke("#aaa");

    // --------------------------- FOOTER -----------------------
    doc.undash().fontSize(9).fillColor("#777");
    doc.text("Enjoy your movie!", 0, 275, { align: "center" });
    doc.text(
      "Powered by Pixel_AI_Labs | Authenticated BookMyShow Digital Ticket",
      0,
      288,
      { align: "center" }
    );

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

module.exports = { generateTicketPDF };