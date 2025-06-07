"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Separator } from "@/app/components/ui/separator";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import {
  User,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import SignIn from "./SignIn";

interface UserRegistrationProps {
  onUserCreated: (user: any) => void;
  onViewChange: (view: string) => void;
}

export default function UserRegistration({
  onUserCreated,
  onViewChange,
}: UserRegistrationProps) {
  const [currentTab, setCurrentTab] = useState<"register" | "signin" | "guest">(
    "register"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    eventCode: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (!acceptTerms) {
        throw new Error("Please accept the terms and conditions");
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const user = {
        id: `user_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        eventCode: formData.eventCode || "GENERAL",
        createdAt: new Date().toISOString(),
        isNewUser: true,
      };

      onUserCreated(user);
      onViewChange("home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    const guestUser = {
      id: `guest_${Date.now()}`,
      name: "Guest User",
      email: "",
      eventCode: "GUEST",
      createdAt: new Date().toISOString(),
      isGuest: true,
    };
    onUserCreated(guestUser);
    onViewChange("home");
  };

  const handleSocialSignUp = async (provider: string) => {
    setLoading(true);
    setError("");

    try {
      // Simulate social sign-up
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const user = {
        id: `${provider}_${Date.now()}`,
        name: `${provider} User`,
        email: `user@${provider}.com`,
        eventCode: "SOCIAL",
        provider,
        createdAt: new Date().toISOString(),
        isNewUser: true,
      };

      onUserCreated(user);
      onViewChange("home");
    } catch (err) {
      setError(`Failed to sign up with ${provider}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (currentTab === "signin") {
    return (
      <SignIn
        onUserSignedIn={onUserCreated}
        onViewChange={onViewChange}
        onBackToRegister={() => setCurrentTab("register")}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto mb-auto">
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="/barqpix_logo1.webp"
              alt="BarqPix"
              className="h-12 object-contain"
            />
          </div>
          <div>
            <CardTitle className="flex items-center justify-center gap-2">
              <UserPlus className="w-6 h-6" />
              Join Event
            </CardTitle>
            <CardDescription>
              Create an account or continue as guest
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={currentTab}
            onValueChange={(value) => setCurrentTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Sign Up</TabsTrigger>
              <TabsTrigger value="guest">Guest Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="space-y-4">
              {error && (
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventCode">Event Code (Optional)</Label>
                  <Input
                    id="eventCode"
                    type="text"
                    placeholder="Enter event code if you have one"
                    value={formData.eventCode}
                    onChange={(e) =>
                      setFormData({ ...formData, eventCode: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) =>
                      setAcceptTerms(checked as boolean)
                    }
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Privacy Policy
                    </Button>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !acceptTerms}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleSocialSignUp("google")}
                  disabled={loading}
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSocialSignUp("facebook")}
                  disabled={loading}
                  className="w-full"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Already have an account?{" "}
                </span>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setCurrentTab("signin")}
                >
                  Sign in
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="guest" className="space-y-4">
              <div className="text-center space-y-4">
                <User className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Continue as Guest</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Quickly start taking photos without creating an account. You
                    can register later to save your photos permanently.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Guest Mode Limitations:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• Photos are temporarily stored</li>
                        <li>• Limited to 10 photos per session</li>
                        <li>• No permanent account access</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button onClick={handleGuestMode} className="w-full">
                  Continue as Guest
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Want full access?{" "}
                  </span>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setCurrentTab("register")}
                  >
                    Create an account
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
