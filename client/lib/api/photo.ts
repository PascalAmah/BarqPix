const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const photoApi = {
  async uploadEventCover(eventId: string, coverImage: File, token: string) {
    const formData = new FormData();
    formData.append("coverImage", coverImage);

    const response = await fetch(`${API_URL}/api/photos/${eventId}/cover`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Upload failed:", error);
      throw new Error(error.error || "Failed to upload event cover");
    }

    const result = await response.json();
    return result;
  },
};
