"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

interface CreateEventProps {
  user: any;
  onViewChange: (view: string) => void;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  coverImage: File | null;
  coverImagePreview?: string;
}

export default function CreateEvent({ user, onViewChange }: CreateEventProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<EventFormData>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    coverImage: null,
    coverImagePreview: undefined,
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
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
  });

  // Cleanup preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (formData.coverImagePreview) {
        URL.revokeObjectURL(formData.coverImagePreview);
      }
    };
  }, [formData.coverImagePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formPayload = new FormData();
      formPayload.append("title", formData.title);
      formPayload.append("description", formData.description);
      formPayload.append("startDate", formData.startDate);
      formPayload.append("endDate", formData.endDate);
      if (formData.coverImage) {
        formPayload.append("coverImage", formData.coverImage);
      }

      // TODO: Replace with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Event created successfully!");
      onViewChange("qr-generator"); // Navigate to QR generator after success
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Set up your event details and get a unique QR code for guests to
            share photos.
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
              />
            </div>{" "}
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
              <label className="text-sm font-medium">
                Cover Image (Optional)
              </label>{" "}
              <div
                {...getRootProps()}
                className="flex h-32 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/50 hover:bg-muted/70 relative overflow-hidden"
              >
                <input {...getInputProps()} />
                {formData.coverImagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={formData.coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm">
                        Click or drag to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="text-sm text-muted-foreground">
                      Drag and drop an image or click to upload
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Supports: JPEG, PNG, GIF
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={
                loading ||
                !formData.title ||
                !formData.startDate ||
                !formData.endDate
              }
            >
              {" "}
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Event...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Event & Generate QR Code
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
