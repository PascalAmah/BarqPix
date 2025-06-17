export const validateEvent = (req, res, next) => {
  const {
    title,
    description,
    startDate,
    endDate,
    location,
    galleryVisibility,
  } = req.body;

  if (!title || !description || !startDate || !endDate || !location) {
    return res.status(400).json({
      error:
        "Missing required fields: title, description, startDate, endDate, and location are required",
    });
  }

  if (title.length < 3 || title.length > 100) {
    return res.status(400).json({
      error: "Title must be between 3 and 100 characters",
    });
  }

  if (description.length < 10 || description.length > 1000) {
    return res.status(400).json({
      error: "Description must be between 10 and 1000 characters",
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      error: "Invalid date format",
    });
  }

  if (start < now) {
    return res.status(400).json({
      error: "Start date cannot be in the past",
    });
  }

  if (end <= start) {
    return res.status(400).json({
      error: "End date must be after start date",
    });
  }

  if (location.length < 3 || location.length > 200) {
    return res.status(400).json({
      error: "Location must be between 3 and 200 characters",
    });
  }

  if (galleryVisibility && !["public", "private"].includes(galleryVisibility)) {
    return res.status(400).json({
      error: "Gallery visibility must be either 'public' or 'private'",
    });
  }

  next();
};
