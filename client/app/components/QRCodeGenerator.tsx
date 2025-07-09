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
  ImageIcon,
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
import { useSwipeable } from "react-swipeable";
import { auth } from "@/lib/utils/firebase";

type User = UserType;

interface QRCodeGeneratorProps {
  user: User | null;
  onViewChange: (view: string) => void;
  onCreateEvent: () => void;
  onViewQuickShare: (quickId: string) => void;
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
  quickId?: string;
}

interface SwipeableQRCodeItemProps {
  qrCode: QRCodeData;
  isSwiped: boolean;
  isMobile: boolean;
  setSwipedId: (id: string | null) => void;
  handleDeleteQRCode: (id: string) => void;
  loadExistingQRCode: (id: string) => void;
  onViewQuickShare: (quickId: string) => void;
}

function SwipeableQRCodeItem({
  qrCode,
  isSwiped,
  isMobile,
  setSwipedId,
  handleDeleteQRCode,
  loadExistingQRCode,
  onViewQuickShare,
}: SwipeableQRCodeItemProps) {
  const handlers = useSwipeable({
    onSwipedLeft: () => isMobile && setSwipedId(qrCode.id),
    onSwipedRight: () => isMobile && setSwipedId(null),
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  return (
    <div
      key={qrCode.id}
      {...(isMobile ? handlers : {})}
      className={`relative flex items-center justify-between p-4 border rounded-lg transition-colors bg-white overflow-hidden ${
        isMobile && isSwiped ? "translate-x-[-80px]" : ""
      }`}
      style={{
        touchAction: "pan-y",
        transition: "transform 0.2s",
        transform: isMobile && isSwiped ? "translateX(-80px)" : "translateX(0)",
      }}
    >
      {/* Delete action, only visible when swiped on mobile */}
      {isMobile && isSwiped && (
        <button
          className="absolute right-0 top-0 h-full w-20 bg-red-600 text-white flex items-center justify-center z-10"
          onClick={() => handleDeleteQRCode(qrCode.id)}
        >
          <Trash2 className="w-6 h-6" />
        </button>
      )}
      {/* Main content */}
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <div className="w-12 h-12 flex-shrink-0">
          <img
            src={qrCode.qrCodeData}
            alt={qrCode.title}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium truncate">{qrCode.title}</h4>
          <p className="text-sm text-muted-foreground truncate">
            {qrCode.type === "event" ? "Event QR Code" : "Quick Share Code"}
          </p>
          <p className="text-xs text-muted-foreground">
            Created: {new Date(qrCode.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span className="text-sm text-green-600 hidden sm:inline">
          {qrCode.scanCount} scan
          {qrCode.scanCount !== 1 ? "s" : ""}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadExistingQRCode(qrCode.id)}
          className="text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">View</span>
          <span className="w-6 h-6 sm:hidden">
            <QrCode className="w-5 h-5" />
          </span>
        </Button>
        {qrCode.type === "quick" && onViewQuickShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const quickId = qrCode.quickId || qrCode.url.split("/").pop();
              if (quickId) {
                onViewQuickShare(quickId);
              }
            }}
            className="text-xs sm:text-sm"
          >
            <ImageIcon className="w-4 h-4 mr-1 hidden sm:inline" />
            <span className="hidden sm:inline">Photos</span>
            <span className="w-6 h-6 sm:hidden">
              <ImageIcon className="w-5 h-5" />
            </span>
          </Button>
        )}
        {qrCode.type === "event" && (
          <div className="text-xs text-muted-foreground hidden sm:block">
            Go to Photo Gallery to view images
          </div>
        )}
        {/* Desktop delete button, always visible on desktop */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteQRCode(qrCode.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

const getCacheKey = (userId: string) => `events_${userId}`;

const getCachedEvents = (userId: string) => {
  const cache = localStorage.getItem(getCacheKey(userId));
  if (!cache) return null;
  try {
    const { events } = JSON.parse(cache);
    return events;
  } catch {
    return null;
  }
};

const setCachedEvents = (userId: string, events: any[]) => {
  localStorage.setItem(getCacheKey(userId), JSON.stringify({ events }));
};

const clearCachedEvents = (userId: string) => {
  localStorage.removeItem(getCacheKey(userId));
};

// QR Codes cache functions
const getQRCodesCacheKey = (userId: string) => `qr_codes_${userId}`;

const getCachedQRCodes = (userId: string) => {
  const cache = localStorage.getItem(getQRCodesCacheKey(userId));
  if (!cache) return null;
  try {
    const { qrCodes, timestamp } = JSON.parse(cache);
    // Cache expires after 5 minutes
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(getQRCodesCacheKey(userId));
      return null;
    }
    return qrCodes;
  } catch {
    return null;
  }
};

const setCachedQRCodes = (userId: string, qrCodes: QRCodeData[]) => {
  localStorage.setItem(
    getQRCodesCacheKey(userId),
    JSON.stringify({
      qrCodes,
      timestamp: Date.now(),
    })
  );
};

const clearCachedQRCodes = (userId: string) => {
  localStorage.removeItem(getQRCodesCacheKey(userId));
};

// Guest session persistence functions
const getGuestQRCode = () => {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("guest_qr_code");
  if (!saved) return null;
  try {
    const qrCode = JSON.parse(saved);
    // Check if the QR code has expired
    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      localStorage.removeItem("guest_qr_code");
      return null;
    }
    return qrCode;
  } catch {
    localStorage.removeItem("guest_qr_code");
    return null;
  }
};

const setGuestQRCode = (qrCode: QRCodeData) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("guest_qr_code", JSON.stringify(qrCode));
};

const clearGuestQRCode = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("guest_qr_code");
};

