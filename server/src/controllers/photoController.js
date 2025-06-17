import { cloudinary } from "../config/cloudinary.js";
import { db } from "../config/firebase.js";

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

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedPhotos = files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));

      res.json({
        message: "Photos uploaded successfully",
        photos: uploadedPhotos,
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
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
