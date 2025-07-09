import { db } from "../config/firebase.js";
import { generateQRCode } from "../utils/generateQR.js";
import { v4 as uuidv4 } from "uuid";
import { cloudinary } from "../config/cloudinary.js";

export const qrController = {
  async generateEventQR(req, res) {
    try {
      const { eventId } = req.params;
      const { uid } = req.user;

      // Verify the event exists and user owns it
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      const eventData = eventDoc.data();
      if (eventData.organizer !== uid) {
        return res
          .status(403)
          .json({ error: "Not authorized to generate QR for this event" });
      }

      // Check if QR code already exists
      const existingQR = await db
        .collection("qrCodes")
        .where("eventId", "==", eventId)
        .where("type", "==", "event")
        .limit(1)
        .get();

      let qrCodeData;
      if (!existingQR.empty) {
        // Return existing QR code
        const existingQRDoc = existingQR.docs[0];
        qrCodeData = existingQRDoc.data();
      } else {
        // Generate new QR code
        const qrCodeBase64 = await generateQRCode(eventId, {
          type: "event",
          baseUrl: process.env.CLIENT_URL || "http://localhost:3001",
        });
        const qrCodeId = uuidv4();

        const qrCodeDoc = {
          id: qrCodeId,
          eventId,
          userId: uid,
          type: "event",
          title: eventData.title,
          url: `${
            process.env.CLIENT_URL || "http://localhost:3001"
          }/upload/${eventId}`,
          qrCodeData: qrCodeBase64,
          scanCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.collection("qrCodes").doc(qrCodeId).set(qrCodeDoc);
        qrCodeData = qrCodeDoc;
      }

      res.json({
        message: "QR Code generated successfully",
        qrCode: qrCodeData,
      });
    } catch (error) {
      console.error("Error generating event QR code:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async generateQuickQR(req, res) {
    try {
      const { uid } = req.user;
      const { title, expiresIn = 0.5 } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      const quickId = uuidv4();
      const qrCodeBase64 = await generateQRCode(quickId, {
        type: "quick",
        baseUrl: process.env.CLIENT_URL || "http://localhost:3001",
      });
      const qrCodeId = uuidv4();

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + parseFloat(expiresIn) * 60);

      const qrCodeDoc = {
        id: qrCodeId,
        quickId,
        eventId: null,
        userId: uid,
        type: "quick",
        title: title.trim(),
        url: `${
          process.env.CLIENT_URL || "http://localhost:3001"
        }/quick/${quickId}`,
        qrCodeData: qrCodeBase64,
        scanCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      await db.collection("qrCodes").doc(qrCodeId).set(qrCodeDoc);

      res.status(201).json({
        message: "Quick QR Code generated successfully",
        qrCode: qrCodeDoc,
      });
    } catch (error) {
      console.error("Error generating quick QR code:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async generateGuestQuickQR(req, res) {
    try {
      const { title, expiresIn = 0.5 } = req.body; // expiresIn in hours

      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      const quickId = uuidv4();
      const qrCodeBase64 = await generateQRCode(quickId, {
        type: "quick",
        baseUrl: process.env.CLIENT_URL || "http://localhost:3001",
      });
      const qrCodeId = uuidv4();

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + parseFloat(expiresIn) * 60);

      const qrCodeDoc = {
        id: qrCodeId,
        quickId,
        eventId: null,
        userId: "guest",
        type: "quick",
        title: title.trim(),
        url: `${
          process.env.CLIENT_URL || "http://localhost:3001"
        }/quick/${quickId}`,
        qrCodeData: qrCodeBase64,
        scanCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      await db.collection("qrCodes").doc(qrCodeId).set(qrCodeDoc);

      res.status(201).json({
        message: "Guest Quick QR Code generated successfully",
        qrCode: qrCodeDoc,
      });
    } catch (error) {
      console.error("Error generating guest quick QR code:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getUserQRCodes(req, res) {
    try {
      const { uid } = req.user;

      try {
        const qrCodesSnapshot = await db
          .collection("qrCodes")
          .where("userId", "==", uid)
          .orderBy("createdAt", "desc")
          .get();

        const qrCodes = qrCodesSnapshot.docs.map((doc) => doc.data());

        res.json({
          qrCodes,
          count: qrCodes.length,
        });
      } catch (indexError) {
        // Fallback if index doesn't exist yet
        console.warn(
          "Index not ready, using fallback query:",
          indexError.message
        );

        const qrCodesSnapshot = await db
          .collection("qrCodes")
          .where("userId", "==", uid)
          .get();

        const qrCodes = qrCodesSnapshot.docs
          .map((doc) => doc.data())
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
          qrCodes,
          count: qrCodes.length,
        });
      }
    } catch (error) {
      console.error("Error fetching user QR codes:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getQRCode(req, res) {
    try {
      const { qrCodeId } = req.params;
      const { uid } = req.user;

      const qrCodeDoc = await db.collection("qrCodes").doc(qrCodeId).get();
      if (!qrCodeDoc.exists) {
        return res.status(404).json({ error: "QR Code not found" });
      }

      const qrCodeData = qrCodeDoc.data();
      if (qrCodeData.userId !== uid) {
        return res
          .status(403)
          .json({ error: "Not authorized to access this QR code" });
      }

      res.json({
        qrCode: qrCodeData,
      });
    } catch (error) {
      console.error("Error fetching QR code:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteQRCode(req, res) {
    try {
      const { qrCodeId } = req.params;
      const { uid } = req.user;

      const qrCodeDoc = await db.collection("qrCodes").doc(qrCodeId).get();
      if (!qrCodeDoc.exists) {
        return res.status(404).json({ error: "QR Code not found" });
      }

      const qrCodeData = qrCodeDoc.data();
      if (qrCodeData.userId !== uid) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this QR code" });
      }

      await db.collection("qrCodes").doc(qrCodeId).delete();

      res.json({
        message: "QR Code deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting QR code:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async trackQRScan(req, res) {
    try {
      const { qrCodeId } = req.params;
      const { scannerId, scannerName } = req.body;

      // For quick share, the qrCodeId is actually the quickId
      // Check if it looks like a UUID (quick share ID) first
      let qrCodeQuery = db
        .collection("qrCodes")
        .where("quickId", "==", qrCodeId);
      let qrCodeSnapshot = await qrCodeQuery.get();

      if (qrCodeSnapshot.empty) {
        // If not found by quickId, try by eventId
        qrCodeQuery = db.collection("qrCodes").where("eventId", "==", qrCodeId);
        qrCodeSnapshot = await qrCodeQuery.get();
      }

      if (qrCodeSnapshot.empty) {
        return res.status(404).json({ error: "QR Code not found" });
      }

      const qrCodeDoc = qrCodeSnapshot.docs[0];
      const qrCodeRef = qrCodeDoc.ref;
      const qrCodeData = qrCodeDoc.data();

      // Check for expiry
      if (qrCodeData.expiresAt && new Date(qrCodeData.expiresAt) < new Date()) {
        return res.status(410).json({ error: "This QR code has expired." });
      }

      await qrCodeRef.update({
        scanCount: (qrCodeData.scanCount || 0) + 1,
        updatedAt: new Date().toISOString(),
      });

      const scanLogRef = qrCodeRef.collection("scans").doc();
      await scanLogRef.set({
        scannerId: scannerId || "anonymous",
        scannerName: scannerName || "Anonymous",
        scannedAt: new Date().toISOString(),
      });

      res.json({
        message: "Scan tracked successfully",
        qrCode: qrCodeData,
      });
    } catch (error) {
      console.error("Error tracking QR scan:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getQRCodeStats(req, res) {
    try {
      const { qrCodeId } = req.params;
      const { uid } = req.user;

      const qrCodeDoc = await db.collection("qrCodes").doc(qrCodeId).get();
      if (!qrCodeDoc.exists) {
        return res.status(404).json({ error: "QR Code not found" });
      }

      const qrCodeData = qrCodeDoc.data();
      if (qrCodeData.userId !== uid) {
        return res
          .status(403)
          .json({ error: "Not authorized to access this QR code" });
      }

      // Get scan logs for this QR code
      const scansSnapshot = await db
        .collection("qrScans")
        .where("qrCodeId", "==", qrCodeId)
        .orderBy("scannedAt", "desc")
        .get();

      const scans = scansSnapshot.docs.map((doc) => doc.data());

      // Calculate statistics
      const stats = {
        totalScans: scans.length,
        uniqueScanners: new Set(scans.map((scan) => scan.scannerId)).size,
        recentScans: scans.slice(0, 10), // Last 10 scans
        scanTrend: scans.reduce((acc, scan) => {
          const date = scan.scannedAt.split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}),
      };

      res.json({
        qrCode: qrCodeData,
        stats,
      });
    } catch (error) {
      console.error("Error fetching QR code stats:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteExpiredQuickShareQRCodes(req, res) {
    try {
      const now = new Date();
      const expiredQRCodesSnapshot = await db
        .collection("qrCodes")
        .where("type", "==", "quick")
        .where("expiresAt", "<", now.toISOString())
        .get();

      const deletePromises = expiredQRCodesSnapshot.docs.map(async (doc) => {
        const qrCodeData = doc.data();
        console.log(
          `Deleting expired QR code: ${qrCodeData.id} (${qrCodeData.title})`
        );

        // Delete the QR code document
        await doc.ref.delete();

        // Delete associated photos from the quickShares collection
        if (qrCodeData.quickId) {
          try {
            const quickSharePhotosSnapshot = await db
              .collection("quickShares")
              .doc(qrCodeData.quickId)
              .collection("photos")
              .get();

            const photoDeletePromises = quickSharePhotosSnapshot.docs.map(
              async (photoDoc) => {
                const photoData = photoDoc.data();

                // Delete from Cloudinary if publicId exists
                if (photoData.publicId) {
                  try {
                    await cloudinary.uploader.destroy(photoData.publicId);
                    console.log(
                      `Deleted from Cloudinary: ${photoData.publicId}`
                    );
                  } catch (cloudinaryError) {
                    console.error(
                      `Failed to delete from Cloudinary: ${photoData.publicId}`,
                      cloudinaryError
                    );
                  }
                }

                // Delete from Firestore
                await photoDoc.ref.delete();
              }
            );

            await Promise.all(photoDeletePromises);

            console.log(
              `Deleted ${quickSharePhotosSnapshot.docs.length} photos for expired QR code: ${qrCodeData.id}`
            );

            // Delete the empty quickShare document
            await db.collection("quickShares").doc(qrCodeData.quickId).delete();
            console.log(
              `Deleted empty quickShare document: ${qrCodeData.quickId}`
            );
          } catch (photoError) {
            console.error(
              `Error deleting photos for QR code ${qrCodeData.id}:`,
              photoError
            );
          }
        }
      });

      await Promise.all(deletePromises);

      const deletedCount = expiredQRCodesSnapshot.docs.length;
      console.log(`Deleted ${deletedCount} expired quick share QR codes`);

      if (req && res) {
        res.json({
          message: `Deleted ${deletedCount} expired quick share QR codes`,
          deletedCount,
        });
      }

      return deletedCount;
    } catch (error) {
      console.error("Error deleting expired quick share QR codes:", error);
      if (req && res) {
        res.status(500).json({ error: error.message });
      }
      throw error;
    }
  },

  async deleteGuestQuickQRCode(req, res) {
    try {
      const { quickId } = req.params;
      // Find the QR code by quickId
      const qrCodeSnapshot = await db
        .collection("qrCodes")
        .where("quickId", "==", quickId)
        .get();
      if (qrCodeSnapshot.empty) {
        return res.status(404).json({ error: "QR Code not found" });
      }
      const qrCodeDoc = qrCodeSnapshot.docs[0];
      await qrCodeDoc.ref.delete();
      // Optionally, delete associated quickShares/photos as in your cleanup logic
      res.json({ message: "Guest QR Code deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
