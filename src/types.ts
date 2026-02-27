export interface User {
  id: number;
  email: string;
  name: string;
  subscription: 'free' | 'premium';
  request_count: number;
  last_request_date: string;
}

export interface Task {
  id: number;
  user_id: number;
  name: string;
  subject: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  completed: number;
}

export interface HistoryItem {
  id: number;
  user_id: number;
  type: string;
  query: string;
  response: string;
  timestamp: string;
}

export type GradeLevel = 'elementary' | 'high school' | 'college' | 'graduate';
export type Difficulty = 'simple' | 'detailed' | 'advanced';
