"use client";

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
import { Search, Type } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { toast } from "@/app/components/ui/toast";
import { eventApi } from "@/lib/api/event";

interface EventAccessProps {
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

export default function EventAccess({
  onScanComplete,
  onViewChange,
}: EventAccessProps) {
  const [eventTitle, setEventTitle] = useState("");
  const [manualQRCode, setManualQRCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Event[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
    };

    checkMobile();
  }, []);

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

  const clearSearchResults = () => {
    setSuggestions([]);
    setShowSuggestions(false);
    setEventTitle("");
    setError(null);
  };

  const handleEventSelect = (event: Event) => {
    const eventUrl = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/upload/${event.id}`;
    toast.success(`Selected event: ${event.title}`);
    setLastScanned(eventUrl);
    onScanComplete(eventUrl);
    onViewChange("upload");
    clearSearchResults();
  };

  const handleEventSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const data = await eventApi.searchEvents(eventTitle.trim());

      if (data.events && data.events.length > 0) {
        setSuggestions(data.events);
        setShowSuggestions(true);
        toast.success(`Found ${data.events.length} event(s)`);
      } else {
        setError("No events found with that title.");
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Event search error:", error);
      setError("Failed to search for events. Please try again.");
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearching(false);
    }
  };

  const handleManualQRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQRCode.trim()) return;

    try {
      const url = new URL(manualQRCode.trim());
      if (
        url.pathname.startsWith("/quick/") ||
        url.pathname.startsWith("/upload/")
      ) {
        toast.success("QR code URL entered successfully!");
        setLastScanned(manualQRCode.trim());
        onScanComplete(manualQRCode.trim());
        onViewChange("upload");
        setManualQRCode("");
      } else {
        setError(
          "Invalid QR code URL format. Please enter a valid BarqPix QR code URL."
        );
      }
    } catch {
      setError("Invalid URL format. Please enter a valid BarqPix QR code URL.");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Search className="w-6 h-6" />
            Event Access
          </CardTitle>
          <CardDescription>
            Search for events or enter QR code URLs to upload photos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-1">
                <Search className="w-4 h-4" />
                Event Search
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-1">
                <Type className="w-4 h-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              {isMobile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Search className="w-4 h-4" />
                    <p className="text-sm font-medium">
                      Recommended for Mobile
                    </p>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Search for events by title - works reliably on all devices.
                  </p>
                </div>
              )}

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
                        <div className="p-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                          <p className="text-xs font-medium text-gray-700">
                            Found {suggestions.length} event(s) - Select one:
                          </p>
                          <button
                            type="button"
                            onClick={clearSearchResults}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Clear
                          </button>
                        </div>
                        {suggestions.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => handleEventSelect(event)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">
                              {event.title}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {event.location && `${event.location} • `}
                              {new Date(event.startDate).toLocaleDateString()}
                            </div>
                            {event.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {event.description}
                              </div>
                            )}
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
                  {searching ? "Searching..." : "Search for Events"}
                </Button>
              </form>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              {isMobile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Type className="w-4 h-4" />
                    <p className="text-sm font-medium">
                      Alternative for Mobile
                    </p>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Enter the QR code URL directly if you have it.
                  </p>
                </div>
              )}

              <form onSubmit={handleManualQRSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manualQRCode">QR Code URL</Label>
                  <Input
                    id="manualQRCode"
                    type="url"
                    placeholder="https://yourdomain.com/quick/abc123 or https://yourdomain.com/upload/event123"
                    value={manualQRCode}
                    onChange={(e) => setManualQRCode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the full URL from a BarqPix QR code
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  <Type className="w-4 h-4 mr-2" />
                  Submit QR Code URL
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
                ✓ Last accessed: {lastScanned}
              </p>
            </div>
          )}

          {isMobile && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Usage Tips:
              </h4>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>
                  • <strong>Event Search:</strong> Best option - search by event
                  title
                </li>
                <li>
                  • <strong>Manual Entry:</strong> Enter QR code URL if you have
                  it
                </li>
                <li>
                  • Both options work reliably on all devices and browsers
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
