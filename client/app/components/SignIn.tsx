"use client";

import React, { useState, useEffect } from "react";
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
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import {
  signin,
  resetPassword,
  setupTokenRefresh,
} from "../../lib/auth.firebase";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../lib/utils/firebase";
import { toast } from "@/app/components/ui/toast";
import { authApi } from "../../lib/api/auth";

interface SignInProps {
  onUserSignedIn: (user: any) => void;
  onViewChange: (view: string) => void;
  onBackToRegister: () => void;
}

export default function SignIn({
  onUserSignedIn,
  onViewChange,
  onBackToRegister,
}: SignInProps) {
  const [currentTab, setCurrentTab] = useState<"email" | "forgot">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [emailSignInData, setEmailSignInData] = useState({
    email: "",
    password: "",
  });

  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { user: firebaseUser, token } = await signin(
        emailSignInData.email,
        emailSignInData.password
      );

      if (!firebaseUser || !token) {
        throw new Error("Authentication failed");
      }

      try {
        await authApi.getCurrentUser(token);
      } catch (error) {
        throw new Error("Failed to get user data from server");
      }

      const user = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
        email: firebaseUser.email,
        createdAt: firebaseUser.metadata.creationTime,
        lastLogin: new Date().toISOString(),
        token,
      };

      localStorage.setItem("barqpix_user", JSON.stringify(user));
      setupTokenRefresh(firebaseUser);
      onUserSignedIn(user);
      onViewChange("home");
      toast.success("Signed in successfully!");
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        toast.error(err.message);
      } else {
        toast.error(
          err.message || "Invalid email or password. Please try again."
        );
      }

      setEmailSignInData({
        email: "",
        password: "",
      });

      return;
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (!firebaseUser) {
        throw new Error("Google authentication failed");
      }

      const idToken = await firebaseUser.getIdToken();

      try {
        await authApi.getCurrentUser(idToken);
      } catch (error) {
        throw new Error("Failed to get user data from server");
      }

      const user = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
        email: firebaseUser.email,
        provider: "google",
        createdAt: firebaseUser.metadata.creationTime,
        lastLogin: new Date().toISOString(),
        token: idToken,
      };

      localStorage.setItem("barqpix_user", JSON.stringify(user));
      setupTokenRefresh(firebaseUser);
      onUserSignedIn(user);
      onViewChange("home");
      toast.success("Signed in with Google!");
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        toast.error(err.message);
      } else {
        toast.error(
          err.message || "Failed to sign in with Google. Please try again."
        );
      }

      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <img
                src="/barqpix_logo1.webp"
                alt="BarqPix"
                className="h-12 object-contain mx-auto"
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your event photos
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            defaultValue="email"
            value={currentTab}
            onValueChange={(value) => {
              setCurrentTab(value as any);
              setError("");
              setLoading(false);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="forgot">Forgot Password</TabsTrigger>
            </TabsList>{" "}
            <TabsContent value="email" className="space-y-4">
              {error && error === "Please enter your email and password" && (
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={emailSignInData.email}
                      onChange={(e) =>
                        setEmailSignInData({
                          ...emailSignInData,
                          email: e.target.value,
                        })
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
                      placeholder="Enter your password"
                      value={emailSignInData.password}
                      onChange={(e) =>
                        setEmailSignInData({
                          ...emailSignInData,
                          password: e.target.value,
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked as boolean)
                      }
                    />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="forgot" className="space-y-4">
              {error && (
                <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {resetSent && (
                <Alert className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Password reset email sent. Please check your inbox.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Reset Password"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Remember your password?
                <Button
                  variant="link"
                  className="p-0 ml-1"
                  onClick={() => {
                    setResetSent(false);
                    setError("");
                    (
                      document.querySelector(
                        '[role="tablist"] button[value="email"]'
                      ) as HTMLElement
                    )?.click();
                  }}
                >
                  Sign In
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign in with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
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
              Sign in with Google
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Button
              variant="link"
              className="p-0 ml-1"
              onClick={onBackToRegister}
            >
              Sign Up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
