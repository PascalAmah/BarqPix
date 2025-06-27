import { forceTokenRefresh } from "../auth.firebase";
import { auth } from "../utils/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const getToken = async () => {
  try {
    const user = auth.currentUser;
    console.log("getToken - auth.currentUser:", user);

    if (!user) {
      console.log("getToken - No current user found");
      throw new Error("No authenticated user");
    }

    console.log("getToken - Getting fresh token for user:", user.uid);
    const token = await user.getIdToken(true);
    console.log("getToken - Token obtained successfully");
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    throw new Error("Authentication failed");
  }
};

export const photoApi = {
  async uploadEventCover(eventId: string, file: File) {
    const token = await getToken();
    const formData = new FormData();
    formData.append("coverImage", file);

    const response = await fetch(`${API_URL}/api/photos/${eventId}/cover`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload cover image");
    }

    return response.json();
  },

  async getUserPhotos(limit = 50, offset = 0) {
    const token = await getToken();
    const response = await fetch(
      `${API_URL}/api/photos/user/gallery?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user photos");
    }

    return response.json();
  },

  async getEventPhotos(eventId: string, limit = 50, lastUploadedAt = "") {
    const response = await fetch(
      `${API_URL}/api/photos/${eventId}?limit=${limit}&lastUploadedAt=${lastUploadedAt}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch event photos");
    }

    return response.json();
  },

  async getQuickSharePhotos(quickId: string, limit = 50, offset = 0) {
    const response = await fetch(
      `${API_URL}/api/photos/quick/${quickId}?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch quick share photos");
    }

    return response.json();
  },

  async deletePhoto(eventId: string, photoId: string) {
    const token = await getToken();
    const response = await fetch(
      `${API_URL}/api/photos/${eventId}/${photoId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete photo");
    }
    return response.json();
  },
};
