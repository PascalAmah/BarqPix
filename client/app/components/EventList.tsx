import React, { useEffect, useState } from "react";
import { Event } from "@/app/types";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { eventApi } from "@/lib/api/event";
import { toast } from "sonner";
import { Calendar, MapPin, Globe, Lock, Plus } from "lucide-react";
import { useSwipeable } from "react-swipeable";

interface EventListProps {
  user: any;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onViewChange: (view: string) => void;
  onCreateEvent: () => void;
  refreshEvents?: number;
}

function SwipeableEventItem({
  event,
  isSwiped,
  isMobile,
  setSwipedId,
  setConfirmDeleteId,
  onEdit,
  children,
}: {
  event: any;
  isSwiped: boolean;
  isMobile: boolean;
  setSwipedId: (id: string | null) => void;
  setConfirmDeleteId: (id: string) => void;
  onEdit: (event: any) => void;
  children?: React.ReactNode;
}) {
  const handlers = useSwipeable({
    onSwipedLeft: () => isMobile && setSwipedId(event.id),
    onSwipedRight: () => isMobile && setSwipedId(null),
    preventScrollOnSwipe: true,
    trackMouse: false,
  });
  return (
    <div
      {...(isMobile ? handlers : {})}
      className={`relative flex flex-wrap md:flex-nowrap items-center gap-4 border rounded-lg p-4 transition-colors bg-white overflow-hidden ${
        isMobile && isSwiped ? "translate-x-[-80px]" : ""
      }`}
      style={{
        touchAction: "pan-y",
        transition: "transform 0.2s",
        transform: isMobile && isSwiped ? "translateX(-80px)" : "translateX(0)",
      }}
    >
      {children}
      {isMobile && isSwiped && (
        <button
          className="absolute right-0 top-0 h-full w-20 bg-red-600 text-white flex items-center justify-center z-10"
          onClick={() => setConfirmDeleteId(event.id)}
        >
          Delete
        </button>
      )}
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

const EventList: React.FC<EventListProps> = ({
  user,
  onEdit,
  onDelete,
  onViewChange,
  onCreateEvent,
  refreshEvents,
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user && previousUserId) {
      clearCachedEvents(previousUserId);
      setPreviousUserId(null);
      setEvents([]);
    } else if (user?.id) {
      setPreviousUserId(user.id);
    }
  }, [user, previousUserId]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const cached = getCachedEvents(user.id);
    if (cached) {
      setEvents(cached);
      setLoading(false);
      return;
    }
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { events } = await eventApi.getUserEvents();
        setEvents(events);
        setCachedEvents(user.id, events);
      } catch (error) {
        toast.error("Failed to fetch events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user, refreshEvents]);

  const handleDelete = async (eventId: string) => {
    setIsDeleting(true);
    try {
      await eventApi.deleteEvent(eventId);
      setConfirmDeleteId(null);
      setEvents((prev) => {
        const updated = prev.filter((e) => e.id !== eventId);
        if (user?.id) setCachedEvents(user.id, updated);
        return updated;
      });
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <p>Please sign in to view your events.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>
                Manage your created events below.
              </CardDescription>
            </div>
            <Button
              onClick={onCreateEvent}
              className="flex items-center gap-2 w-full md:w-auto md:ml-4 mt-2 md:mt-0"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No events found. Create your first event to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const isMobile =
                  typeof window !== "undefined" && window.innerWidth < 768;
                const isSwiped = swipedId === event.id;
                return (
                  <SwipeableEventItem
                    key={event.id}
                    event={event}
                    isSwiped={isSwiped}
                    isMobile={isMobile}
                    setSwipedId={setSwipedId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    onEdit={onEdit}
                  >
                    {event.coverImage && (
                      <div className="relative w-20 h-20 min-w-[5rem]">
                        <img
                          src={event.coverImage}
                          alt={event.title}
                          className="w-full h-full object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg truncate">
                        {event.title}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                        <Calendar className="w-4 h-4" />
                        <span className="truncate">
                          {new Date(event.startDate).toLocaleString()} -{" "}
                          {new Date(event.endDate).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm flex items-center gap-2 flex-wrap">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-2 flex-wrap">
                        {event.galleryVisibility === "public" ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {event.galleryVisibility === "public"
                            ? "Public Gallery"
                            : "Private Gallery"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-auto mt-4 md:mt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(event)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmDeleteId(event.id)}
                        className="hidden md:block"
                      >
                        Delete
                      </Button>
                    </div>
                  </SwipeableEventItem>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <div className="mb-4 font-semibold">
              Are you sure you want to delete this event?
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
                onClick={() => handleDelete(confirmDeleteId)}
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
};

export default EventList;
