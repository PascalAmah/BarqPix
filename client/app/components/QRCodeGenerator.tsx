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
import {
  QrCode,
  Download,
  Share,
  Plus,
  Users,
  User as UserIcon,
  Trash2,
  BarChart3,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { toast } from "../components/ui/toast";
import type { User as UserType, Event } from "../types";
import { eventApi } from "@/lib/api/event";
import { qrApi } from "@/lib/api/qr";

type User = UserType;

interface QRCodeGeneratorProps {
  user: User | null;
  onViewChange: (view: string) => void;
}

interface QRCodeData {
  id: string;
  eventId?: string;
  userId: string;
  type: "event" | "quick";
  title: string;
  url: string;
  qrCodeData: string;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export default function QRCodeGenerator({
  user,
  onViewChange,
}: QRCodeGeneratorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [userQRCodes, setUserQRCodes] = useState<QRCodeData[]>([]);
  const [currentQRCode, setCurrentQRCode] = useState<QRCodeData | null>(null);
  const [quickTitle, setQuickTitle] = useState<string>("");
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [qrStats, setQrStats] = useState<any>(null);

  const handleEventChange = (value: string) => {
    setSelectedEvent(value);
    setCurrentQRCode(null);
    setShowStats(false);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.isGuest) {
        setIsLoading(false);
        return;
      }

      try {
        const { events } = await eventApi.getUserEvents();
        setUserEvents(events);

        const { qrCodes } = await qrApi.getUserQRCodes();
        setUserQRCodes(qrCodes);

        const newEventId = localStorage.getItem("barqpix_current_event");
        if (newEventId) {
          handleEventChange(newEventId);
          localStorage.removeItem("barqpix_current_event");
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load events and QR codes");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const generateQRCode = async () => {
    if ((!user || user.isGuest) && !quickTitle.trim()) {
      toast.error("Please enter a title for your QR code");
      return;
    }

    if (user && !user.isGuest && !selectedEvent) {
      toast.error("Please select an event or choose quick share");
      return;
    }

    setIsGenerating(true);
    try {
      let response;

      if (!user || user.isGuest || selectedEvent === "quick") {
        if (!user || user.isGuest) {
          response = await qrApi.generateGuestQuickQR(quickTitle.trim());
        } else {
          response = await qrApi.generateQuickQR(quickTitle.trim());
        }
      } else {
        response = await qrApi.generateEventQR(selectedEvent);
      }

      setCurrentQRCode(response.qrCode);

      if (user && !user.isGuest) {
        const { qrCodes } = await qrApi.getUserQRCodes();
        setUserQRCodes(qrCodes);
      }

      toast.success("QR Code generated successfully!");
    } catch (error: any) {
      console.error("Failed to generate QR code:", error);
      toast.error(error.message || "Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (!currentQRCode) throw new Error("No QR code generated");

      const response = await fetch(currentQRCode.qrCodeData);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `barqpix-qr-${currentQRCode.title || "event"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("QR Code downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  const handleShare = async () => {
    try {
      if (!currentQRCode) throw new Error("No QR code generated");
      await navigator.clipboard.writeText(currentQRCode.url);
      toast.success("QR Code URL copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy QR code URL");
    }
  };

  const handleDeleteQRCode = async (qrCodeId: string) => {
    try {
      await qrApi.deleteQRCode(qrCodeId);

      if (user && !user.isGuest) {
        const { qrCodes } = await qrApi.getUserQRCodes();
        setUserQRCodes(qrCodes);
      }

      if (currentQRCode?.id === qrCodeId) {
        setCurrentQRCode(null);
        setShowStats(false);
      }

      toast.success("QR Code deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete QR code");
    }
  };

  const handleViewStats = async (qrCodeId: string) => {
    try {
      const response = await qrApi.getQRCodeStats(qrCodeId);
      setQrStats(response.stats);
      setShowStats(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load QR code statistics");
    }
  };

  const loadExistingQRCode = async (qrCodeId: string) => {
    try {
      const response = await qrApi.getQRCode(qrCodeId);
      setCurrentQRCode(response.qrCode);
      setShowStats(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to load QR code");
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <p>Loading events...</p>
        </CardContent>
      </Card>
    );
  }

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
                  disabled={isGenerating || !quickTitle.trim()}
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
                <Select value={selectedEvent} onValueChange={handleEventChange}>
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
                    isGenerating ||
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

          {currentQRCode && (
            <div className="mt-6 space-y-6">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-[256px] aspect-square">
                  <img
                    src={currentQRCode.qrCodeData}
                    alt="Generated QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* QR Code Info */}
              <div className="text-center space-y-2">
                <h3 className="font-medium text-lg">{currentQRCode.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentQRCode.type === "event"
                    ? "Event QR Code"
                    : "Quick Share Code"}
                </p>
                {currentQRCode.scanCount > 0 && (
                  <p className="text-sm text-green-600">
                    {currentQRCode.scanCount} scan
                    {currentQRCode.scanCount !== 1 ? "s" : ""}
                  </p>
                )}
                {currentQRCode.expiresAt && (
                  <p className="text-sm text-amber-600">
                    Expires:{" "}
                    {new Date(currentQRCode.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full sm:w-auto"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                {user && !user.isGuest && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleViewStats(currentQRCode.id)}
                      className="w-full sm:w-auto"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Stats
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteQRCode(currentQRCode.id)}
                      className="w-full sm:w-auto text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>

              {/* Statistics Display */}
              {showStats && qrStats && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">QR Code Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Scans</p>
                      <p className="font-medium">{qrStats.totalScans}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unique Scanners</p>
                      <p className="font-medium">{qrStats.uniqueScanners}</p>
                    </div>
                  </div>
                  {qrStats.recentScans && qrStats.recentScans.length > 0 && (
                    <div className="mt-4">
                      <p className="text-muted-foreground mb-2">Recent Scans</p>
                      <div className="space-y-1">
                        {qrStats.recentScans
                          .slice(0, 5)
                          .map((scan: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between text-xs"
                            >
                              <span>{scan.scannerName || "Anonymous"}</span>
                              <span>
                                {new Date(scan.scannedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QR Code History for Registered Users */}
          {user && !user.isGuest && userQRCodes.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="font-medium text-lg">Your QR Codes</h3>
              <div className="grid gap-4">
                {userQRCodes.map((qrCode) => (
                  <div
                    key={qrCode.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12">
                        <img
                          src={qrCode.qrCodeData}
                          alt={qrCode.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{qrCode.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {qrCode.type === "event"
                            ? "Event QR Code"
                            : "Quick Share Code"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created:{" "}
                          {new Date(qrCode.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600">
                        {qrCode.scanCount} scan
                        {qrCode.scanCount !== 1 ? "s" : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadExistingQRCode(qrCode.id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQRCode(qrCode.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