export default function QRCodeGenerator({
  user,
  onViewChange,
  onCreateEvent,
  onViewQuickShare,
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
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  if (!user) {
    onViewChange("register");
    return;
  }

  // Handle logout - clear cache
  useEffect(() => {
    if (!user && previousUserId) {
      clearCachedEvents(previousUserId);
      clearCachedQRCodes(previousUserId);
      setPreviousUserId(null);
      setUserEvents([]);
      setUserQRCodes([]);
    } else if (user?.id) {
      setPreviousUserId(user.id);
    }
  }, [user, previousUserId]);

  const handleEventChange = (value: string) => {
    console.log("handleEventChange called with value:", value);
    console.log("Available events:", userEvents);
    console.log(
      "Selected event:",
      userEvents.find((e) => e.id === value)
    );

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

      // Check if we have a newly created event
      const newEventId = localStorage.getItem("barqpix_current_event");
      console.log("New event ID from localStorage:", newEventId);

      // Check cache first
      const cached = getCachedEvents(user.id);
      const cachedQRCodes = getCachedQRCodes(user.id);

      // If we have a new event, always fetch fresh data to include it
      if (newEventId) {
        console.log("New event detected, fetching fresh data");
        try {
          const { events } = await eventApi.getUserEvents();
          console.log("Fetched fresh events from API:", events);
          setUserEvents(events);
          setCachedEvents(user.id, events);

          // Check if user is authenticated before making API call
          if (auth.currentUser) {
            const { qrCodes } = await qrApi.getUserQRCodes();
            setUserQRCodes(qrCodes);
            setCachedQRCodes(user.id, qrCodes);
          }

          // Store the newEventId to be processed in a separate useEffect
          localStorage.setItem("pending_event_selection", newEventId);
          localStorage.removeItem("barqpix_current_event");
        } catch (error) {
          console.error("Failed to load fresh data:", error);
          toast.error("Failed to load events and QR codes");
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Use cached data if available and no new event
      if (cached && !newEventId) {
        console.log("Using cached events:", cached);
        setUserEvents(cached);

        if (cachedQRCodes) {
          console.log("Using cached QR codes:", cachedQRCodes);
          setUserQRCodes(cachedQRCodes);
          setIsLoading(false);
          return;
        } else {
          // Events are cached but QR codes are not, fetch QR codes only
          console.log(
            "Events cached but QR codes not cached, fetching QR codes"
          );
          try {
            if (auth.currentUser) {
              const { qrCodes } = await qrApi.getUserQRCodes();
              setUserQRCodes(qrCodes);
              setCachedQRCodes(user.id, qrCodes);
            }
          } catch (error) {
            console.error("Failed to load QR codes:", error);
            toast.error("Failed to load QR codes");
          } finally {
            setIsLoading(false);
          }
          return;
        }
      }

      // Fallback: fetch fresh data if no cache or new event
      try {
        const { events } = await eventApi.getUserEvents();
        console.log("Fetched events from API:", events);
        setUserEvents(events);
        setCachedEvents(user.id, events);

        // Check if user is authenticated before making API call
        if (auth.currentUser) {
          const { qrCodes } = await qrApi.getUserQRCodes();
          setUserQRCodes(qrCodes);
          setCachedQRCodes(user.id, qrCodes);
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

  // Handle pending event selection after events are loaded
  useEffect(() => {
    const pendingEventId = localStorage.getItem("barqpix_current_event");
    if (pendingEventId && userEvents.length > 0) {
      console.log("Setting selected event to:", pendingEventId);
      setSelectedEvent(pendingEventId);
      setCurrentQRCode(null);
      setShowStats(false);
      localStorage.removeItem("barqpix_current_event");
    }
  }, [userEvents]);

  // Load guest QR code on mount if user is guest
  useEffect(() => {
    if (!user || user.isGuest) {
      const savedQRCode = getGuestQRCode();
      if (savedQRCode) {
        setCurrentQRCode(savedQRCode);
        setQuickTitle(savedQRCode.title);
      }
    }
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

      // Save QR code to localStorage for guest users
      if (!user || user.isGuest) {
        setGuestQRCode(response.qrCode);
      }

      if (user && !user.isGuest) {
        // Check if user is authenticated before making API call
        if (auth.currentUser) {
          const { qrCodes } = await qrApi.getUserQRCodes();
          setUserQRCodes(qrCodes);
          setCachedQRCodes(user.id, qrCodes);
        }
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
    setConfirmDeleteId(qrCodeId);
  };

  const confirmDeleteQRCode = async () => {
    if (!confirmDeleteId) return;

    setIsDeleting(true);
    try {
      await qrApi.deleteQRCode(confirmDeleteId);

      // Remove from userQRCodes
      setUserQRCodes((prev) => prev.filter((qr) => qr.id !== confirmDeleteId));

      // Update cache
      if (user?.id) {
        const updatedQRCodes = userQRCodes.filter(
          (qr) => qr.id !== confirmDeleteId
        );
        setCachedQRCodes(user.id, updatedQRCodes);
      }

      // If the deleted QR code is the current one, clear it
      if (currentQRCode?.id === confirmDeleteId) {
        setCurrentQRCode(null);
      }

      toast.success("QR Code deleted successfully");
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast.error("Failed to delete QR code");
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
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

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error(error.message || "Failed to load QR code");
    }
  };

  // Trigger deletion of expired quickshare QR code for both registered and guest users
  useEffect(() => {
    if (
      !currentQRCode ||
      currentQRCode.type !== "quick" ||
      !currentQRCode.expiresAt
    )
      return;
    const expiresAt = new Date(currentQRCode.expiresAt).getTime();
    const now = Date.now();
    if (expiresAt <= now) return;
    const timeout = setTimeout(async () => {
      try {
        if (user && !user.isGuest) {
          await qrApi.deleteQRCode(currentQRCode.id);
          setUserQRCodes((prev) =>
            prev.filter((qr) => qr.id !== currentQRCode.id)
          );
          if (user.id)
            setCachedQRCodes(
              user.id,
              userQRCodes.filter((qr) => qr.id !== currentQRCode.id)
            );
        } else if (currentQRCode.quickId) {
          await qrApi.deleteGuestQuickQRCode(currentQRCode.quickId);
          clearGuestQRCode();
        }
        setCurrentQRCode(null);
        toast.success("Expired QR code deleted.");
      } catch (error) {
        toast.error("Failed to delete expired QR code.");
      }
    }, expiresAt - now);
    return () => clearTimeout(timeout);
  }, [currentQRCode, user]);

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
                    <li>Are stored temporarily (30 minutes)</li>
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
                  onClick={onCreateEvent}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Event
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
                {currentQRCode.type === "quick" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const quickId =
                        currentQRCode.quickId ||
                        currentQRCode.url?.split("/").pop();
                      if (quickId) {
                        onViewQuickShare(quickId);
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Photos
                  </Button>
                )}
                {/* {user && !user.isGuest && (
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
                )} */}
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
          {user && userQRCodes.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="font-medium text-lg">Your QR Codes</h3>
              {/* Mobile swipe instructions */}
              <div className="md:hidden p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Swipe left on any QR code to reveal
                  the delete button
                </p>
              </div>
              <div className="grid gap-4">
                {userQRCodes.map((qrCode) => (
                  <SwipeableQRCodeItem
                    key={qrCode.id}
                    qrCode={{
                      ...qrCode,
                      quickId:
                        qrCode.quickId ||
                        (qrCode.type === "quick"
                          ? qrCode.url?.split("/").pop() || ""
                          : undefined),
                    }}
                    isSwiped={swipedId === qrCode.id}
                    isMobile={
                      typeof window !== "undefined" && window.innerWidth < 768
                    }
                    setSwipedId={setSwipedId}
                    handleDeleteQRCode={handleDeleteQRCode}
                    loadExistingQRCode={loadExistingQRCode}
                    onViewQuickShare={onViewQuickShare}
                  />
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

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <div className="mb-4 font-semibold">
              Are you sure you want to delete this QR code?
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteQRCode}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
