"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ImageIcon, Clock, Upload } from "lucide-react";
import { photoApi } from "@/lib/api/photo";
import { qrApi } from "@/lib/api/qr";
import { toast } from "@/app/components/ui/toast";

interface QuickShareViewerProps {
  quickId: string;
  onViewChange: (view: string) => void;
}

interface Photo {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
}

export default function QuickShareViewer({
  quickId,
  onViewChange,
}: QuickShareViewerProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [qrCodeDetails, setQrCodeDetails] = useState<any>(null);
  const [expired, setExpired] = useState(false);

  // Fetch QR code details and set up expiration timer
  useEffect(() => {
    const fetchQRCodeDetails = async () => {
      if (!quickId || quickId.trim() === "") {
        console.error("QuickShareViewer: No quickId provided");
        toast.error("Invalid Quick Share link.");
        onViewChange("home");
        return;
      }

      try {
        const response = await qrApi.trackQRScan(
          quickId,
          "anonymous",
          "Anonymous"
        );
        const details = response.qrCode;
        setQrCodeDetails(details);

        if (details.expiresAt) {
          const updateTimeLeft = () => {
            const now = Date.now();
            const expires = new Date(details.expiresAt).getTime();
            const left = Math.max(0, expires - now);
            setTimeLeft(left);

            if (left <= 0 && !expired) {
              setExpired(true);
              if (typeof window !== "undefined") {
                localStorage.removeItem("guest_qr_code");
                localStorage.removeItem("current_quick_id");
              }
              toast.error("This Quick Share session has expired.");
              setTimeout(() => {
                onViewChange("home");
              }, 3000);
              return true;
            }
            return false;
          };

          updateTimeLeft();
          const timer = setInterval(() => {
            const shouldClear = updateTimeLeft();
            if (shouldClear) {
              clearInterval(timer);
            }
          }, 1000);
          return () => clearInterval(timer);
        }
      } catch (error) {
        console.error("Failed to fetch QR code details:", error);
        toast.error("Failed to load Quick Share details.");
        onViewChange("home");
      }
    };

    fetchQRCodeDetails();
  }, [quickId, onViewChange]);

  // Fetch quick share photos
  useEffect(() => {
    const fetchPhotos = async () => {
      if (!quickId || quickId.trim() === "") {
        console.error("QuickShareViewer: No quickId provided for photo fetch");
        return;
      }

      setLoading(true);
      try {
        const data = await photoApi.getQuickSharePhotos(quickId, 50, 0);
        setPhotos(data.photos || []);
        console.log(`Loaded ${data.photos?.length || 0} quick share photos`);
      } catch (error) {
        console.error("Failed to fetch quick share photos:", error);
        toast.error("Failed to load photos");
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();

    // Set up periodic refresh every 30 seconds to get new photos
    const refreshInterval = setInterval(fetchPhotos, 30000);

    return () => clearInterval(refreshInterval);
  }, [quickId]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if ((timeLeft <= 0 && qrCodeDetails) || expired) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Session Expired</h3>
          <p className="text-muted-foreground mb-4">
            This Quick Share session has expired. Photos are no longer
            available.
          </p>
          <Button onClick={() => onViewChange("home")}>Return to Home</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-6 h-6" />
                {qrCodeDetails?.title || "Quick Share Photos"}
              </CardTitle>
              <CardDescription className="mt-1">
                Photos shared via quick share • Session expires in{" "}
                <span className="font-mono font-bold text-orange-600">
                  {formatTime(timeLeft)}
                </span>
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                if (qrCodeDetails?.title) {
                  localStorage.setItem("quickshare_title", qrCodeDetails.title);
                }
                onViewChange("upload");
              }}
              variant="outline"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Warning */}
          {timeLeft < 300000 && timeLeft > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                ⚠️ Session expires in {formatTime(timeLeft)}. Download any
                photos you want to keep!
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Photos Grid */}
          {!loading && photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo.url || "/placeholder.svg"}
                      alt={photo.caption || "Photo"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2">
                    {photo.caption && (
                      <p className="text-xs font-medium text-foreground truncate">
                        {photo.caption}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && photos.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No photos found</h3>
              <p className="text-muted-foreground mb-4">
                No photos have been uploaded to this quick share yet
              </p>
              <Button variant="outline" onClick={() => onViewChange("upload")}>
                Upload First Photo
              </Button>
            </div>
          )}

          {/* Stats */}
          {!loading && photos.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total photos: {photos.length}</span>
                <span>Session expires: {formatTime(timeLeft)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
