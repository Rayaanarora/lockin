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
const taskRoutes = require("./src/routes/taskRoutes");
const followRoutes = require("./src/routes/followRoutes");
const feedRoutes = require("./src/routes/feedRoutes");
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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const activeSockets = new Map();
app.set("activeSockets", activeSockets);

app.use((req, res, next) => {
  req.activeSockets = activeSockets;
  req.io = io;
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "LOCKIN API" });
});

app.use("/api/users", userRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/recaps", recapRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/feed", feedRoutes);

app.use(notFound);
app.use(errorHandler);

// Socket.IO events handling
io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    socket.userId = Number(userId);
    activeSockets.set(Number(userId), socket);
    console.log(`User ${userId} registered socket ${socket.id}`);
  });

  socket.on("join_mission", (missionId) => {
    socket.join(`mission_${missionId}`);
  });

  socket.on("leave_mission", (missionId) => {
    socket.leave(`mission_${missionId}`);
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      activeSockets.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected socket ${socket.id}`);
    }
  });
});

server.listen(port, () => {
  console.log(`LOCKIN API running on port ${port}`);
});
