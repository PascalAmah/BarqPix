"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Camera, Upload, ImageIcon, X, Scan, Type, Plus } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { toast } from "@/app/components/ui/toast";
import { eventApi } from "@/lib/api/event";
import type { Event } from "../types";

interface PhotoUploadProps {
  userId: string | null;
  eventId?: string | null;
  eventDetails?: {
    title: string;
    startDate: string;
    endDate: string;
  };
  onViewChange: (view: string) => void;
}

export default function PhotoUpload({
  userId,
  eventId,
  eventDetails,
  onViewChange,
}: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photoMeta, setPhotoMeta] = useState<
    { caption: string; tags: string[] }[]
  >([]);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "");
  const [selectedEventDetails, setSelectedEventDetails] =
    useState<any>(eventDetails);

  const [showJoinEvent, setShowJoinEvent] = useState(false);
  const [manualEventId, setManualEventId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [joiningEvent, setJoiningEvent] = useState(false);

  // Load user events for logged-in users
  useEffect(() => {
    const loadUserEvents = async () => {
      if (userId && !eventId) {
        try {
          const { events } = await eventApi.getUserEvents();
          setUserEvents(events);
        } catch (error) {
          console.error("Failed to load user events:", error);
        }
      }
    };

    loadUserEvents();
  }, [userId, eventId]);

  // Update selected event details when eventId changes
  useEffect(() => {
    if (eventId) {
      setSelectedEventId(eventId);
      setSelectedEventDetails(eventDetails);
    }
  }, [eventId, eventDetails]);

  const handleEventChange = (value: string) => {
    setSelectedEventId(value);
    const selectedEvent = userEvents.find((event) => event.id === value);
    setSelectedEventDetails(selectedEvent || null);
  };

  // New function to handle barcode scanning
  const handleBarcodeScan = async (scannedData: string) => {
    setScanning(true);
    try {
      const eventId = scannedData.trim();

      await eventApi.joinEvent(eventId);

      const { event } = await eventApi.getEvent(eventId);

      setSelectedEventId(eventId);
      setSelectedEventDetails(event);
      setShowJoinEvent(false);

      toast.success(`Successfully joined event: ${event.title}`);

      const { events } = await eventApi.getUserEvents();
      setUserEvents(events);
    } catch (error) {
      console.error("Failed to join event:", error);
      toast.error(
        "Failed to join event. Please check the QR code or event ID."
      );
    } finally {
      setScanning(false);
    }
  };

  const handleManualJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEventId.trim()) return;

    setJoiningEvent(true);
    try {
      await handleBarcodeScan(manualEventId.trim());
      setManualEventId("");
    } catch (error) {
    } finally {
      setJoiningEvent(false);
    }
  };

  // Simulate barcode scanning (for demo purposes)
  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const mockEventId = `event_${Date.now()}`;
      handleBarcodeScan(mockEventId);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    setPhotoMeta((prev) => [
      ...prev,
      ...files.map(() => ({ caption: "", tags: [] })),
    ]);
    setFilePreviews((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoMeta((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCaptionChange = (index: number, value: string) => {
    setPhotoMeta((prev) =>
      prev.map((meta, i) => (i === index ? { ...meta, caption: value } : meta))
    );
  };

  const handleTagsChange = (index: number, value: string) => {
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setPhotoMeta((prev) =>
      prev.map((meta, i) => (i === index ? { ...meta, tags } : meta))
    );
  };

  const handleAISuggest = async (index: number) => {
    setAiLoading(index);
    // Simulate AI API call (replace with real API call as needed)
    await new Promise((resolve) => setTimeout(resolve, 1200));
    // Example AI suggestion
    const aiCaption = "A beautiful moment at the event.";
    const aiTags = ["event", "fun", "memories"];
    setPhotoMeta((prev) =>
      prev.map((meta, i) =>
        i === index ? { ...meta, caption: aiCaption, tags: aiTags } : meta
      )
    );
    setAiLoading(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    if (userId && !selectedEventId) {
      toast.error("Please select an event to upload photos to");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file, i) => {
        formData.append("photos", file);
        formData.append("captions[]", photoMeta[i]?.caption || "");
        formData.append("tags[]", (photoMeta[i]?.tags || []).join(","));
      });

      const endpoint = selectedEventId
        ? `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
          }/api/photos/${selectedEventId}`
        : `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
          }/api/photos/quick/${userId || "anonymous"}`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      setSelectedFiles([]);
      setPhotoMeta([]);
      setFilePreviews([]);
      setUploadedCount(selectedFiles.length);
      setUploading(false);

      toast.success(
        `Successfully uploaded ${selectedFiles.length} photo${
          selectedFiles.length > 1 ? "s" : ""
        } to ${selectedEventDetails?.title || "the event"}!`
      );

      setTimeout(() => {
        onViewChange("gallery");
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(`Upload failed: ${errorMessage}`);
    }
  };

  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Camera className="w-6 h-6" />
            {eventDetails ? eventDetails.title : "Upload Photos"}
          </CardTitle>
          <CardDescription>
            {eventDetails ? (
              <div className="space-y-1">
                <p className="text-sm">Share your photos for this event</p>
                <p className="text-xs text-muted-foreground">
                  Event runs from{" "}
                  {new Date(eventDetails.startDate).toLocaleString()} to{" "}
                  {new Date(eventDetails.endDate).toLocaleString()}
                </p>
              </div>
            ) : (
              <p>
                Photos will be linked to{" "}
                {userId ? `user: ${userId}` : "this event"}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userId && !eventId && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select Event</label>
                {!showJoinEvent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJoinEvent(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Join New Event
                  </Button>
                )}
              </div>

              {showJoinEvent ? (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Join Event</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowJoinEvent(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Tabs defaultValue="scan" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="scan">Scan QR</TabsTrigger>
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scan" className="space-y-4">
                      <div className="text-center space-y-4">
                        <div className="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300">
                          {scanning ? (
                            <div className="space-y-4">
                              <div className="animate-pulse">
                                <Scan className="w-12 h-12 mx-auto text-blue-600" />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Scanning QR code...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Scan className="w-12 h-12 mx-auto text-gray-400" />
                              <p className="text-sm text-muted-foreground">
                                Scan event QR code to join
                              </p>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={simulateScan}
                          disabled={scanning}
                          className="w-full"
                        >
                          {scanning ? "Scanning..." : "Start QR Scan"}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4">
                      <form
                        onSubmit={handleManualJoinEvent}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="eventId">Event ID</Label>
                          <Input
                            id="eventId"
                            type="text"
                            placeholder="Enter event ID"
                            value={manualEventId}
                            onChange={(e) => setManualEventId(e.target.value)}
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={joiningEvent}
                        >
                          {joiningEvent ? "Joining..." : "Join Event"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                userEvents.length > 0 && (
                  <Select
                    value={selectedEventId}
                    onValueChange={handleEventChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an event to upload photos to" />
                    </SelectTrigger>
                    <SelectContent>
                      {userEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              )}
            </div>
          )}

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop photos here, or click to select
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Select Photos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Take a photo using your device camera
                </p>
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                >
                  Open Camera
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </TabsContent>
          </Tabs>

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">
                Selected Photos ({selectedFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {filePreviews[index] ? (
                        <img
                          src={filePreviews[index]}
                          alt={file.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {file.name}
                    </p>
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      className="mt-1 w-full border rounded p-1 text-xs"
                      value={photoMeta[index]?.caption || ""}
                      onChange={(e) =>
                        handleCaptionChange(index, e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      className="mt-1 w-full border rounded p-1 text-xs"
                      value={photoMeta[index]?.tags.join(", ") || ""}
                      onChange={(e) => handleTagsChange(index, e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => handleAISuggest(index)}
                      disabled={aiLoading === index}
                    >
                      {aiLoading === index
                        ? "Suggesting..."
                        : "Suggest Caption/Tags"}
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading || (!!userId && !selectedEventId)}
                className="w-full"
              >
                {uploading
                  ? `Uploading... ${uploadedCount}/${selectedFiles.length}`
                  : `Upload ${selectedFiles.length} Photo${
                      selectedFiles.length > 1 ? "s" : ""
                    }`}
              </Button>
            </div>
          )}

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(uploadedCount / selectedFiles.length) * 100}%`,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
