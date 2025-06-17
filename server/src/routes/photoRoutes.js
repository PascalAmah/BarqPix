import { Router } from "express";
import { photoController } from "../controllers/photoController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = Router();

// Public routes (for event attendees)
router.post(
  "/:eventId/photos",
  upload.array("photos", 10),
  photoController.uploadPhotos
);

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
