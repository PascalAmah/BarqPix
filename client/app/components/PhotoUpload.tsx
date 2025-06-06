"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Upload, Camera, ImageIcon, X } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";

interface PhotoUploadProps {
  userId: string | null;
  eventId?: string;
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!userId || selectedFiles.length === 0) return;

    setUploading(true);

    // Simulate upload process
    for (let i = 0; i < selectedFiles.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUploadedCount(i + 1);
    }

    setUploading(false);
    setSelectedFiles([]);
    setUploadedCount(0);

    // Show success and redirect
    setTimeout(() => {
      onViewChange("gallery");
    }, 1500);
  };

  if (!userId) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <p>Please scan a QR code first to link photos to a user.</p>
          <Button onClick={() => onViewChange("scanner")} className="mt-4">
            Go to Scanner
          </Button>
        </CardContent>
      </Card>
    );
  }

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
              <p>Photos will be linked to user: {userId}</p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
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

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">
                Selected Photos ({selectedFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
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
                  </div>
                ))}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading}
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
