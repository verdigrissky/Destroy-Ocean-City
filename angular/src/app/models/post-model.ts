export interface adjacentPost {
  slug: string;
  title: { rendered: string };
}

export interface post {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  link: string;
  date: string;
  _embedded?: {
    author?: {
      id: number;
      name: string;
      avatar_url: string;
      tier: string;
    }[];
    'media'?: {
      source_url: string;
      alt_text?: string;
      media_details?: { sizes?: Record<string, { source_url: string; width: number; height: number }> };
    }[];
  };
}