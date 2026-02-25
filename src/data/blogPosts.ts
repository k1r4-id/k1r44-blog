import postsData from './blogPosts.json';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  content: string;
  thumbnail?: string;
  description?: string;
  lock?: boolean;
}

export const blogPosts: BlogPost[] = postsData as BlogPost[];
