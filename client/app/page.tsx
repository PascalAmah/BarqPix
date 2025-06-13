"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/utils/firebase";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Camera, QrCode, Users, ImageIcon, CalendarPlus } from "lucide-react";
import type { User, Event as EventType } from "./types";
import UserRegistration from "./components/UserRegistration";
import QRCodeGenerator from "./components/QRCodeGenerator";
import BarcodeScanner from "./components/BarcodeScanner";
import PhotoUpload from "./components/PhotoUpload";
import PhotoGallery from "./components/PhotoGallery";
import Navigation from "./components/Navigation";
import CreateEvent from "./components/CreateEvent";
import InteractiveBackground from "./components/InteractiveBackground";
import SignIn from "./components/SignIn";
import { Toaster, toast } from "sonner";
import EventList from "./components/EventList";

export default function BarqPixApp() {
  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("barqpix_current_view") || "home";
    }
    return "home";
  });
  const [user, setUser] = useState<User | null>(null);
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [editEvent, setEditEvent] = useState<EventType | null>(null);
  const [refreshEvents, setRefreshEvents] = useState(0);

  // Firebase Auth State Listener for Persistence & Guest Mode Persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name:
            firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
          isGuest: false,
          createdAt:
            firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        setUser(appUser);
        localStorage.removeItem("barqpix_guest_user");
      } else {
        const storedGuestUser = localStorage.getItem("barqpix_guest_user");
        if (storedGuestUser) {
          try {
            const guestUser: User = JSON.parse(storedGuestUser);
            setUser(guestUser);
          } catch (e) {
            console.error("Failed to parse stored guest user data", e);
            localStorage.removeItem("barqpix_guest_user");
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoadingUser(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

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

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    localStorage.setItem("barqpix_current_view", currentView);
  }, [currentView]);

  const handleEditEvent = (event: EventType) => {
    setEditEvent(event);
    setCurrentView("create-event");
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to delete event");
      toast.success("Event deleted successfully");
      setRefreshEvents((c) => c + 1);
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view !== "create-event") setEditEvent(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "register":
        return (
          <UserRegistration
            onUserCreated={setUser}
            onViewChange={setCurrentView}
          />
        );
      case "signin":
        return (
          <SignIn
            onUserSignedIn={setUser}
            onViewChange={setCurrentView}
            onBackToRegister={() => setCurrentView("register")}
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
        return (
          <CreateEvent
            user={user}
            onViewChange={handleViewChange}
            eventToEdit={editEvent}
          />
        );
      case "event-list":
        return (
          <EventList
            user={user}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            refreshEvents={refreshEvents}
          />
        );
      default:
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img
                  src="/barqpix_logo1.webp"
                  alt="BarqPix"
                  className="h-16 object-contain mb-4"
                />
              </div>
              <p className="text-lg text-foreground max-w-2xl mx-auto">
                Capture, organize, and share event photos seamlessly with
                personalized QR codes, AI-powered organization makes finding the
                perfect shots effortless.
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
                      <Button
                        onClick={() => handleNavigate("event-list")}
                        variant="outline"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        My Events
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
                  className="cursor-pointer group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(119,84,246,0.15)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-purple-100/50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                  onClick={() => setCurrentView("register")}
                >
                  <CardHeader className="text-center relative">
                    <div className="relative">
                      <CalendarPlus className="w-12 h-12 mx-auto text-purple-600 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <CardTitle className="mt-2">Create Events</CardTitle>
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
                  <Camera className="w-12 h-12 mx-auto text-yellow-600 transition-transform duration-300 group-hover:scale-110" />
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
    <>
      <div className="min-h-screen flex flex-col relative">
        {loadingUser ? (
          <div className="flex flex-col bg-secondary items-center justify-center min-h-screen">
            <img
              src="/barqpix_logo1.webp"
              alt="BarqPix"
              className="animate-pulse h-16"
              style={{ filter: "drop-shadow(0 0 8px #7754F6)" }}
            />
          </div>
        ) : (
          <>
            <InteractiveBackground />
            <Navigation
              currentView={currentView}
              onViewChange={setCurrentView}
              user={user}
              onLogout={async () => {
                await auth.signOut();
                localStorage.removeItem("barqpix_guest_user");
                setUser(null);
              }}
            />
            <main className="container mx-auto px-4 py-8 mt-12">
              {renderCurrentView()}
            </main>
            <footer className="mt-auto border-t border-[#7754F6]/10 py-4">
              <div className="container mx-auto px-4">
                <p className="text-center text-sm text-gray-600">
                  © {new Date().getFullYear()} BarqPix. All rights reserved.
                </p>
              </div>
            </footer>
          </>
        )}
      </div>
      <Toaster />
    </>
  );
}
