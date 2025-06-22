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

dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket connections store
const connections = new Map();

// WebSocket connection handling
wss.on("connection", (ws, req) => {
  const eventId = new URL(req.url, "ws://localhost").searchParams.get(
    "eventId"
  );
  if (eventId) {
    if (!connections.has(eventId)) {
      connections.set(eventId, new Set());
    }
    connections.get(eventId).add(ws);

    ws.on("close", () => {
      connections.get(eventId)?.delete(ws);
      if (connections.get(eventId)?.size === 0) {
        connections.delete(eventId);
      }
    });
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
