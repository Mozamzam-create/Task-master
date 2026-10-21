import { PriorityLevel, ExtractedActionItem } from '../types.ts';

export interface ParsedVoiceTask {
  title: string;
  description: string;
  priority: PriorityLevel;
  category: string;
  dueDate?: string;
  dueTime?: string;
  urgencyKeywordsDetected: string[];
  extractedFrom: 'voice';
}

export interface VoiceParseResponse {
  tasks: ParsedVoiceTask[];
  source?: 'gemini' | 'heuristic' | 'fallback';
}

export interface ScriptParseResponse {
  meetingSummary: string;
  actionItems: ExtractedActionItem[];
  source?: 'gemini' | 'heuristic' | 'fallback';
}

export class TaskApiService {
  static async parseVoiceTranscript(transcript: string): Promise<VoiceParseResponse> {
    const res = await fetch('/api/tasks/parse-voice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to parse voice transcript: ${res.statusText}`);
    }

    return res.json();
  }

  static async parseMeetingScript(scriptText: string, meetingTitle?: string): Promise<ScriptParseResponse> {
    const res = await fetch('/api/tasks/parse-script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scriptText, meetingTitle }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to parse meeting script: ${res.statusText}`);
    }

    return res.json();
  }
}
