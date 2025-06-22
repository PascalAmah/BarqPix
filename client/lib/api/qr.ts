import { forceTokenRefresh } from "../auth.firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const getToken = async () => {
  try {
    const storedUser = localStorage.getItem("barqpix_user");
    if (!storedUser) throw new Error("No authenticated user");
    const userData = JSON.parse(storedUser);
    return userData.token;
  } catch (error) {
    return await forceTokenRefresh();
  }
};

export const qrApi = {
  async generateEventQR(eventId: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/qr/event/${eventId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to generate event QR code");
    }

    return response.json();
  },

  async generateQuickQR(title: string, expiresIn: number = 24) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/qr/quick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, expiresIn }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate quick QR code");
    }

    return response.json();
  },

  async generateGuestQuickQR(title: string, expiresIn: number = 24) {
    const response = await fetch(`${API_URL}/api/qr/quick/guest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, expiresIn }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate guest quick QR code");
    }

    return response.json();
  },

  async getUserQRCodes() {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/qr/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user QR codes");
    }

    return response.json();
  },

  async getQRCode(qrCodeId: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/qr/${qrCodeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch QR code");
    }

    return response.json();
  },

  async deleteQRCode(qrCodeId: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/qr/${qrCodeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete QR code");
    }

    return response.json();
  },

  async trackQRScan(
    qrCodeId: string,
    scannerId?: string,
    scannerName?: string
  ) {
    const response = await fetch(`${API_URL}/api/qr/${qrCodeId}/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scannerId, scannerName }),
    });

    if (!response.ok) {
      throw new Error("Failed to track QR scan");
    }

    return response.json();
  },

  async getQRCodeStats(qrCodeId: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/qr/${qrCodeId}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch QR code statistics");
    }

    return response.json();
  },
};
