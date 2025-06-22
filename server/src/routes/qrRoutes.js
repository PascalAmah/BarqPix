import { Router } from "express";
import { qrController } from "../controllers/qrController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Public routes (no auth required)
router.post("/:qrCodeId/scan", qrController.trackQRScan);

// Public quick QR generation for guests
router.post("/quick/guest", qrController.generateGuestQuickQR);

// Protected routes - require authentication
router.use(verifyToken);

// Generate QR code for specific event
router.get("/event/:eventId", qrController.generateEventQR);

// Generate quick share QR code
router.post("/quick", qrController.generateQuickQR);

// Get all QR codes for the authenticated user
router.get("/user", qrController.getUserQRCodes);

// Get specific QR code by ID
router.get("/:qrCodeId", qrController.getQRCode);

// Delete QR code
router.delete("/:qrCodeId", qrController.deleteQRCode);

// Get QR code statistics
router.get("/:qrCodeId/stats", qrController.getQRCodeStats);

export default router;
