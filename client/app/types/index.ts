export interface User {
  id: string;
  name: string;
  isGuest?: boolean;
  avatar?: string;
  email?: string;
}

export interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  organizerId?: string;
}
