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
import { Search, QrCode, Users, ImageIcon, CalendarPlus } from "lucide-react";
import type { User, Event as EventType } from "@/app/types";
import UserRegistration from "./components/UserRegistration";
import QRCodeGenerator from "./components/QRCodeGenerator";
import EventAccess from "./components/EventAccess";
import PhotoUpload from "./components/PhotoUpload";
import PhotoGallery from "./components/PhotoGallery";
import Navigation from "./components/Navigation";
import CreateEvent from "./components/CreateEvent";
import InteractiveBackground from "./components/InteractiveBackground";
import QuickShareViewer from "./components/QuickShareViewer";
import SignIn from "./components/SignIn";
import EventList from "./components/EventList";
import { toast } from "./components/ui/toast";
import { eventApi } from "@/lib/api/event";
import { authApi } from "@/lib/api/auth";

// Cache clearing functions
const clearAllCaches = (userId: string) => {
  localStorage.removeItem(`events_${userId}`);

  localStorage.removeItem(`qr_codes_${userId}`);

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (
      key.startsWith(`photos_user_${userId}`) ||
      key.startsWith(`photos_event_`) ||
      key.startsWith(`photos_quick_`)
    ) {
      localStorage.removeItem(key);
    }
  });
};

// Helper to create appUser from firebaseUser
function makeAppUser(firebaseUser: any): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
    isGuest: false,
    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
  };
}

// Helper to create guest user
function makeGuestUser(): User {
  return {
    id: "guest",
    name: "Guest",
    email: "",
    isGuest: true,
    createdAt: new Date().toISOString(),
  };
}

