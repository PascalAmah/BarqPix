import { User } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const authApi = {
  async createUser(user: User) {
    const response = await fetch(`${API_URL}/api/auth/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        uid: user.uid,
        displayName: user.displayName || "",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create user in backend");
    }

    return response.json();
  },

  async getCurrentUser(token: string) {
    const response = await fetch(`${API_URL}/api/auth/current-user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get current user");
    }

    return response.json();
  },

  async updateUser(token: string, updates: Partial<User>) {
    const response = await fetch(`${API_URL}/api/auth/update-user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update user");
    }

    return response.json();
  },
};
