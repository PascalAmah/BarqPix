import { Event } from "@/app/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const eventApi = {
  async createEvent(event: Event, token: string) {
    const response = await fetch(`${API_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create event");
    }
    return response.json();
  },

  async getEvents(token: string) {
    const response = await fetch(`${API_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to get events");
    }
    return response.json();
  },

  async getEvent(id: string, token: string) {
    const response = await fetch(`${API_URL}/api/events/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to get event");
    }
    return response.json();
  },

  async getUserEvents(token: string) {
    const response = await fetch(`${API_URL}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to get user events");
    }
    return response.json();
  },

  async updateEvent(id: string, event: Event, token: string) {
    const response = await fetch(`${API_URL}/api/events/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update event");
    }
    return response.json();
  },

  async deleteEvent(id: string, token: string) {
    const response = await fetch(`${API_URL}/api/events/${id}`, {
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

  async joinEvent(id: string, token: string) {
    const response = await fetch(`${API_URL}/api/events/${id}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to join event");
    }
    return response.json();
  },
};
