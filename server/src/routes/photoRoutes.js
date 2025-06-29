import { Router } from "express";
import { photoController } from "../controllers/photoController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = Router();

// Get user photos (protected) - must come before /:eventId
router.get("/user/gallery", verifyToken, photoController.getUserPhotos);

// Get quick share photos (public) - must come before /:eventId
router.get("/quick/:quickId", photoController.getQuickSharePhotos);

// Quick share uploads (no authentication required) - must come before /:eventId
router.post(
  "/quick/:quickId",
  upload.array("photos", 10),
  photoController.uploadQuickShare
);

// Manual cleanup endpoint (for testing)
router.post("/cleanup/quick-shares", photoController.cleanupExpiredQuickShares);

// Public routes (for event attendees) - matches client expectation
router.post(
  "/:eventId",
  upload.array("photos", 10),
  photoController.uploadPhotos
);

// Get event photos (public)
router.get("/:eventId", photoController.getEventPhotos);

// Protected routes (for event organizers)
router.delete(
  "/:eventId/photos/:photoId",
  verifyToken,
  photoController.deletePhoto
);

// Event cover image upload
router.post(
  "/:eventId/cover",
  verifyToken,
  upload.single("coverImage"),
  photoController.uploadEventCover
);

export default router;
