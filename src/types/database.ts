// Database types for Supabase

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  total_xp: number;
  videos_count: number;
  activities: Activity[] | null;
  role?: string;
  game_time_spent?: number;
  video_url?: string | null;
  updated_at: string;
  created_at?: string;
}

export interface Activity {
  text: string;
  date: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface UserWithLevel extends Profile {
  level: number;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalXP: number;
  totalVideos: number;
  totalGameTime: number;
  avgXP: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  newUsersToday: number;
}

export interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  xpDistribution: { range: string; count: number }[];
  topUsers: { name: string; xp: number }[];
  topUsersByGameTime: { name: string; gameTime: number }[];
  videoTrends: { date: string; count: number }[];
  activityTimeline: { date: string; count: number }[];
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  total_xp?: number;
  videos_count?: number;
  role?: string;
}

export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  total_xp?: number;
  videos_count?: number;
  activities?: Activity[];
  role?: string;
}

// Level calculation utility
export function getLevelForXP(xp: number): number {
  // 100 XP per level
  return Math.floor(xp / 100) + 1;
}

export function getXPForLevel(level: number): number {
  return (level - 1) * 100;
}

export function getXPProgress(xp: number): { current: number; required: number; percentage: number } {
  const level = getLevelForXP(xp);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const current = xp - currentLevelXP;
  const required = nextLevelXP - currentLevelXP;
  const percentage = (current / required) * 100;
  return { current, required, percentage };
}
