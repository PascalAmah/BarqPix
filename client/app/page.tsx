"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, QrCode, Users, ImageIcon, CalendarPlus } from "lucide-react";
import type { User } from "./types";
import UserRegistration from "./components/UserRegistration";
import QRCodeGenerator from "./components/QRCodeGenerator";
import BarcodeScanner from "./components/BarcodeScanner";
import PhotoUpload from "./components/PhotoUpload";
import PhotoGallery from "./components/PhotoGallery";
import Navigation from "./components/Navigation";
import CreateEvent from "./components/CreateEvent";
import InteractiveBackground from "./components/InteractiveBackground";

export default function BarqPixApp() {
  const [currentView, setCurrentView] = useState<string>("home");
  const [user, setUser] = useState<User | null>(null);
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);

  // Redirect to registration if guest user tries to access restricted features
  const handleNavigate = (view: string) => {
    if (!user || user.isGuest) {
      switch (view) {
        case "create-event":
        case "gallery":
          setCurrentView("register");
          return;
        default:
          setCurrentView(view);
      }
    } else {
      setCurrentView(view);
    }
  };

  // Add scroll to top effect when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  const renderCurrentView = () => {
    switch (currentView) {
      case "register":
        return (
          <UserRegistration
            onUserCreated={setUser}
            onViewChange={setCurrentView}
          />
        );
      case "qr-generator":
        return <QRCodeGenerator user={user} onViewChange={setCurrentView} />;
      case "scanner":
        return (
          <BarcodeScanner
            onScanComplete={setScannedUserId}
            onViewChange={setCurrentView}
          />
        );
      case "upload":
        // Only show PhotoUpload if we have a scanned user ID or a logged-in user
        if (!scannedUserId && (!user || user.isGuest)) {
          setCurrentView("scanner");
          return null;
        }
        return (
          <PhotoUpload
            userId={(scannedUserId || user?.id) ?? null}
            onViewChange={setCurrentView}
          />
        );
      case "gallery":
        return <PhotoGallery userId={user?.id ?? null} />;
      case "create-event":
        return <CreateEvent user={user} onViewChange={setCurrentView} />;
      default:
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img
                  src="/logo.jpg"
                  alt="BarqPix"
                  className="h-16 object-contain mb-4"
                />
              </div>
              <p className="text-xl text-foreground max-w-2xl mx-auto">
                Capture, organize, and share event photos seamlessly with
                personalized QR codes
              </p>
            </div>

            {/* Quick Actions */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back, {user.name}!</CardTitle>
                  <CardDescription>
                    {user.isGuest
                      ? "Sign up to unlock all features"
                      : "Quick actions for your account"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  {!user.isGuest ? (
                    <>
                      <Button
                        onClick={() => handleNavigate("create-event")}
                        variant="outline"
                      >
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                      <Button
                        onClick={() => handleNavigate("qr-generator")}
                        variant="outline"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        My QR Code
                      </Button>
                      <Button
                        onClick={() => handleNavigate("gallery")}
                        variant="outline"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        My Photos
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleNavigate("register")}
                        variant="default"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Sign Up Now
                      </Button>
                      <Button
                        onClick={() => handleNavigate("qr-generator")}
                        variant="outline"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Generate QR Code
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {user && !user.isGuest ? (
                <Card
                  className="cursor-pointer group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(119,84,246,0.15)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-purple-100/50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                  onClick={() => handleNavigate("create-event")}
                >
                  <CardHeader className="text-center relative">
                    <CalendarPlus className="w-12 h-12 mx-auto text-purple-600 transition-transform duration-300 group-hover:scale-110" />
                    <CardTitle>Create Event</CardTitle>
                    <CardDescription>
                      Set up a new event with QR code
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <Card
                  className="cursor-pointer group relative transition-all duration-300 hover:-translate-y-1 border-dashed border-2 border-purple-200 hover:border-purple-300 hover:shadow-[0_0_30px_rgba(119,84,246,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-purple-50/50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                  onClick={() => setCurrentView("register")}
                >
                  <CardHeader className="text-center relative">
                    <div className="relative">
                      <CalendarPlus className="w-12 h-12 mx-auto text-purple-600/40 transition-all duration-300 group-hover:text-purple-600/60" />
                    </div>
                    <CardTitle className="mt-2">
                      Sign Up to Create Events
                    </CardTitle>
                    <CardDescription>
                      Create an account to organize events
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              <Card
                className="cursor-pointer group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-green-100/50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                onClick={() => handleNavigate("qr-generator")}
              >
                <CardHeader className="text-center relative">
                  <QrCode className="w-12 h-12 mx-auto text-green-600 transition-transform duration-300 group-hover:scale-110" />
                  <CardTitle>Generate QR</CardTitle>
                  <CardDescription>
                    {user?.isGuest
                      ? "Try it out - Photos last 24 hours"
                      : "Create a quick QR code for sharing"}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(119,84,246,0.15)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-purple-100/50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                onClick={() => handleNavigate("scanner")}
              >
                <CardHeader className="text-center relative">
                  <Camera className="w-12 h-12 mx-auto text-purple-600 transition-transform duration-300 group-hover:scale-110" />
                  <CardTitle>Scan & Capture</CardTitle>
                  <CardDescription>
                    {user
                      ? "Scan QR and save photos"
                      : "Scan QR and take photos"}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-orange-100/50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                onClick={() => handleNavigate("gallery")}
              >
                <CardHeader className="text-center relative">
                  <ImageIcon className="w-12 h-12 mx-auto text-orange-600 transition-transform duration-300 group-hover:scale-110" />
                  <CardTitle>Photo Gallery</CardTitle>
                  <CardDescription>
                    {user
                      ? "Access your saved photos"
                      : "Sign up to save photos"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <InteractiveBackground />
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogout={() => setUser(null)}
      />
      <main className="container mx-auto px-4 py-8 mt-12">
        {renderCurrentView()}
      </main>
    </div>
  );
}
