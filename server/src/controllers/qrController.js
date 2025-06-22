import { db } from "../config/firebase.js";
import { generateQRCode } from "../utils/generateQR.js";
import { v4 as uuidv4 } from "uuid";

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
      const { title, expiresIn = 24 } = req.body;

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
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));

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
      const { title, expiresIn = 24 } = req.body; // expiresIn in hours

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
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));

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

      let qrCodeQuery = db
        .collection("qrCodes")
        .where("eventId", "==", qrCodeId);
      let qrCodeSnapshot = await qrCodeQuery.get();

      if (qrCodeSnapshot.empty) {
        qrCodeQuery = db.collection("qrCodes").where("quickId", "==", qrCodeId);
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
};
