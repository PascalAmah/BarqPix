"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PhotoUpload from "../../components/PhotoUpload";
import { toast } from "../../components/ui/toast";
import { eventApi } from "@/lib/api/event";
import { qrApi } from "@/lib/api/qr";

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eventEnded, setEventEnded] = useState(false);
  const [quickshareTitle, setQuickshareTitle] = useState<string | null>(null);
  const eventId = params.eventId as string;

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        if (eventId.startsWith("quick_")) {
          // Fetch quickshare QR code details to get the title
          const quickId = eventId.replace("quick_", "");
          const res = await qrApi.trackQRScan(
            quickId,
            "anonymous",
            "Anonymous"
          );
          if (res.qrCode && res.qrCode.title) {
            setQuickshareTitle(res.qrCode.title);
          }
        }
        // Try to fetch as event as well (for non-quickshare)
        const data = await eventApi.getPublicEvent(eventId);
        setEventDetails(data.event);
        // Check if event has ended
        if (data.event.endDate && new Date(data.event.endDate) < new Date()) {
          setEventEnded(true);
        }
      } catch (error: any) {
        console.error("Failed to fetch event details:", error);
        // Check if it's a 410 error (event ended)
        if (
          error.status === 410 ||
          error.message?.includes("Event has ended")
        ) {
          setEventEnded(true);
          // Try to get event details from error response if available
          if (error.eventTitle && error.endDate) {
            setEventDetails({
              title: error.eventTitle,
              endDate: error.endDate,
            });
          }
        } else {
          // Only show toast and navigate for other errors
          toast.error(
            "Failed to load event. It might not exist or has expired."
          );
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (eventEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Event Has Ended
          </h1>
          <p className="text-gray-600 mb-4">
            This event ended on{" "}
            {new Date(eventDetails?.endDate).toLocaleString()}. Photo uploads
            are no longer allowed for this event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PhotoUpload
        userId={null}
        eventId={eventId}
        eventDetails={eventDetails}
        quickshareTitle={quickshareTitle}
        onViewChange={(view) => {
          if (view === "home") {
            router.push("/");
          }
        }}
        onEventEnded={() => {
          setEventEnded(true);
        }}
      />
    </div>
  );
}
