import express from "express";
import { authController } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/create-user", authController.createUser);

// Protected routes
router.get("/current-user", verifyToken, authController.getCurrentUser);
router.put("/update-user", verifyToken, authController.updateUser);

export default router;
