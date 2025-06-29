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

        console.log("PhotoController - Saving photo to database:", {
          photoId: photoData.id,
          eventId: photoData.eventId,
          userId: photoData.userId,
          caption: photoData.caption,
          uploadedAt: photoData.uploadedAt,
        });

        // Save to database
        await db
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .doc(photoData.id)
          .set(photoData);

        console.log(
          "PhotoController - Successfully saved photo:",
          photoData.id,
          "to event:",
          eventId
        );

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
      const { eventId, photoId } = req.params;

      await cloudinary.uploader.destroy(photoId, {
        resource_type: "image",
      });

      await db
        .collection("events")
        .doc(eventId)
        .collection("photos")
        .doc(photoId)
        .delete();

      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  },


  getEventPhotos: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { limit = 50, lastUploadedAt } = req.query;

      console.log("PhotoController - Fetching photos for event:", eventId);

      let photosRef = db
        .collection("events")
        .doc(eventId)
        .collection("photos")
        .orderBy("uploadedAt", "desc")
        .limit(parseInt(limit));

      // If lastUploadedAt is provided, start after that timestamp
      if (lastUploadedAt) {
        const lastDate = new Date(lastUploadedAt);
        photosRef = photosRef.startAfter(lastDate);
      }

      const photosSnapshot = await photosRef.get();

      const photos = [];
      photosSnapshot.forEach((doc) => {
        const photoData = doc.data();
        console.log("PhotoController - Event photo details:", {
          id: doc.id,
          userId: photoData.userId,
          caption: photoData.caption,
          uploadedAt: photoData.uploadedAt,
          eventId: eventId,
        });

        photos.push({
          id: doc.id,
          ...photoData,
        });
      });

      console.log(
        "PhotoController - Found",
        photos.length,
        "photos for event",
        eventId
      );

      res.json({
        photos,
        total: photos.length,
        hasMore: photos.length === parseInt(limit),
        lastUploadedAt:
          photos.length > 0 ? photos[photos.length - 1].uploadedAt : null,
      });
    } catch (error) {
      console.error("PhotoController - Error fetching event photos:", error);
      res.status(500).json({ error: "Failed to fetch event photos" });
    }
  },

  getUserPhotos: async (req, res) => {
    try {
      const userId = req.user?.uid;
      const { limit = 50, offset = 0 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      console.log("PhotoController - Fetching photos for user:", userId);

      // Get all events where the user has uploaded photos
      const eventsSnapshot = await db.collection("events").get();
      console.log(
        "PhotoController - Found",
        eventsSnapshot.docs.length,
        "total events"
      );

      const userPhotos = [];

      for (const eventDoc of eventsSnapshot.docs) {
        const eventId = eventDoc.id;
        const eventData = eventDoc.data();
        console.log(
          "PhotoController - Checking event:",
          eventId,
          "Title:",
          eventData.title
        );

        // Get photos uploaded by this user in this event
        const photosSnapshot = await db
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .where("userId", "==", userId)
          .orderBy("uploadedAt", "desc")
          .get();

        console.log(
          "PhotoController - Found",
          photosSnapshot.docs.length,
          "photos for user",
          userId,
          "in event",
          eventId
        );

        photosSnapshot.forEach((photoDoc) => {
          const photoData = photoDoc.data();
          console.log("PhotoController - Photo details:", {
            id: photoDoc.id,
            userId: photoData.userId,
            caption: photoData.caption,
            uploadedAt: photoData.uploadedAt,
            eventId: eventId,
            eventTitle: eventData.title,
          });

          userPhotos.push({
            id: photoDoc.id,
            ...photoData,
            eventTitle: eventData.title,
            eventId: eventId,
          });
        });
      }

      // Sort by upload date and apply pagination
      userPhotos.sort(
        (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );
      const paginatedPhotos = userPhotos.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );

      console.log(
        "PhotoController - Found",
        userPhotos.length,
        "total photos for user",
        userId
      );
      console.log(
        "PhotoController - Returning",
        paginatedPhotos.length,
        "photos (paginated)"
      );

      res.json({
        photos: paginatedPhotos,
        total: userPhotos.length,
        hasMore: userPhotos.length > parseInt(offset) + parseInt(limit),
      });
    } catch (error) {
      console.error("PhotoController - Error fetching user photos:", error);
      res.status(500).json({ error: "Failed to fetch user photos" });
    }
  },

  getQuickSharePhotos: async (req, res) => {
    try {
      const { quickId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      console.log("Fetching photos for quick share:", quickId);

      // Get photos from the quick share collection
      const photosSnapshot = await db
        .collection("quickShares")
        .doc(quickId)
        .collection("photos")
        .orderBy("uploadedAt", "desc")
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const photos = [];
      photosSnapshot.forEach((doc) => {
        photos.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`Found ${photos.length} photos for quick share ${quickId}`);

      res.json({
        photos,
        total: photos.length,
        hasMore: photos.length === parseInt(limit),
      });
    } catch (error) {
      console.error("Error fetching quick share photos:", error);
      res.status(500).json({ error: "Failed to fetch quick share photos" });
    }
  },

  // Cleanup expired quick share photos (older than 1 hour)
  cleanupExpiredQuickShares: async () => {
    try {
      console.log("Starting cleanup of expired quick share photos...");

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      // Get all quick share documents
      const quickSharesSnapshot = await db.collection("quickShares").get();

      let totalDeleted = 0;

      for (const quickShareDoc of quickSharesSnapshot.docs) {
        const quickShareId = quickShareDoc.id;

        // Get photos older than 1 hour
        const expiredPhotosSnapshot = await db
          .collection("quickShares")
          .doc(quickShareId)
          .collection("photos")
          .where("uploadedAt", "<", oneHourAgo.toISOString())
          .get();

        // Delete expired photos
        const deletePromises = expiredPhotosSnapshot.docs.map(
          async (photoDoc) => {
            const photoData = photoDoc.data();

            // Delete from Cloudinary if publicId exists
            if (photoData.publicId) {
              try {
                await cloudinary.uploader.destroy(photoData.publicId);
                console.log(`Deleted from Cloudinary: ${photoData.publicId}`);
              } catch (cloudinaryError) {
                console.error(
                  `Failed to delete from Cloudinary: ${photoData.publicId}`,
                  cloudinaryError
                );
              }
            }

            // Delete from Firestore
            await photoDoc.ref.delete();
            totalDeleted++;
          }
        );

        await Promise.all(deletePromises);

        // If no photos left in this quick share, delete the quick share document
        const remainingPhotosSnapshot = await db
          .collection("quickShares")
          .doc(quickShareId)
          .collection("photos")
          .get();

        if (remainingPhotosSnapshot.empty) {
          await quickShareDoc.ref.delete();
          console.log(`Deleted empty quick share: ${quickShareId}`);
        }
      }

      console.log(`Cleanup completed. Deleted ${totalDeleted} expired photos.`);
    } catch (error) {
      console.error("Error during quick share cleanup:", error);
    }
  },
};
