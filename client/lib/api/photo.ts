import { forceTokenRefresh } from "../auth.firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const getToken = async () => {
  try {
    const storedUser = localStorage.getItem("barqpix_user");
    if (!storedUser) throw new Error("No authenticated user");
    const userData = JSON.parse(storedUser);
    return userData.token;
  } catch (error) {
    // If there's any issue with the stored token, force a refresh
    return await forceTokenRefresh();
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
};
