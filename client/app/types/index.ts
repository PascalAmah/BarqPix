export interface User {
  id: string;
  name: string;
  isGuest?: boolean;
  avatar?: string;
  email?: string;
  createdAt?: string;
  token?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  organizerId?: string;
  location: string;
  galleryVisibility: "public" | "private";
}
