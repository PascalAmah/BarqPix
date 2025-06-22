import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Photos - BarqPix",
  description: "Upload photos to your event",
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-purple-50 min-h-screen">{children}</div>;
}
