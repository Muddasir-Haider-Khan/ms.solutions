// Social link platform constants — shared between server actions and client components
// This file does NOT have "use server" so it can export non-async values

export type SocialPlatform = "facebook" | "instagram" | "twitter" | "youtube";

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  youtube: "YouTube",
};

export const DEFAULT_PLATFORMS: SocialPlatform[] = [
  "facebook",
  "instagram",
  "twitter",
  "youtube",
];
