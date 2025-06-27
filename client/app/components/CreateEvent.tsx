"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Calendar } from "lucide-react";
import { toast } from "@/app/components/ui/toast";
import { eventApi } from "@/lib/api/event";
import { Event } from "@/app/types";
import { photoApi } from "@/lib/api/photo";

interface CreateEventProps {
  user: any;
  onViewChange: (view: string) => void;
  eventToEdit?: Event | null;
  previousView: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  galleryVisibility: "public" | "private";
  coverImage: File | null;
  coverImagePreview?: string;
  coverImageUrl?: string;
}

export default function CreateEvent({
  user,
  onViewChange,
  eventToEdit,
  previousView,
}: CreateEventProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<EventFormData>(() => {
    const savedData = localStorage.getItem("eventFormData");
    if (savedData) {
      const parsed = JSON.parse(savedData);

      if (parsed.coverImageUrl) {
        return {
          ...parsed,
          coverImage: null,
          coverImagePreview: parsed.coverImageUrl,
        };
      }
      return parsed;
    }
    return {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      galleryVisibility: "public",
      coverImage: null,
      coverImagePreview: undefined,
    };
  });

  React.useEffect(() => {
    return () => {
      localStorage.removeItem("eventFormData");
      if (formData.coverImagePreview) {
        URL.revokeObjectURL(formData.coverImagePreview);
      }
    };
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        const file = acceptedFiles[0];
        const preview = URL.createObjectURL(file);
        setFormData((prev) => ({
          ...prev,
          coverImage: file,
          coverImagePreview: preview,
        }));
      }
    },
    onDropRejected: (rejectedFiles) => {
      const error = rejectedFiles[0].errors[0];
      if (error.code === "file-too-large") {
        toast.error("File size must be less than 5MB");
      } else {
        toast.error("Invalid file type. Please upload an image.");
      }
    },
  });

  React.useEffect(() => {
    const dataToSave = {
      ...formData,
      coverImage: null,
      coverImageUrl: formData.coverImagePreview,
    };
    localStorage.setItem("eventFormData", JSON.stringify(dataToSave));
  }, [formData]);

  React.useEffect(() => {
    return () => {
      if (formData.coverImagePreview) {
        URL.revokeObjectURL(formData.coverImagePreview);
      }
    };
  }, [formData.coverImagePreview]);

  React.useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        startDate: eventToEdit.startDate,
        endDate: eventToEdit.endDate,
        location: eventToEdit.location,
        galleryVisibility: eventToEdit.galleryVisibility,
        coverImage: null,
        coverImagePreview: eventToEdit.coverImage || undefined,
      });
    }
  }, [eventToEdit]);

  const validateForm = () => {
    if (!formData.title || formData.title.length < 3) {
      toast.error("Title must be at least 3 characters long");
      return false;
    }
    if (!formData.description || formData.description.length < 10) {
      toast.error("Description must be at least 10 characters long");
      return false;
    }
    if (!formData.location || formData.location.length < 3) {
      toast.error("Location must be at least 3 characters long");
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select both start and end dates");
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("End date must be after start date");
      return false;
    }
    if (new Date(formData.startDate) < new Date()) {
      toast.error("Start date cannot be in the past");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const eventData: Partial<Event> = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        galleryVisibility: formData.galleryVisibility,
      };

      let eventId;
      if (eventToEdit) {
        const response = await eventApi.updateEvent(eventToEdit.id, {
          ...eventData,
          id: eventToEdit.id,
        } as Event);
        eventId = eventToEdit.id;
      } else {
        // Create new event
        const response = await eventApi.createEvent(eventData as Event);
        eventId = response.id;
      }

      if (formData.coverImage) {
        try {
          await photoApi.uploadEventCover(eventId, formData.coverImage);
        } catch (error) {
          toast.error("Failed to upload cover image");
          return;
        }
      }

      localStorage.removeItem("eventFormData");
      toast.success(
        eventToEdit
          ? "Event updated successfully!"
          : "Event created successfully!"
      );
      onViewChange("qr-generator");
      localStorage.setItem("barqpix_current_event", eventId);
    } catch (error: any) {
      toast.error(
        error.message ||
          (eventToEdit ? "Failed to update event" : "Failed to create event")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };

      if (
        name === "startDate" &&
        newData.endDate &&
        new Date(value) > new Date(newData.endDate)
      ) {
        newData.endDate = value;
      }

      return newData;
    });
  };

  const handleCancel = () => {
    localStorage.removeItem("eventFormData");
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      galleryVisibility: "public",
      coverImage: null,
      coverImagePreview: undefined,
    });

    onViewChange(previousView);
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <p>Please sign in to create an event.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl w-full">
      <Card>
        <CardHeader>
          <CardTitle>
            {eventToEdit ? "Edit Event" : "Create New Event"}
          </CardTitle>
          <CardDescription>
            {eventToEdit
              ? "Update your event details below."
              : "Set up your event details and get a unique QR code for guests to share photos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Summer Wedding 2025"
                required
                minLength={3}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Event location (e.g., Central Park, NYC)"
                required
                minLength={3}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Share a brief description of your event..."
                required
                minLength={10}
                maxLength={1000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date & Time</label>
                <Input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={
                    formData.startDate || new Date().toISOString().slice(0, 16)
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gallery Visibility</label>
              <select
                name="galleryVisibility"
                value={formData.galleryVisibility}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="public">
                  Public (anyone with link can view)
                </option>
                <option value="private">
                  Private (only event participants)
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover Image</label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary"
              >
                <input {...getInputProps()} />
                {formData.coverImagePreview ? (
                  <div className="relative">
                    <img
                      src={formData.coverImagePreview}
                      alt="Cover preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Click or drag to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Click or drag to upload cover image
                    </p>
                    <p className="text-xs text-gray-400">
                      Max file size: 5MB. Supported formats: JPG, PNG, GIF
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading
                  ? "Processing..."
                  : eventToEdit
                  ? "Update Event"
                  : "Create Event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
