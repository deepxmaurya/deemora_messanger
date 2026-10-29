import {testDatabaseConnection} from "./config/database.ts";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes";
import messageRoutes from "./routes/messageRoutes";
import { initializeSocket } from "./socket/socket";
dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
initializeSocket(io);
app.set("io", io);

app.get("/", (_req, res) => {
  res.json({
    message: "DreamShop Chat Backend is running"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Backend is working"
  });
});

// io.on("connection", (socket) => {
//   console.log("Socket connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("Socket disconnected:", socket.id);
//   });
// });

const PORT = Number(process.env.PORT) || 5000;

httpServer.listen(PORT, async () => {
  console.log(`Backend running at http://localhost:${PORT}`);
   await testDatabaseConnection();
});
