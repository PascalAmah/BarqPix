import { cloudinary } from "../config/cloudinary.js";
import { db } from "../config/firebase.js";
import { broadcastToEvent } from "../app.js";

export const photoController = {
  uploadEventCover: async (req, res) => {
    try {
      const { eventId } = req.params;
      const file = req.file;

      console.log("Received cover image upload request:", {
        eventId,
        file: file
          ? {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            }
          : null,
      });

      if (!file) {
        console.error("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get Cloudinary URL from the uploaded file
      const publicUrl = file.path;
      console.log("File uploaded to Cloudinary:", { publicUrl });

      // Update the event document in Firebase with cover image URL
      await db.collection("events").doc(eventId).update({
        coverImage: publicUrl,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        message: "Event cover image uploaded successfully",
        coverImage: publicUrl,
      });
    } catch (error) {
      console.error("Error uploading event cover:", error);
      res.status(500).json({ error: "Failed to upload event cover image" });
    }
  },

  uploadPhotos: async (req, res) => {
    try {
      const { eventId } = req.params;
      const files = req.files;
      const captions = req.body.captions || [];
      const tags = req.body.tags || [];
      const userId = req.user?.uid || "anonymous";

      console.log("Photo upload request received:", {
        eventId,
        filesCount: files?.length || 0,
        captions,
        tags,
        userId,
      });

      if (!files || files.length === 0) {
        console.error("No files uploaded");
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Verify event exists
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        console.error("Event not found:", eventId);
        return res.status(404).json({ error: "Event not found" });
      }

      console.log("Event found, processing files...");

      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = Array.isArray(captions) ? captions[i] || "" : "";
        const photoTags = Array.isArray(tags)
          ? (tags[i] || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        console.log("Processing file:", {
          originalname: file.originalname,
          path: file.path,
          filename: file.filename,
        });

        const photoData = {
          id: `${eventId}_${Date.now()}_${i}`,
          eventId,
          userId,
          url: file.path,
          publicId: file.filename,
          caption,
          tags: photoTags,
          uploadedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        // Save to database
        await db
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .doc(photoData.id)
          .set(photoData);

        uploadedPhotos.push(photoData);
      }

      console.log("Successfully uploaded", uploadedPhotos.length, "photos");

      // Broadcast to connected clients
      try {
        broadcastToEvent(eventId, {
          type: "PHOTO_UPLOADED",
          data: {
            photos: uploadedPhotos,
            uploadedBy: userId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (broadcastError) {
        console.error("Failed to broadcast photo upload:", broadcastError);
      }

      res.json({
        message: "Photos uploaded successfully",
        photos: uploadedPhotos,
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  },

  uploadQuickShare: async (req, res) => {
    try {
      const { quickId } = req.params;
      const files = req.files;
      const captions = req.body.captions || [];
      const tags = req.body.tags || [];
      const userId = req.user?.uid || "anonymous";

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = Array.isArray(captions) ? captions[i] || "" : "";
        const photoTags = Array.isArray(tags)
          ? (tags[i] || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        const photoData = {
          id: `quick_${quickId}_${Date.now()}_${i}`,
          quickId,
          userId,
          url: file.path,
          publicId: file.filename,
          caption,
          tags: photoTags,
          uploadedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        // Save to quick share collection
        await db
          .collection("quickShares")
          .doc(quickId)
          .collection("photos")
          .doc(photoData.id)
          .set(photoData);

        uploadedPhotos.push(photoData);
      }

      res.json({
        message: "Quick share photos uploaded successfully",
        photos: uploadedPhotos,
      });
    } catch (error) {
      console.error("Error uploading quick share photos:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  },

  deletePhoto: async (req, res) => {
    try {
      const { photoId } = req.params;

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(photoId);

      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  },
};
