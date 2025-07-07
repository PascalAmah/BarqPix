"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  ImageIcon,
  Download,
  Share,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
// import { useWebSocket } from "@/lib/utils/websocket";
import { photoApi } from "@/lib/api/photo";
import { toast } from "@/app/components/ui/toast";
import { auth } from "@/lib/utils/firebase";
import { eventApi } from "@/lib/api/event";

interface PhotoGalleryProps {
  user: any;
  eventId?: string | null;
  onViewChange?: (view: string) => void;
}

interface Photo {
  id: string;
  url: string;
  filename?: string;
  uploadedAt: string;
  uploader?: string;
  userId?: string;
  caption?: string;
  tags?: string[];
  eventTitle?: string;
  eventId?: string;
}

// Photo Gallery cache functions
const getPhotosCacheKey = (userId: string, eventId?: string) => {
  if (eventId?.startsWith("quick_")) {
    return `photos_quick_${eventId.replace("quick_", "")}`;
  }
  return eventId ? `photos_event_${eventId}` : `photos_user_${userId}`;
};

const getCachedPhotos = (userId: string, eventId?: string) => {
  const cacheKey = getPhotosCacheKey(userId, eventId);
  const cache = localStorage.getItem(cacheKey);
  if (!cache) return null;
  try {
    const { photos, timestamp } = JSON.parse(cache);
    // Cache expires after 5 minutes for better real-time updates
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return photos;
  } catch {
    return null;
  }
};

const setCachedPhotos = (userId: string, photos: Photo[], eventId?: string) => {
  const cacheKey = getPhotosCacheKey(userId, eventId);
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      photos,
      timestamp: Date.now(),
    })
  );
};

const clearCachedPhotos = (userId: string, eventId?: string) => {
  const cacheKey = getPhotosCacheKey(userId, eventId);
  localStorage.removeItem(cacheKey);
};

// Clear all photo caches for a user
const clearAllPhotoCaches = (userId: string) => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (
      key.startsWith(`photos_user_${userId}`) ||
      key.startsWith(`photos_event_`) ||
      key.startsWith(`photos_quick_`)
    ) {
      localStorage.removeItem(key);
    }
  });
};

