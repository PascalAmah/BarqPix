"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PhotoUpload from "../../components/PhotoUpload";
import { toast } from "../../components/ui/toast";
import { qrApi } from "@/lib/api/qr";
import { Button } from "../../components/ui/button";
import { ImageIcon } from "lucide-react";

export default function QuickSharePage() {
  const params = useParams();
  const router = useRouter();
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showViewer, setShowViewer] = useState(false);
  const quickId = params.quickId as string;

  useEffect(() => {
    const handleQuickShare = async () => {
      try {
        const response = await qrApi.trackQRScan(
          quickId,
          "anonymous",
          "Anonymous"
        );
        const qrCodeDetails = response.qrCode;

        if (!qrCodeDetails) {
          throw new Error("Invalid Quick Share link.");
        }

        setEventDetails({
          title: qrCodeDetails?.title || "Quick Share",
          startDate: qrCodeDetails?.createdAt,
          endDate: qrCodeDetails?.expiresAt,
        });
      } catch (error) {
        console.error("Failed to load Quick Share details:", error);
        toast.error("This Quick Share link is invalid or has expired.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (quickId) {
      handleQuickShare();
    }
  }, [quickId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quick share...</p>
        </div>
      </div>
    );
  }

  if (showViewer) {
    // Import and render QuickShareViewer dynamically to avoid circular imports
    const QuickShareViewer =
      require("../../components/QuickShareViewer").default;
    return (
      <div className="container mx-auto px-4 py-8">
        <QuickShareViewer
          quickId={quickId}
          onViewChange={(view: string) => {
            if (view === "upload") {
              setShowViewer(false);
            } else if (view === "home") {
              router.push("/");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PhotoUpload
        userId={null}
        eventId={`quick_${quickId}`}
        eventDetails={eventDetails}
        onViewChange={(view: string) => {
          if (view === "home") {
            router.push("/");
          } else if (view === "quick-share") {
            setShowViewer(true);
          }
        }}
      />
    </div>
  );
}
