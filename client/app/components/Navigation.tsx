"use client";

import { Button } from "@/app/components/ui/button";
import { Home, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user: any;
  onLogout: () => void;
}

export default function Navigation({
  currentView,
  onViewChange,
  user,
  onLogout,
}: NavigationProps) {
  const [isActive, setIsActive] = useState(false);

  const handleHomeClick = () => {
    onViewChange("home");
    setIsActive(false);
  };

  const handleProfileClick = () => {
    onViewChange("profile");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-2">
        {user ? (
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  onClick={handleHomeClick}
                  className="flex items-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatar || "/placeholder-user.jpg"}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <Button
              variant={isActive ? "default" : "ghost"}
              onClick={handleHomeClick}
              className="flex items-center"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={() => onViewChange("register")}>
              <User className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
