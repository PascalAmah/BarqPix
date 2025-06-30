import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import photoRoutes from "./routes/photoRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import * as dotenv from "dotenv";
import { handleWebSocketConnection } from "./utils/socketManager.js";
dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Middleware
app.use(
  cors({
    origin: ["https://barq-pix.vercel.app", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

wss.on("connection", (ws, req) => {
  const eventId = new URL(req.url, "ws://localhost").searchParams.get(
    "eventId"
  );
  if (eventId) {
    handleWebSocketConnection(ws, eventId);
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/qr", qrRoutes);

// Error handling
app.use(errorHandler);

export default httpServer;
