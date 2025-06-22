import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Share - BarqPix",
  description: "Quick share your photos",
};

export default function QuickLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-purple-50 min-h-screen">{children}</div>;
}
