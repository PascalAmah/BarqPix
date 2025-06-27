import { Router } from "express";
import { eventController } from "../controllers/eventController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validateEvent } from "../middlewares/validationMiddleware.js";

const router = Router();

router.get("/public/:eventId", eventController.getPublicEvent);
router.get("/search", eventController.searchEvents);

// Protected routes
router.post("/", verifyToken, validateEvent, eventController.createEvent);

router.get("/", verifyToken, eventController.getUserEvents);

router.get("/:eventId", verifyToken, eventController.getEvent);

router.patch(
  "/:eventId",
  verifyToken,
  validateEvent,
  eventController.updateEvent
);

router.delete("/:eventId", verifyToken, eventController.deleteEvent);

export default router;
