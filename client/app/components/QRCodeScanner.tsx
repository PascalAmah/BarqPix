"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
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
import { Scan, Camera, X, Search } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { toast } from "@/app/components/ui/toast";
import { eventApi } from "@/lib/api/event";

const QrReader = dynamic(
  () => import("react-qr-reader").then((mod) => ({ default: mod.QrReader })),
  { ssr: false }
);

interface QRCodeScannerProps {
  onScanComplete: (scannedData: string) => void;
  onViewChange: (view: string) => void;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}

export default function QRCodeScanner({
  onScanComplete,
  onViewChange,
}: QRCodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Event[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleScan = (data: string | null) => {
    if (data) {
      setScanning(false);
      setError(null);

      // Validate the scanned data is a URL
      try {
        const url = new URL(data);
        if (
          url.pathname.startsWith("/quick/") ||
          url.pathname.startsWith("/upload/")
        ) {
          toast.success("QR code scanned successfully!");
          setLastScanned(data);
          onScanComplete(data);
          onViewChange("upload");
        } else {
          setError("Invalid QR code format. Please scan a BarqPix QR code.");
        }
      } catch {
        setError("Invalid QR code. Please scan a valid BarqPix QR code.");
      }
    }
  };

  const handleError = (err: any) => {
    console.error("QR scan error:", err);
    setError("Camera access denied or QR scanner error. Please try again.");
    setScanning(false);
  };

  // Debounced search for suggestions
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (eventTitle.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const data = await eventApi.searchEvents(eventTitle.trim());
          setSuggestions(data.events || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Search suggestions error:", error);
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [eventTitle]);

  const handleEventSelect = (event: Event) => {
    const eventUrl = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/upload/${event.id}`;
    toast.success(`Selected event: ${event.title}`);
    setLastScanned(eventUrl);
    onScanComplete(eventUrl);
    onViewChange("upload");
    setEventTitle("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleEventSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const data = await eventApi.searchEvents(eventTitle.trim());

      if (data.events && data.events.length > 0) {
        const event = data.events[0];
        handleEventSelect(event);
      } else {
        setError("No events found with that title.");
      }
    } catch (error) {
      console.error("Event search error:", error);
      setError("Failed to search for events. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setError(null);
  };

  const stopScanning = () => {
    setScanning(false);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Scan className="w-6 h-6" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>
            Scan a BarqPix QR code or search for events to upload photos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">Camera Scan</TabsTrigger>
              <TabsTrigger value="search">Event Search</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="text-center space-y-4">
                {!scanning ? (
                  <div className="bg-gray-100 rounded-lg p-8 border-2 border-dashed border-gray-300">
                    <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Click start to access your camera and scan a QR code
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <QrReader
                      onResult={(result) => {
                        if (result) {
                          handleScan(result.getText());
                        }
                      }}
                      constraints={{
                        facingMode: "environment",
                      }}
                      className="w-full h-64"
                    />
                    <Button
                      onClick={stopScanning}
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {!scanning && (
                  <Button onClick={startScanning} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera Scan
                  </Button>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Camera access required for QR code scanning
                </p>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <form onSubmit={handleEventSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <div className="relative">
                    <Input
                      id="eventTitle"
                      type="text"
                      placeholder="Type to search for events..."
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      required
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => handleEventSelect(event)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-500">
                              {event.location && `${event.location} • `}
                              {new Date(event.startDate).toLocaleDateString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Start typing to see event suggestions
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={searching}>
                  <Search className="w-4 h-4 mr-2" />
                  {searching ? "Searching..." : "Search Events"}
                </Button>
              </form>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {lastScanned && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Last scanned: {lastScanned}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
