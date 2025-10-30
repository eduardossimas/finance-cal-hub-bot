export interface User {
  id: string;
  name: string;
  phone?: string;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  color_index: number;
  is_active: boolean;
  created_at?: string;
}

export type ActivityStatus = 
  | 'pending' 
  | 'doing' 
  | 'completed' 
  | 'waiting-client' 
  | 'waiting-team';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_users?: string[];
  date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  status?: ActivityStatus;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BotCommand {
  command: string;
  description: string;
  aliases?: string[];
}
