import { Event } from "@/app/types";
import { auth } from "../utils/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const getToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }

    const token = await user.getIdToken(true);
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    throw new Error("Authentication failed");
  }
};

export const eventApi = {
  async createEvent(eventData: Partial<Event>) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error("Failed to create event");
    }

    return response.json();
  },

  async getUserEvents() {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    return response.json();
  },

  async getEvent(eventId: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch event");
    }

    return response.json();
  },

  async updateEvent(eventId: string, eventData: Partial<Event>) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/events/${eventId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error("Failed to update event");
    }

    return response.json();
  },

  async deleteEvent(eventId: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete event");
    }

    return response.json();
  },

  async joinEvent(eventId: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/events/${eventId}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to join event");
    }

    return response.json();
  },

  async getPublicEvent(eventId: string) {
    const response = await fetch(`${API_URL}/api/events/public/${eventId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch public event data");
    }

    return response.json();
  },

  async searchEvents(title: string) {
    const response = await fetch(
      `${API_URL}/api/events/search?title=${encodeURIComponent(title)}`
    );

    if (!response.ok) {
      throw new Error("Failed to search events");
    }

    return response.json();
  },
};
