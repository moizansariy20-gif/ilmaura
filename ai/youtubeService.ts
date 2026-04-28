
import { LearningResource } from '../types.ts';

// Returns dummy data to simulate a populated learning hub without making real API calls.
export const fetchYouTubeApiResults = async (
  query: string,
  language: string,
  sortBy: string,
  filterBy: string
): Promise<LearningResource[]> => {
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
      {
        title: "Introduction to " + query,
        description: "A comprehensive guide to understanding the basics.",
        url: "https://www.youtube.com",
        channel: "Ilmaura Learning",
        videoCount: 12,
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", // Placeholder
        platform: 'YouTube',
        channelLogoUrl: "https://via.placeholder.com/50",
        subscriberCount: "1M",
        subscriberCountRaw: 1000000,
      },
      {
        title: "Advanced " + query + " Concepts",
        description: "Deep dive into complex topics.",
        url: "https://www.youtube.com",
        channel: "Tech Academy",
        videoCount: 8,
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        platform: 'YouTube',
        channelLogoUrl: "https://via.placeholder.com/50",
        subscriberCount: "500K",
        subscriberCountRaw: 500000,
      },
      {
        title: query + " for Beginners",
        description: "Start your journey here.",
        url: "https://www.youtube.com",
        channel: "School Prep",
        videoCount: 20,
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        platform: 'YouTube',
        channelLogoUrl: "https://via.placeholder.com/50",
        subscriberCount: "250K",
        subscriberCountRaw: 250000,
      }
  ];
};
