import { db } from "../config/firebase.js";
import { generateQRCode } from "../utils/generateQR.js";
import { v4 as uuidv4 } from "uuid";

export const eventController = {
  async createEvent(req, res) {
    try {
      const { uid } = req.user;
      const {
        title,
        description,
        startDate,
        endDate,
        location,
        galleryVisibility,
      } = req.body;

      if (new Date(endDate) <= new Date(startDate)) {
        return res
          .status(400)
          .json({ error: "End date must be after start date" });
      }

      const eventId = uuidv4();
      const eventData = {
        id: eventId,
        title,
        description,
        startDate,
        endDate,
        location,
        galleryVisibility: galleryVisibility || "public",
        coverImage: null, // This Cover image will be set by photo controller
        organizer: uid,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      await db.collection("events").doc(eventId).set(eventData);
      // Generate QR code
      const qrCode = await generateQRCode(eventId);
      res.status(201).json({
        ...eventData,
        qrCode,
        uploadUrl: `/upload/${eventId}`,
      });
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getEvent(req, res) {
    try {
      const { eventId } = req.params;
      const eventDoc = await db.collection("events").doc(eventId).get();

      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      const event = eventDoc.data();

      // Check if user has permission to view this event
      if (event.status !== "active" && event.organizer !== req.user?.uid) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this event" });
      }

      // Get photos if user is authorized
      const photosSnapshot = await db
        .collection("events")
        .doc(eventId)
        .collection("photos")
        .orderBy("createdAt", "desc")
        .get();

      const photos = photosSnapshot.docs.map((doc) => doc.data());

      res.json({
        event,
        photos,
      });
    } catch (error) {
      console.error("Error getting event:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getUserEvents(req, res) {
    try {
      const { uid } = req.user;

      const eventsSnapshot = await db
        .collection("events")
        .where("organizer", "==", uid)
        .get();

      const events = eventsSnapshot.docs.map((doc) => doc.data());

      // Sort events by createdAt in memory
      events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({ events });
    } catch (error) {
      console.error("Error getting user events:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { uid } = req.user;
      const {
        title,
        description,
        startDate,
        endDate,
        location,
        galleryVisibility,
      } = req.body;

      // Validate dates if both are provided
      if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        return res
          .status(400)
          .json({ error: "End date must be after start date" });
      }

      const eventDoc = await db.collection("events").doc(eventId).get();

      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (eventDoc.data().organizer !== uid) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this event" });
      }

      const updates = {
        ...(title && { title }),
        ...(description && { description }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(location && { location }),
        ...(galleryVisibility && { galleryVisibility }),
        updatedAt: new Date().toISOString(),
      };

      await db.collection("events").doc(eventId).update(updates);

      res.json({
        message: "Event updated successfully",
        event: { ...eventDoc.data(), ...updates },
      });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async joinEvent(req, res) {
    try {
      const { uid } = req.user;
      const { eventCode } = req.body;
      // Find event by code
      const eventSnapshot = await db
        .collection("events")
        .where("id", "==", eventCode)
        .get();
      if (eventSnapshot.empty) {
        return res.status(404).json({ error: "Event not found" });
      }
      const eventDoc = eventSnapshot.docs[0];
      const eventId = eventDoc.id;
      // Add to userEvents collection
      await db.collection("userEvents").doc(`${uid}_${eventId}`).set({
        userId: uid,
        eventId,
        joinedAt: new Date().toISOString(),
      });
      res.json({
        message: "Joined event successfully",
        event: eventDoc.data(),
      });
    } catch (error) {
      console.error("Error joining event:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getJoinedEvents(req, res) {
    try {
      const { uid } = req.user;
      // Get all userEvents for this user
      const userEventsSnapshot = await db
        .collection("userEvents")
        .where("userId", "==", uid)
        .get();
      const eventIds = userEventsSnapshot.docs.map((doc) => doc.data().eventId);
      // Fetch event details
      const events = [];
      for (const eventId of eventIds) {
        const eventDoc = await db.collection("events").doc(eventId).get();
        if (eventDoc.exists) {
          events.push(eventDoc.data());
        }
      }
      res.json({ events });
    } catch (error) {
      console.error("Error getting joined events:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { uid } = req.user;

      const eventDoc = await db.collection("events").doc(eventId).get();

      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (eventDoc.data().organizer !== uid) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this event" });
      }

      // Delete the event document
      await db.collection("events").doc(eventId).delete();

      // Delete associated photos
      const photosSnapshot = await db
        .collection("events")
        .doc(eventId)
        .collection("photos")
        .get();

      const deletePromises = photosSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);

      // Delete user event associations
      const userEventsSnapshot = await db
        .collection("userEvents")
        .where("eventId", "==", eventId)
        .get();

      const userEventDeletePromises = userEventsSnapshot.docs.map((doc) =>
        doc.ref.delete()
      );
      await Promise.all(userEventDeletePromises);

      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: error.message });
    }
  },
};
