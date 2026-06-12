export interface Slide {
  id: string;
  title: string;
  url: string;
  duration: number; // seconds
  enabled: boolean;
  order: number;
  createdAt: string;
}

export interface SlideshowConfig {
  slides: Slide[];
  adminPassword: string;
  lastUpdated: string;
}

export const DEFAULT_CONFIG: SlideshowConfig = {
  slides: [
    {
      id: "demo-1",
      title: "Google Apps Script Dashboard",
      url: "https://script.google.com/home/projects/1k-mjyXPkB27qJ1ydjftwJbM__ET3G7W2YOeBPIaIbDDbGdrqxEuCgzt8/edit",
      duration: 30,
      enabled: true,
      order: 0,
      createdAt: new Date().toISOString(),
    },
  ],
  adminPassword: "admin123",
  lastUpdated: new Date().toISOString(),
};
