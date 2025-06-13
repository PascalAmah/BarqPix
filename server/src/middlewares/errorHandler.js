export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "MulterError") {
    return res.status(400).json({
      error: "File upload error",
      message: err.message,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      message: err.message,
    });
  }

  if (err.code === "auth/id-token-expired") {
    return res.status(401).json({
      error: "Token expired",
      message: "Your session has expired. Please sign in again.",
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
