import { Router } from "express";
import { qrController } from "../controllers/qrController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Public routes (no auth required)
router.post("/quick/guest", qrController.generateGuestQuickQR);
router.post("/:qrCodeId/scan", qrController.trackQRScan);

// Public route to delete guest quickshare QR code
router.delete("/quick/guest/:quickId", qrController.deleteGuestQuickQRCode);

// Protected routes - require authentication
router.use(verifyToken);

// Generate QR code for specific event
router.get("/event/:eventId", qrController.generateEventQR);

// Generate quick share QR code
router.post("/quick", qrController.generateQuickQR);

// Get all QR codes for the authenticated user
router.get("/user", qrController.getUserQRCodes);

// Get QR code statistics
router.get("/:qrCodeId/stats", qrController.getQRCodeStats);

// Get specific QR code by ID
router.get("/:qrCodeId", qrController.getQRCode);

// Delete QR code
router.delete("/:qrCodeId", qrController.deleteQRCode);

// Cleanup expired quick share QR codes
router.post("/cleanup/expired", qrController.deleteExpiredQuickShareQRCodes);

export default router;
