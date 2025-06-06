"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { ImageIcon, Download, Share, Search } from "lucide-react";

interface PhotoGalleryProps {
  userId: string | null;
}

interface Photo {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
  uploader: string;
}

export default function PhotoGallery({ userId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userId) {
      // Simulate loading photos
      setTimeout(() => {
        const mockPhotos: Photo[] = [
          {
            id: "1",
            url: "/placeholder.svg?height=300&width=300",
            filename: "event_photo_1.jpg",
            uploadedAt: "2024-01-15T10:30:00Z",
            uploader: "photographer_1",
          },
          {
            id: "2",
            url: "/placeholder.svg?height=300&width=300",
            filename: "event_photo_2.jpg",
            uploadedAt: "2024-01-15T11:15:00Z",
            uploader: "photographer_2",
          },
          {
            id: "3",
            url: "/placeholder.svg?height=300&width=300",
            filename: "event_photo_3.jpg",
            uploadedAt: "2024-01-15T12:00:00Z",
            uploader: "self",
          },
          {
            id: "4",
            url: "/placeholder.svg?height=300&width=300",
            filename: "event_photo_4.jpg",
            uploadedAt: "2024-01-15T12:45:00Z",
            uploader: "photographer_3",
          },
        ];
        setPhotos(mockPhotos);
        setLoading(false);
      }, 1000);
    }
  }, [userId]);

  const filteredPhotos = photos.filter((photo) =>
    photo.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadAll = () => {
    // In production, this would create a zip file or download individual photos
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

  if (!userId) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <p>Please sign in to view your photos.</p>
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
                My Photos
              </CardTitle>
              <CardDescription className="mt-1">
                Photos linked to your account: {userId}
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
          {!loading && filteredPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo.url || "/placeholder.svg"}
                      alt={photo.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button size="sm" variant="secondary">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {photo.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPhotos.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No photos found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No photos match your search criteria"
                  : "No photos have been uploaded to your account yet"}
              </p>
              {!searchTerm && (
                <Button variant="outline">Upload Your First Photo</Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
