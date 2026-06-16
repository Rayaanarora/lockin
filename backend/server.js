require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");

const userRoutes = require("./src/routes/userRoutes");
const missionRoutes = require("./src/routes/missionRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const recapRoutes = require("./src/routes/recapRoutes");
const { errorHandler, notFound } = require("./src/middleware/errorHandler");

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Set io on app object to be used in controllers
app.set("io", io);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "LOCKIN API" });
});

app.use("/api/users", userRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/recaps", recapRoutes);

app.use(notFound);
app.use(errorHandler);

// Socket.IO events handling
io.on("connection", (socket) => {
  socket.on("join_mission", (missionId) => {
    socket.join(`mission_${missionId}`);
  });

  socket.on("leave_mission", (missionId) => {
    socket.leave(`mission_${missionId}`);
  });
});

server.listen(port, () => {
  console.log(`LOCKIN API running on port ${port}`);
});
