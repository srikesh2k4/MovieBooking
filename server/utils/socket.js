function initSocket(io) {
  const db = require("../config/db");

  io.on("connection", (socket) => {
    socket.on("joinShow", (id) => socket.join("show:" + id));
  });

  global.emitSeatUpdate = function (showId) {
    db.all("SELECT seat_code,status FROM show_seats WHERE show_id=?", [showId], (_e, seats) => {
      io.to("show:" + showId).emit("seats", seats);
    });
  };
}

module.exports = { initSocket };