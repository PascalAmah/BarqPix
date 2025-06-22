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
  const eventId = params.eventId as string;

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        await qrApi.trackQRScan(eventId, "anonymous", "Anonymous");

        const data = await eventApi.getPublicEvent(eventId);
        setEventDetails(data.event);
      } catch (error) {
        console.error("Failed to fetch event details:", error);
        toast.error("Failed to load event. It might not exist or has expired.");
        router.push("/");
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

  return (
    <div className="container mx-auto px-4 py-8">
      <PhotoUpload
        userId={null}
        eventId={eventId}
        eventDetails={eventDetails}
        onViewChange={(view) => {
          if (view === "home") {
            router.push("/");
          }
        }}
      />
    </div>
  );
}
