import * as QRCode from "qrcode";

export async function generateQRCode(identifier, options = {}) {
  try {
    const {
      type = "event",
      baseUrl = process.env.CLIENT_URL || "",
      width = 300,
      margin = 2,
      color = {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel = "M",
    } = options;

    let url;
    if (type === "event") {
      url = `${baseUrl}/upload/${identifier}`;
    } else if (type === "quick") {
      url = `${baseUrl}/quick/${identifier}`;
    } else {
      url = `${baseUrl}/${identifier}`;
    }

    const qrCode = await QRCode.toDataURL(url, {
      width,
      margin,
      color,
      errorCorrectionLevel,
    });

    return qrCode;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

export async function generateQRCodeWithLogo(
  identifier,
  logoPath,
  options = {}
) {
  try {
    const {
      type = "event",
      baseUrl = process.env.CLIENT_URL || "http://localhost:3001",
      width = 300,
      margin = 2,
      color = {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel = "H", // Higher error correction for logo
    } = options;

    let url;
    if (type === "event") {
      url = `${baseUrl}/upload/${identifier}`;
    } else if (type === "quick") {
      url = `${baseUrl}/quick/${identifier}`;
    } else {
      url = `${baseUrl}/${identifier}`;
    }

    const qrCode = await QRCode.toDataURL(url, {
      width,
      margin,
      color,
      errorCorrectionLevel,
    });

    // Note: Logo overlay would require additional image processing
    // For now, return the basic QR code
    return qrCode;
  } catch (error) {
    console.error("Error generating QR code with logo:", error);
    throw error;
  }
}

export async function generateQRCodeSVG(identifier, options = {}) {
  try {
    const {
      type = "event",
      baseUrl = process.env.CLIENT_URL || "http://localhost:3001",
      width = 300,
      margin = 2,
      color = {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel = "M",
    } = options;

    let url;
    if (type === "event") {
      url = `${baseUrl}/upload/${identifier}`;
    } else if (type === "quick") {
      url = `${baseUrl}/quick/${identifier}`;
    } else {
      url = `${baseUrl}/${identifier}`;
    }

    const qrCode = await QRCode.toString(url, {
      type: "svg",
      width,
      margin,
      color,
      errorCorrectionLevel,
    });

    return qrCode;
  } catch (error) {
    console.error("Error generating QR code SVG:", error);
    throw error;
  }
}