export default function PhotoGallery({
  user,
  eventId,
  onViewChange,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [galleryVisibility, setGalleryVisibility] = useState<
    "public" | "private"
  >("public");
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<string>("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<
    string | null
  >(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  const prevFilteredLength = useRef(0);
  const touchStartX = useRef<number | null>(null);

  // Debug logging
  useEffect(() => {
    console.log("PhotoGallery - User state:", user);
    console.log("PhotoGallery - User ID:", user?.id);
    console.log("PhotoGallery - User isGuest:", user?.isGuest);
    console.log("PhotoGallery - Event ID:", eventId);
    console.log("PhotoGallery - auth.currentUser:", auth.currentUser);
  }, [user, eventId]);

  // const { connect, disconnect } = useWebSocket(eventId || null);

  // useEffect(() => {
  //   if (eventId) {
  //     connect();
  //   }

  //   return () => {
  //     disconnect();
  //   };
  // }, [eventId, connect, disconnect]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!user?.id && !eventId?.startsWith("quick_")) return;
      setLoading(true);
      setOffset(0);

      // Check cache first
      const cachedPhotos = getCachedPhotos(
        user?.id || "anonymous",
        eventId || undefined
      );
      if (cachedPhotos) {
        console.log("Using cached photos:", cachedPhotos.length);
        setPhotos(cachedPhotos);
        setLoading(false);
        return;
      }

      try {
        let data;
        if (eventId?.startsWith("quick_")) {
          const quickId = eventId.replace("quick_", "");
          data = await photoApi.getQuickSharePhotos(quickId, 50, 0);
          setPhotos(data.photos || []);
          setCachedPhotos("anonymous", data.photos || [], eventId);
          setHasMore(data.hasMore || false);
        } else if (eventId) {
          data = await photoApi.getEventPhotos(eventId, 50, "");
          setPhotos(data.photos || []);
          setCachedPhotos(user?.id || "anonymous", data.photos || [], eventId);
          setHasMore(data.hasMore || false);
        } else {
          try {
            const { events = [] } = await eventApi.getUserEvents();
            setUserEvents(events);

            let allPhotos: Photo[] = [];
            for (const event of events) {
              if (event.organizer === user.id) {
                try {
                  const res = await photoApi.getEventPhotos(event.id, 100, "");
                  if (res.photos) {
                    allPhotos = allPhotos.concat(
                      res.photos.map((photo: Photo) => ({
                        ...photo,
                        eventTitle: event.title,
                        eventId: event.id,
                      }))
                    );
                  }
                } catch (err) {
                  console.error(
                    `Failed to fetch photos for event ${event.id}:`,
                    err
                  );
                }
              }
            }
            allPhotos.sort(
              (a, b) =>
                new Date(b.uploadedAt).getTime() -
                new Date(a.uploadedAt).getTime()
            );
            setPhotos(allPhotos);
            setCachedPhotos(user.id, allPhotos);
            setHasMore(false);
          } catch (error) {
            console.error("Failed to fetch user events and photos:", error);
            setPhotos([]);
          }
        }
      } catch (error) {
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [user?.id, user?.isGuest, eventId]);

  const loadMorePhotos = async () => {
    if (loadingMore || !hasMore) return;

    console.log("PhotoGallery - Loading more photos, offset:", offset);
    setLoadingMore(true);
    const newOffset = offset + 50;

    try {
      let data;

      if (eventId?.startsWith("quick_")) {
        const quickId = eventId.replace("quick_", "");
        console.log(
          "PhotoGallery - Loading more quick share photos for quickId:",
          quickId,
          "offset:",
          newOffset
        );
        data = await photoApi.getQuickSharePhotos(quickId, 50, newOffset);
      } else if (eventId) {
        console.log(
          "PhotoGallery - Loading more photos for event:",
          eventId,
          "offset:",
          newOffset
        );
        data = await photoApi.getEventPhotos(eventId, 50, "");
      } else {
        if (!user?.isGuest && user?.id) {
          console.log(
            "PhotoGallery - Loading more user photos for user:",
            user.id,
            "offset:",
            newOffset
          );
          data = await photoApi.getUserPhotos(50, newOffset);
        } else {
          console.log(
            "PhotoGallery - User is guest or not authenticated, skipping load more"
          );
          setLoadingMore(false);
          return;
        }
      }

      console.log(
        "PhotoGallery - Loaded additional photos:",
        data.photos?.length || 0
      );
      const updatedPhotos = [...photos, ...(data.photos || [])];
      setPhotos(updatedPhotos);

      if (user?.id) {
        setCachedPhotos(user.id, updatedPhotos, eventId || undefined);
      } else if (eventId?.startsWith("quick_")) {
        setCachedPhotos("anonymous", updatedPhotos, eventId);
      }

      setHasMore(data.hasMore || false);
      setOffset(newOffset);
    } catch (error) {
      console.error("PhotoGallery - Failed to load more photos:", error);
      toast.error("Failed to load more photos");
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredPhotos =
    selectedEventId === "all"
      ? photos
      : photos.filter((photo) => photo.eventId === selectedEventId);

  const groupedPhotos =
    selectedEventId === "all"
      ? filteredPhotos.reduce((groups, photo) => {
          const key = photo.eventId || "Unknown Event";
          if (!groups[key]) {
            groups[key] = {
              eventTitle: photo.eventTitle || "Unknown Event",
              photos: [],
            };
          }
          groups[key].photos.push(photo);
          return groups;
        }, {} as Record<string, { eventTitle: string; photos: Photo[] }>)
      : null;

  useEffect(() => {
    if (
      fullscreenIndex !== null &&
      (fullscreenIndex >= filteredPhotos.length ||
        filteredPhotos.length !== prevFilteredLength.current)
    ) {
      setFullscreenIndex(null);
    }
    prevFilteredLength.current = filteredPhotos.length;
  }, [filteredPhotos.length, fullscreenIndex]);

  useEffect(() => {
    if (fullscreenIndex !== null) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft" && fullscreenIndex > 0) {
          setFullscreenIndex((i) => (i !== null && i > 0 ? i - 1 : i));
        } else if (
          e.key === "ArrowRight" &&
          fullscreenIndex < filteredPhotos.length - 1
        ) {
          setFullscreenIndex((i) =>
            i !== null && i < filteredPhotos.length - 1 ? i + 1 : i
          );
        } else if (e.key === "Escape") {
          setFullscreenIndex(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [fullscreenIndex, filteredPhotos.length]);

  const handleDownloadAll = () => {
    console.log("Downloading all photos...");
  };

  const handleShareGallery = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Event Photos",
          text: "Check out my photos from the event",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
  };

  const handleDownloadPhoto = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSharePhoto = async (url: string) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      setShareStatus("Photo link copied!");
      setTimeout(() => setShareStatus(""), 1500);
    } catch {
      setShareStatus("Failed to copy link");
      setTimeout(() => setShareStatus(""), 1500);
    }
  };

  const handleShareTo = (platform: "twitter" | "facebook", url: string) => {
    const shareUrl = encodeURIComponent(window.location.origin + url);
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${shareUrl}`, "_blank");
    } else if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
        "_blank"
      );
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || fullscreenIndex === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50 && fullscreenIndex > 0) {
      setFullscreenIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    } else if (deltaX < -50 && fullscreenIndex < filteredPhotos.length - 1) {
      setFullscreenIndex((i) =>
        i !== null && i < filteredPhotos.length - 1 ? i + 1 : i
      );
    }
    touchStartX.current = null;
  };

  const currentEvent = eventId && userEvents.find((e) => e.id === eventId);
  const isOwner = user && currentEvent && user.id === currentEvent.organizer;

  const handleDeletePhoto = async (photoId: string) => {
    if (!eventId) return;
    setDeletingPhotoId(photoId);
    try {
      await photoApi.deletePhoto(eventId, photoId);
      const updatedPhotos = photos.filter((p) => p.id !== photoId);
      setPhotos(updatedPhotos);

      // Update cache
      if (user?.id) {
        setCachedPhotos(user.id, updatedPhotos, eventId);
      } else if (eventId?.startsWith("quick_")) {
        setCachedPhotos("anonymous", updatedPhotos, eventId);
      }

      toast.success("Photo deleted successfully");
    } catch (error) {
      toast.error("Failed to delete photo");
    } finally {
      setDeletingPhotoId(null);
      setConfirmDeletePhotoId(null);
    }
  };

  // Handle logout - clear cache
  useEffect(() => {
    if (!user && previousUserId) {
      clearAllPhotoCaches(previousUserId);
      setPreviousUserId(null);
      setPhotos([]);
      setUserEvents([]);
    } else if (user?.id) {
      setPreviousUserId(user.id);
    }
  }, [user, previousUserId]);

  useEffect(() => {
    const loadUserEvents = async () => {
      if (!user?.id || user?.isGuest) return;

      try {
        const { events = [] } = await eventApi.getUserEvents();
        setUserEvents(events);
      } catch (error) {
        console.error("Failed to load user events:", error);
        setUserEvents([]);
      }
    };

    loadUserEvents();
  }, [user?.id, user?.isGuest]);

  if (!user?.id && !eventId?.startsWith("quick_")) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-lg font-medium mb-2">
            Please sign in to view your photos.
          </p>
          <p className="text-sm text-muted-foreground">
            {!user ? "No user data available" : "User ID not found"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (user?.isGuest && !eventId?.startsWith("quick_")) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-lg font-medium mb-2">
            Guest users cannot access photo galleries.
          </p>
          <p className="text-sm text-muted-foreground">
            Please sign up for a full account to view your photos.
          </p>
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
                {eventId?.startsWith("quick_")
                  ? "Quick Share Photos"
                  : eventId
                  ? "Event Photos"
                  : "My Photos"}
              </CardTitle>
              <CardDescription className="mt-1">
                {eventId?.startsWith("quick_")
                  ? "Photos shared via quick share"
                  : eventId
                  ? "Photos uploaded to this event"
                  : `Photos linked to your account: ${
                      user?.name || user?.email || "Unknown User"
                    }`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                onClick={handleDownloadAll}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
              <Button
                onClick={handleShareGallery}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
          {/* Event Filter Dropdown */}
          {userEvents.length > 0 && !eventId && (
            <div className="mt-4">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">All Events</option>
                {userEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search photos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Gallery Visibility UI (UI only) */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              size="sm"
              variant={galleryVisibility === "public" ? "default" : "outline"}
              onClick={() => setGalleryVisibility("public")}
              className="flex items-center gap-1"
            >
              <Globe className="w-4 h-4" /> Public
            </Button>
            <Button
              size="sm"
              variant={galleryVisibility === "private" ? "default" : "outline"}
              onClick={() => setGalleryVisibility("private")}
              className="flex items-center gap-1"
            >
              <Lock className="w-4 h-4" /> Private
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              (UI only)
            </span>
          </div>

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
          {!loading &&
            selectedEventId === "all" &&
            groupedPhotos &&
            Object.entries(groupedPhotos).map(([eventId, group]) => (
              <div key={eventId} className="mb-8">
                <h2 className="text-lg font-bold mb-2">{group.eventTitle}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.photos.map((photo, groupIdx) => {
                    const globalIdx = filteredPhotos.findIndex(
                      (p) => p.id === photo.id
                    );
                    return (
                      <div
                        key={photo.id}
                        className="group relative"
                        onClick={() => setFullscreenIndex(globalIdx)}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                          <img
                            src={photo.url || "/placeholder.svg"}
                            alt={photo.caption || "Photo"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="mt-2 space-y-1">
                          {photo.caption && (
                            <p className="text-xs font-medium text-foreground truncate">
                              {photo.caption}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {group.eventTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(photo.uploadedAt).toLocaleDateString()}
                          </p>
                          {photo.tags && photo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {photo.tags.slice(0, 2).map((tag, tagIdx) => (
                                <span
                                  key={tagIdx}
                                  className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {photo.tags.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{photo.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {isOwner && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeletePhotoId(photo.id);
                            }}
                            disabled={deletingPhotoId === photo.id}
                          >
                            {deletingPhotoId === photo.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          {!loading && selectedEventId !== "all" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="group relative"
                  onClick={() => setFullscreenIndex(idx)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                    <img
                      src={photo.url || "/placeholder.svg"}
                      alt={photo.caption || "Photo"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPhoto(
                            photo.url,
                            photo.caption || "photo"
                          );
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSharePhoto(photo.url);
                        }}
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {photo.caption && (
                      <p className="text-xs font-medium text-foreground truncate">
                        {photo.caption}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {photo.eventTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {photo.tags.slice(0, 2).map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {photo.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{photo.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeletePhotoId(photo.id);
                      }}
                      disabled={deletingPhotoId === photo.id}
                    >
                      {deletingPhotoId === photo.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={loadMorePhotos}
                disabled={loadingMore}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                {loadingMore ? "Loading..." : "Load More Photos"}
              </Button>
            </div>
          )}

          {/* Fullscreen Modal */}
          {fullscreenIndex !== null &&
            filteredPhotos[fullscreenIndex] &&
            (() => {
              const idx = fullscreenIndex as number;
              return (
                <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center bg-black bg-opacity-80">
                  <div className="relative w-screen h-screen flex flex-col items-center justify-center">
                    <button
                      className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-10"
                      onClick={() => setFullscreenIndex(null)}
                    >
                      <X className="w-6 h-6" />
                    </button>

                    {/* Fixed container for image and navigation */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Left navigation button */}
                      <button
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 rounded-full p-3 z-10 disabled:opacity-30"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenIndex((i) =>
                            i !== null && i > 0 ? i - 1 : i
                          );
                        }}
                        disabled={idx === 0}
                      >
                        <ChevronLeft className="w-8 h-8" />
                      </button>

                      {/* Image container with fixed dimensions */}
                      <div
                        className="flex items-center justify-center w-full h-full px-20"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                      >
                        <img
                          src={filteredPhotos[idx].url}
                          alt={filteredPhotos[idx].filename || "No Title"}
                          className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                        />
                      </div>

                      {/* Right navigation button */}
                      <button
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 rounded-full p-3 z-10 disabled:opacity-30"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenIndex((i) =>
                            i !== null && i < filteredPhotos.length - 1
                              ? i + 1
                              : i
                          );
                        }}
                        disabled={idx === filteredPhotos.length - 1}
                      >
                        <ChevronRight className="w-8 h-8" />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 mb-4 w-full max-w-xs sm:max-w-none sm:w-auto justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPhoto(
                            filteredPhotos[idx].url,
                            filteredPhotos[idx].filename || "No Title"
                          );
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSharePhoto(filteredPhotos[idx].url);
                        }}
                      >
                        <Share className="w-4 h-4 mr-1" /> Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareTo("twitter", filteredPhotos[idx].url);
                        }}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M22.46 5.924c-.793.352-1.646.59-2.54.698a4.48 4.48 0 001.963-2.475 8.94 8.94 0 01-2.828 1.082A4.48 4.48 0 0016.11 4c-2.482 0-4.495 2.013-4.495 4.495 0 .352.04.695.116 1.022C7.728 9.37 4.1 7.6 1.67 4.905c-.386.663-.607 1.434-.607 2.26 0 1.56.795 2.936 2.006 3.744a4.48 4.48 0 01-2.037-.563v.057c0 2.18 1.55 4.002 3.604 4.418-.377.103-.775.158-1.185.158-.29 0-.57-.028-.844-.08.57 1.78 2.22 3.078 4.18 3.113A8.98 8.98 0 012 19.54a12.68 12.68 0 006.88 2.017c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.14 9.14 0 0024 4.59a8.98 8.98 0 01-2.54.698z" />
                        </svg>
                        Twitter
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareTo("facebook", filteredPhotos[idx].url);
                        }}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.326 24H12.82v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.92.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" />
                        </svg>
                        Facebook
                      </Button>
                    </div>
                    {shareStatus && (
                      <div className="mt-2 text-green-400">{shareStatus}</div>
                    )}
                    <div className="mt-2 text-white text-xs">
                      {filteredPhotos[idx].filename || "No Title"}
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Empty State */}
          {!loading && filteredPhotos.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No photos found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No photos match your search criteria"
                  : eventId
                  ? "No photos have been uploaded to this event yet"
                  : "No photos have been uploaded to your account yet"}
              </p>
              {!searchTerm && !eventId && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="default"
                    onClick={() => onViewChange?.("create-event")}
                  >
                    Create Your First Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onViewChange?.("qr-generator")}
                  >
                    Quick Share Photos
                  </Button>
                </div>
              )}
              {!searchTerm && eventId && (
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              )}
            </div>
          )}

          {/* Stats */}
          {!loading && photos.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total photos: {photos.length}</span>
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {confirmDeletePhotoId && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                <div className="mb-4 font-semibold">
                  Are you sure you want to delete this photo?
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDeletePhotoId(null)}
                    disabled={deletingPhotoId === confirmDeletePhotoId}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeletePhoto(confirmDeletePhotoId)}
                    disabled={deletingPhotoId === confirmDeletePhotoId}
                  >
                    {deletingPhotoId === confirmDeletePhotoId
                      ? "Deleting..."
                      : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
