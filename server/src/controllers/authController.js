import { db } from "../config/firebase.js";

export const authController = {
  async createUser(req, res) {
    try {
      const { email, uid, displayName } = req.body;

      // Check if user already exists
      const userDoc = await db.collection("users").doc(uid).get();

      if (userDoc.exists) {
        return res.status(200).json({
          message: "User already exists",
          uid: uid,
        });
      }

      // Create new user document
      await db
        .collection("users")
        .doc(uid)
        .set({
          uid,
          email,
          displayName: displayName || "",
          createdAt: new Date().toISOString(),
          role: "user",
        });

      res.status(201).json({
        message: "User created successfully",
        uid: uid,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: error.message });
    }
  },

  async getCurrentUser(req, res) {
    try {
      const { uid } = req.user;
      const userDoc = await db.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user: userDoc.data() });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const { uid } = req.user;
      const updates = req.body;

      delete updates.email;
      delete updates.role;
      delete updates.createdAt;
      delete updates.uid;

      await db
        .collection("users")
        .doc(uid)
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        });

      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: error.message });
    }
  },
};
