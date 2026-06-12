export interface Slide {
  id: string;
  title: string;
  url: string;
  duration: number; // seconds
  enabled: boolean;
  order: number;
  createdAt: string;
}
