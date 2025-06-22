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

interface EventListProps {
  user: any;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onViewChange: (view: string) => void;
  refreshEvents?: number;
}

const EventList: React.FC<EventListProps> = ({
  user,
  onEdit,
  onDelete,
  onViewChange,
  refreshEvents,
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { events } = await eventApi.getUserEvents();
        setEvents(events);
      } catch (error) {
        toast.error("Failed to fetch events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEvents();
    }
  }, [user, refreshEvents]);

  const handleDelete = async (eventId: string) => {
    setIsDeleting(true);
    try {
      await onDelete(eventId);
      setConfirmDeleteId(null);
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>
                Manage your created events below.
              </CardDescription>
            </div>
            <Button
              onClick={() => onViewChange("create-event")}
              className="flex items-center gap-2"
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
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  {event.coverImage && (
                    <div className="relative w-20 h-20">
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
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{event.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.startDate).toLocaleString()} -{" "}
                      {new Date(event.endDate).toLocaleString()}
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="text-xs mt-1 flex items-center gap-2">
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
                  <div className="flex gap-2">
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
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
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
