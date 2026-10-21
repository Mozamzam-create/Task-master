import { Task } from '../types.ts';
import { INITIAL_TASKS } from '../data/mockMeetings.ts';

const STORAGE_KEY = 'taskmaster_chrome_tasks_v1';

declare const chrome: any;

export class StorageService {
  private static isChromeStorage(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local &&
      typeof chrome.storage.local.get === 'function'
    );
  }

  static async getTasks(): Promise<Task[]> {
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result: any) => {
          if (result && Array.isArray(result[STORAGE_KEY]) && result[STORAGE_KEY].length > 0) {
            resolve(result[STORAGE_KEY]);
          } else {
            // Seed with initial tasks
            this.setTasks(INITIAL_TASKS);
            resolve(INITIAL_TASKS);
          }
        });
      });
    }

    // LocalStorage fallback
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading from localStorage', e);
    }

    // Default seed
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    return INITIAL_TASKS;
  }

  static async setTasks(tasks: Task[]): Promise<void> {
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: tasks }, () => {
          resolve();
        });
      });
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      window.dispatchEvent(new Event('taskmaster_storage_updated'));
    } catch (e) {
      console.error('Failed saving tasks', e);
    }
  }

  static async addTask(newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Task> {
    const tasks = await this.getTasks();
    const task: Task = {
      ...newTask,
      id: newTask.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [task, ...tasks];
    await this.setTasks(updated);
    return task;
  }

  static async addMultipleTasks(newTasks: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task[]> {
    const tasks = await this.getTasks();
    const now = new Date().toISOString();
    const created: Task[] = newTasks.map((t, index) => ({
      ...t,
      id: `task-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    }));
    await this.setTasks([...created, ...tasks]);
    return created;
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const current = tasks[index];
    const updated: Task = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If status changed to Completed, stamp completedAt
    if (updates.status === 'Completed' && current.status !== 'Completed') {
      updated.completedAt = new Date().toISOString();
    }
    // If status changed to Missed, stamp missedAt
    if (updates.status === 'Missed / Late' && current.status !== 'Missed / Late') {
      updated.missedAt = new Date().toISOString();
    }
    // If moving back to To Do or In Progress, clear completedAt/missedAt or retain history
    if (updates.status === 'To Do' || updates.status === 'In Progress') {
      // Keep completedAt in history record or clear if reactivated
    }

    tasks[index] = updated;
    await this.setTasks(tasks);
    return updated;
  }

  static async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    await this.setTasks(filtered);
  }

  static async resetToSampleData(): Promise<Task[]> {
    await this.setTasks(INITIAL_TASKS);
    return INITIAL_TASKS;
  }
}
