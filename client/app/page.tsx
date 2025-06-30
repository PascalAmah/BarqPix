"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
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
import QRCodeScanner from "./components/QRCodeScanner";
import PhotoUpload from "./components/PhotoUpload";
import PhotoGallery from "./components/PhotoGallery";
import Navigation from "./components/Navigation";
import CreateEvent from "./components/CreateEvent";
import InteractiveBackground from "./components/InteractiveBackground";
import SignIn from "./components/SignIn";
import { toast } from "./components/ui/toast";
import EventList from "./components/EventList";
import { eventApi } from "@/lib/api/event";
// import QuickShareViewer from "./components/QuickShareViewer";
import { authApi } from "@/lib/api/auth";

export default function BarqPixApp() {
  const [currentView, setCurrentView] = useState<string>("home");
  const [user, setUser] = useState<User | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [editEvent, setEditEvent] = useState<EventType | null>(null);
  const [refreshEvents, setRefreshEvents] = useState(0);
  const [previousView, setPreviousView] = useState("home");

  const handleNavigate = (view: string) => {
    if (!user || user.isGuest) {
      switch (view) {
        case "create-event":
        case "gallery":
          setCurrentView("register");
          return;
        default:
          setPreviousView(currentView);
          setCurrentView(view);
      }
    } else {
      setPreviousView(currentView);
      setCurrentView(view);
    }
  };

  const navigateToCreateEvent = () => {
    setPreviousView(currentView);
    setCurrentView("create-event");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedView = localStorage.getItem("barqpix_current_view");
      if (storedView) {
        setCurrentView(storedView);
      } else {
        setCurrentView("home");
        localStorage.setItem("barqpix_current_view", "home");
      }
    }
  }, []);

  // Firebase Auth State Listener for Persistence & Guest Mode Persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          try {
            await authApi.getCurrentUser(token);
          } catch (error) {
            console.log("User not found in database, attempting to create...");
            try {
              await authApi.createUser(firebaseUser);
            } catch (createError) {
              console.error("Failed to create user in database:", createError);
              await signOut(auth);
              localStorage.removeItem("barqpix_user");
              setUser(null);
              toast.error("Failed to create user account. Please try again.");
              setLoadingUser(false);
              return;
            }
          }

          const storedUser = localStorage.getItem("barqpix_user");
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              if (userData.id === firebaseUser.uid) {
                const appUser: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  name:
                    firebaseUser.displayName ||
                    firebaseUser.email?.split("@")[0] ||
                    "",
                  isGuest: false,
                  createdAt:
                    firebaseUser.metadata.creationTime ||
                    new Date().toISOString(),
                };
                setUser(appUser);
                localStorage.removeItem("barqpix_guest_user");
              } else {
                const appUser: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  name:
                    firebaseUser.displayName ||
                    firebaseUser.email?.split("@")[0] ||
                    "",
                  isGuest: false,
                  createdAt:
                    firebaseUser.metadata.creationTime ||
                    new Date().toISOString(),
                };
                setUser(appUser);
                localStorage.setItem("barqpix_user", JSON.stringify(appUser));
                localStorage.removeItem("barqpix_guest_user");
              }
            } catch (e) {
              console.error("Failed to parse stored user data", e);
              const appUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                name:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split("@")[0] ||
                  "",
                isGuest: false,
                createdAt:
                  firebaseUser.metadata.creationTime ||
                  new Date().toISOString(),
              };
              setUser(appUser);
              localStorage.setItem("barqpix_user", JSON.stringify(appUser));
              localStorage.removeItem("barqpix_guest_user");
            }
          } else {
            const appUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "",
              isGuest: false,
              createdAt:
                firebaseUser.metadata.creationTime || new Date().toISOString(),
            };
            setUser(appUser);
            localStorage.setItem("barqpix_user", JSON.stringify(appUser));
            localStorage.removeItem("barqpix_guest_user");
          }
        } catch (error) {
          console.error("Error in auth state listener:", error);
          await signOut(auth);
          localStorage.removeItem("barqpix_user");
          setUser(null);
          toast.error("Authentication error. Please try again.");
        }
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

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    localStorage.setItem("barqpix_current_view", currentView);
  }, [currentView]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (currentEventId) {
        try {
          const data = await eventApi.getPublicEvent(currentEventId);
          setEventDetails(data.event);
        } catch (error) {
          console.error("Failed to fetch event details:", error);
          setEventDetails(null);
        }
      } else {
        setEventDetails(null);
      }
    };

    fetchEventDetails();
  }, [currentEventId]);

  const handleEditEvent = (event: EventType) => {
    setEditEvent(event);
    setPreviousView(currentView);
    setCurrentView("create-event");
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete events");
      return;
    }
    try {
      await eventApi.deleteEvent(eventId);
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
        return (
          <QRCodeGenerator
            user={user}
            onViewChange={setCurrentView}
            onCreateEvent={navigateToCreateEvent}
          />
        );
      case "scanner":
        return (
          <QRCodeScanner
            onScanComplete={(scannedData) => {
              setScannedUrl(scannedData);
              try {
                const url = new URL(scannedData);
                if (url.pathname.startsWith("/quick/")) {
                  const quickId = url.pathname.split("/")[2];
                  setCurrentEventId(`quick_${quickId}`);
                  if (!user || user.isGuest) {
                    setCurrentView("quick-share");
                  } else {
                    setCurrentView("upload");
                  }
                } else if (url.pathname.startsWith("/upload/")) {
                  const eventId = url.pathname.split("/")[2];
                  setCurrentEventId(eventId);
                  setCurrentView("upload");
                }
              } catch (error) {
                console.error("Failed to parse scanned URL:", error);
              }
            }}
            onViewChange={setCurrentView}
          />
        );
      case "upload":
        if (!user && !scannedUrl) {
          setCurrentView("scanner");
          return null;
        }
        return (
          <PhotoUpload
            userId={user?.id ?? null}
            user={user}
            eventId={currentEventId}
            eventDetails={eventDetails}
            onViewChange={setCurrentView}
          />
        );
      case "gallery":
        return (
          <PhotoGallery
            user={user}
            eventId={currentEventId}
            onViewChange={setCurrentView}
          />
        );
      // case "quick-share":
      //   return (
      //     <QuickShareViewer
      //       quickId={currentEventId?.replace("quick_", "") || ""}
      //       onViewChange={setCurrentView}
      //     />
      //   );
      case "create-event":
        return (
          <CreateEvent
            user={user}
            onViewChange={handleViewChange}
            eventToEdit={editEvent}
            previousView={previousView}
          />
        );
      case "event-list":
        return (
          <EventList
            user={user}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onViewChange={handleViewChange}
            onCreateEvent={navigateToCreateEvent}
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
                      <Button onClick={navigateToCreateEvent} variant="outline">
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
                  onClick={navigateToCreateEvent}
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
                await signOut(auth);
                localStorage.removeItem("barqpix_guest_user");
                localStorage.removeItem("barqpix_user");
                localStorage.removeItem("barqpix_current_view");
                setUser(null);
                setCurrentView("home");
                setScannedUrl(null);
                setCurrentEventId(null);
                setEventDetails(null);
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
    </>
  );
}
