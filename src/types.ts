export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';

export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Missed / Late';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  status: TaskStatus;
  category: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  assignee?: string;
  source: 'manual' | 'voice' | 'meeting-script' | 'emea-bot' | 'cx-bot';
  urgencyKeywords?: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  completedAt?: string; // ISO
  missedAt?: string; // ISO
}

export interface ExtractedActionItem {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  category: string;
  assignee?: string;
  dueDate?: string;
  urgencyRationale?: string;
  selected: boolean;
}

export interface EMEAContact {
  id: string;
  name: string;
  role: string;
  region: string;
  email: string;
  timezone: string;
  onCallStatus: 'Available' | 'On Call' | 'In Meeting' | 'Offline';
  specialization: string;
}

export interface APDeal {
  id: string;
  dealName: string;
  accountPartner: string;
  arrValue: number;
  renewalDate: string;
  health: 'Critical Risk' | 'At Risk' | 'On Track' | 'Renewed';
  keyContacts: string[];
  pendingActionsCount: number;
}
