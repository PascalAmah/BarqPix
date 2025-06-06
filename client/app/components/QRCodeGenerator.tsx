"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  QrCode,
  Download,
  Share,
  User as UserIcon,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { User as UserType, Event } from "../types";
type User = UserType;

interface QRCodeGeneratorProps {
  user: User | null;
  onViewChange: (view: string) => void;
}

export default function QRCodeGenerator({
  user,
  onViewChange,
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("quick");
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState<string>("");
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      if (user && !user.isGuest) {
        try {
          // Simulate API call
          const mockEvents: Event[] = [
            {
              id: "1",
              title: "Summer Wedding 2025",
              startDate: "2025-06-15T14:00",
              endDate: "2025-06-15T23:00",
              organizerId: user.id,
            },
          ];
          setUserEvents(mockEvents);
        } catch (error) {
          toast.error("Failed to load events");
        }
      } else {
        setUserEvents([]);
      }
      setLoading(false);
    };

    loadEvents();
  }, [user]);

  const generateQRCode = async () => {
    try {
      setLoading(true);

      // Input validation
      if (!selectedEvent) {
        throw new Error("Please select an event or choose quick share");
      }

      if (
        (selectedEvent === "quick" || !user || user.isGuest) &&
        !quickTitle.trim()
      ) {
        throw new Error("Please enter a title for your QR code");
      }

      let qrData: string;
      if (!user || user.isGuest || selectedEvent === "quick") {
        qrData = `BarqPix Quick Share - ${quickTitle.trim()}`;
      } else {
        const event = userEvents.find((e) => e.id === selectedEvent);
        if (!event) throw new Error("Selected event not found");
        qrData = `BarqPix Event - ${event.title}`;
      }

      const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=456x456&data=${encodeURIComponent(
        qrData
      )}`;
      setQrCodeUrl(mockQrCode);

      // mock preview photos
      const mockPhotos = [
        "/placeholder.svg?height=300&width=300",
        "/placeholder.svg?height=300&width=300",
        "/placeholder.svg?height=300&width=300",
      ];
      setPreviewPhotos(mockPhotos);

      toast.success("QR Code generated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate QR code"
      );
      setQrCodeUrl("");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (!qrCodeUrl) throw new Error("No QR code generated");

      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `barqpix-qr-${quickTitle || "event"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      toast.success("QR Code URL copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy QR code URL");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader className="space-y-2 sm:space-y-3">
          <CardTitle className="flex items-center justify-center space-x-2 text-xl sm:text-2xl">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <span>QR Code Generator</span>
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            {user
              ? "Generate QR codes for your events or create a quick share code"
              : "Create a quick QR code for sharing photos"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!user || user.isGuest ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Quick Title</label>
                <Input
                  placeholder="Enter a title for your QR code"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full"
                />
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                  <h4 className="font-medium mb-1">Guest Preview Mode</h4>
                  <p>Photos taken in guest mode:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Are stored temporarily (24 hours)</li>
                    <li>Can't be downloaded or shared</li>
                    <li>Will be automatically deleted</li>
                  </ul>
                  <p className="mt-2">
                    <Button
                      variant="link"
                      className="text-amber-700 font-medium p-0 h-auto"
                      onClick={() => onViewChange("register")}
                    >
                      Sign up now
                    </Button>{" "}
                    to save photos permanently and unlock all features!
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => onViewChange("register")}
                  className="w-full sm:w-auto"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Sign in for more features
                </Button>
                <Button
                  onClick={generateQRCode}
                  disabled={loading || !quickTitle.trim()}
                  className="w-full sm:w-auto"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Event</label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Share Code</SelectItem>
                    {!user.isGuest &&
                      userEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {user.isGuest && selectedEvent !== "quick" && (
                  <p className="text-sm text-muted-foreground">
                    Sign up for a full account to create and manage events
                  </p>
                )}
              </div>

              {selectedEvent === "quick" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Quick Title</label>
                  <Input
                    placeholder="Enter a title for your QR code"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    onViewChange(user?.isGuest ? "register" : "create-event")
                  }
                  className="w-full sm:w-auto"
                >
                  {user?.isGuest ? (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Sign Up to Create Events
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Event
                    </>
                  )}
                </Button>
                <Button
                  onClick={generateQRCode}
                  disabled={
                    loading ||
                    !selectedEvent ||
                    (selectedEvent === "quick" && !quickTitle.trim())
                  }
                  className="w-full sm:w-auto"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
              </div>
            </>
          )}

          {qrCodeUrl && (
            <div className="mt-6 space-y-6">
              <div className="flex justify-center">
                <div className="relative w-full max-w-[256px] aspect-square">
                  <img
                    src={qrCodeUrl}
                    alt="Generated QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="w-full sm:w-auto"
                  disabled={!qrCodeUrl}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full sm:w-auto"
                  disabled={!qrCodeUrl}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </div>

              {/* Preview Section for Guests */}
              {(!user || user.isGuest) && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-700 mb-2">
                      How it works:
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                      <li>Share this QR code with event guests</li>
                      <li>Guests scan and take photos</li>
                      <li>Photos appear here instantly</li>
                      <li>Preview photos for 24 hours</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Example Preview:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {previewPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                        >
                          <img
                            src={photo}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Add 24h indicator */}
                          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                            24h
                          </div>
                          {/* Add preview overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-sm">
                              Available for 24 hours
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Want to keep your photos forever?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary"
                        onClick={() => onViewChange("register")}
                      >
                        Sign up for a full account
                      </Button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="text-sm text-muted-foreground">
                  Generating QR Code...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