export default function BarqPixApp() {
  const [currentView, setCurrentView] = useState<string>("home");
  const [user, setUser] = useState<User | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [quickshareTitle, setQuickshareTitle] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [editEvent, setEditEvent] = useState<EventType | null>(null);
  const [refreshEvents, setRefreshEvents] = useState(0);
  const [previousView, setPreviousView] = useState("home");

  // Helper to restore quickshare state
  function restoreQuickshareState() {
    const savedQuickId = localStorage.getItem("current_quick_id");
    const savedView = localStorage.getItem("barqpix_current_view");
    if (savedQuickId && savedView === "quick-share") {
      setCurrentEventId(`quick_${savedQuickId}`);
      setCurrentView("quick-share");
    }
  }

  const handleNavigate = (view: string) => {
    if (!user || user.isGuest) {
      switch (view) {
        case "create-event":
        case "gallery":
          setCurrentView("register");
          return;
        default:
          setPreviousView(currentView);
          handleViewChange(view);
      }
    } else {
      setPreviousView(currentView);
      handleViewChange(view);
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
                const appUser = makeAppUser(firebaseUser);
                setUser(appUser);
                localStorage.removeItem("barqpix_guest_user");
              } else {
                const appUser = makeAppUser(firebaseUser);
                setUser(appUser);
                localStorage.setItem("barqpix_user", JSON.stringify(appUser));
                localStorage.removeItem("barqpix_guest_user");
              }
            } catch (e) {
              console.error("Failed to parse stored user data", e);
              const appUser = makeAppUser(firebaseUser);
              setUser(appUser);
              localStorage.setItem("barqpix_user", JSON.stringify(appUser));
              localStorage.removeItem("barqpix_guest_user");
            }
          } else {
            const appUser = makeAppUser(firebaseUser);
            setUser(appUser);
            localStorage.setItem("barqpix_user", JSON.stringify(appUser));
            localStorage.removeItem("barqpix_guest_user");
          }

          restoreQuickshareState();
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

            restoreQuickshareState();
          } catch (e) {
            console.error("Failed to parse stored guest user data", e);
            localStorage.removeItem("barqpix_guest_user");
            setUser(null);
          }
        } else {
          const guestQRCode = localStorage.getItem("guest_qr_code");
          if (guestQRCode) {
            try {
              const qrData = JSON.parse(guestQRCode);
              const guestUser = makeGuestUser();
              setUser(guestUser);
              localStorage.setItem(
                "barqpix_guest_user",
                JSON.stringify(guestUser)
              );

              restoreQuickshareState();
            } catch (error) {
              console.error("Error parsing guest QR code:", error);
              localStorage.removeItem("guest_qr_code");
              setUser(null);
            }
          } else {
            setUser(null);
          }
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

  // Restore quickshare state after user loading is complete
  useEffect(() => {
    if (!loadingUser && user) {
      restoreQuickshareState();
    }
  }, [loadingUser, user]);

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

  useEffect(() => {
    const fetchQuickshareTitle = async () => {
      if (currentEventId?.startsWith("quick_") && !quickshareTitle) {
        try {
          const quickId = currentEventId.replace("quick_", "");
          const response = await fetch(`/api/qr/${quickId}/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: "anonymous",
              userName: "Anonymous",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.qrCode?.title) {
              setQuickshareTitle(data.qrCode.title);
            }
          }
        } catch (error) {
          console.error("Failed to fetch quickshare title:", error);
        }
      }
    };

    fetchQuickshareTitle();
  }, [currentEventId, quickshareTitle]);

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
    if (view === "home") {
      localStorage.removeItem("current_quick_id");
      setCurrentEventId(null);
      setQuickshareTitle(null);
    } else if (view === "gallery") {
      setCurrentEventId(null);
      setQuickshareTitle(null);
    }
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
            onViewQuickShare={(quickId) => {
              setCurrentEventId(`quick_${quickId}`);
              setCurrentView("quick-share");
            }}
          />
        );
      case "scanner":
        return (
          <EventAccess
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

        const storedQuickshareTitle = localStorage.getItem("quickshare_title");
        let titleToPass = quickshareTitle;
        if (storedQuickshareTitle && currentEventId?.startsWith("quick_")) {
          titleToPass = storedQuickshareTitle;
          setQuickshareTitle(storedQuickshareTitle);
          localStorage.removeItem("quickshare_title");
        }

        return (
          <PhotoUpload
            userId={user?.id ?? null}
            user={user}
            eventId={currentEventId}
            eventDetails={eventDetails}
            onViewChange={setCurrentView}
            quickshareTitle={titleToPass}
          />
        );
      case "gallery":
        const galleryEventId = currentEventId?.startsWith("quick_")
          ? null
          : currentEventId;
        return (
          <PhotoGallery
            user={user}
            eventId={galleryEventId}
            onViewChange={setCurrentView}
          />
        );
      case "quick-share":
        const quickId = currentEventId?.replace("quick_", "");
        if (!quickId) {
          setCurrentView("home");
          return null;
        }
        localStorage.setItem("current_quick_id", quickId);
        return (
          <QuickShareViewer quickId={quickId} onViewChange={setCurrentView} />
        );
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
                className="cursor-pointer group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(119,84,246,0.15)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-purple-100/50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                onClick={() => handleNavigate("qr-generator")}
              >
                <CardHeader className="text-center relative">
                  <QrCode className="w-12 h-12 mx-auto text-green-600 transition-transform duration-300 group-hover:scale-110" />
                  <CardTitle>Generate QR</CardTitle>
                  <CardDescription>
                    {user?.isGuest
                      ? "Try it out - Photos last 30 minutes"
                      : "Create a quick QR code for sharing"}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(119,84,246,0.15)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-purple-100/50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                onClick={() => handleNavigate("scanner")}
              >
                <CardHeader className="text-center relative">
                  <Search className="w-12 h-12 mx-auto text-yellow-600 transition-transform duration-300 group-hover:scale-110" />
                  <CardTitle>Access Event</CardTitle>
                  <CardDescription>
                    Search or Input URL to access events
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
                // Clear all caches before logout
                if (user?.id) {
                  clearAllCaches(user.id);
                }

                await signOut(auth);
                localStorage.removeItem("barqpix_guest_user");
                localStorage.removeItem("barqpix_user");
                localStorage.removeItem("barqpix_current_view");
                localStorage.removeItem("guest_qr_code");
                localStorage.removeItem("current_quick_id");
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
