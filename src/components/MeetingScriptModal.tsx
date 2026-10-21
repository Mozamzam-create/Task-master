import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus,
  CheckSquare,
  Square,
  Globe,
  ChevronDown,
  User,
  Calendar,
} from 'lucide-react';
import { Task, PriorityLevel, ExtractedActionItem } from '../types.ts';
import { TaskApiService } from '../services/api.ts';
import { SAMPLE_MEETINGS } from '../data/mockMeetings.ts';

interface MeetingScriptModalProps {
  onAddTasks: (tasks: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onClose: () => void;
  activeSimulatedTab?: { title: string; script: string; platform: string };
}

export const MeetingScriptModal: React.FC<MeetingScriptModalProps> = ({
  onAddTasks,
  onClose,
  activeSimulatedTab,
}) => {
  const [scriptText, setScriptText] = useState(
    activeSimulatedTab?.script || SAMPLE_MEETINGS[0].script
  );
  const [meetingTitle, setMeetingTitle] = useState(
    activeSimulatedTab?.title || SAMPLE_MEETINGS[0].title
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionItems, setActionItems] = useState<ExtractedActionItem[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Scrape from simulated or real tab
  const handleGrabFromActiveTab = () => {
    if (activeSimulatedTab) {
      setMeetingTitle(activeSimulatedTab.title);
      setScriptText(activeSimulatedTab.script);
      setError(null);
      return;
    }

    // If real Chrome Extension environment
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.tabs) {
      (window as any).chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs[0]?.id) {
          (window as any).chrome.tabs.sendMessage(
            tabs[0].id,
            { type: 'GET_MEETING_TRANSCRIPT' },
            (response: any) => {
              if (response && response.text) {
                setScriptText(response.text);
                if (response.title) setMeetingTitle(response.title);
              } else {
                setError('No transcript found on active tab. Try pasting the meeting notes.');
              }
            }
          );
        }
      });
    } else {
      // Default to Google Meet preset
      setMeetingTitle(SAMPLE_MEETINGS[0].title);
      setScriptText(SAMPLE_MEETINGS[0].script);
    }
  };

  const handleParseScript = async () => {
    if (!scriptText.trim()) {
      setError('Please paste meeting notes or grab from active tab first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setAddedSuccess(false);

    try {
      const response = await TaskApiService.parseMeetingScript(scriptText, meetingTitle);
      setActionItems(response.actionItems || []);
      setSummary(response.meetingSummary || '');
    } catch (err: any) {
      console.error('Failed to parse meeting script:', err);
      setError(err.message || 'Failed to analyze meeting transcript');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectActionItem = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = actionItems.every((item) => item.selected);
    setActionItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const handleUpdateItemPriority = (id: string, priority: PriorityLevel) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, priority } : item))
    );
  };

  const handleAddApprovedTasks = () => {
    const selected = actionItems.filter((item) => item.selected);
    if (selected.length === 0) {
      setError('Please select at least one task to add.');
      return;
    }

    const tasksToAdd: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> = selected.map((item) => ({
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: 'To Do',
      category: item.category || 'Client Success',
      assignee: item.assignee,
      dueDate: item.dueDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      source: 'meeting-script',
    }));

    onAddTasks(tasksToAdd);
    setAddedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const selectedCount = actionItems.filter((item) => item.selected).length;

  return (
    <div className="bg-zinc-900 border border-zinc-700/80 rounded-lg p-4 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/80">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Meeting Script Analysis</h3>
            <p className="text-[11px] text-zinc-400">Action Item Extraction & Review Checklist</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-300 font-medium px-2 py-1"
        >
          Close
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Selector & Grab Active Tab */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-zinc-500 font-medium">Presets:</span>
          {SAMPLE_MEETINGS.map((meeting, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMeetingTitle(meeting.title);
                setScriptText(meeting.script);
                setActionItems([]);
                setError(null);
              }}
              className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                meetingTitle === meeting.title
                  ? 'bg-sky-950 text-sky-300 border-sky-800 font-medium'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {meeting.platform}
            </button>
          ))}
        </div>

        {/* Grab from Active Tab button */}
        <button
          type="button"
          onClick={handleGrabFromActiveTab}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-[11px] font-medium transition-colors"
          title="Scrape captions or highlighted text from the active browser tab"
        >
          <Globe className="w-3 h-3 text-sky-400" />
          <span>Grab from Active Tab</span>
        </button>
      </div>

      {/* Meeting Title Input */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
          Meeting Context / Title
        </label>
        <input
          type="text"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          placeholder="e.g., Google Meet: CX & AP Deal Renewal Sync"
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Transcript Textarea */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
          Transcript / Conversation Script
        </label>
        <textarea
          rows={5}
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Paste meeting transcript, closed captions, or conversation notes..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-sky-500 font-mono resize-none leading-relaxed"
        />
      </div>

      {/* Parse Trigger Button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!scriptText.trim() || isProcessing}
          onClick={handleParseScript}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors shadow-sm cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Script with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extract Action Items Checklist</span>
            </>
          )}
        </button>
      </div>

      {/* Checklist Preview Modal/Section */}
      {actionItems.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-zinc-800">
          {summary && (
            <div className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300">
              <span className="font-semibold text-zinc-200">Meeting Summary: </span>
              {summary}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 font-medium"
              >
                {actionItems.every((item) => item.selected) ? (
                  <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>Select All</span>
              </button>
              <span className="text-zinc-500 text-xs">
                ({selectedCount} of {actionItems.length} selected)
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">Review & tweak before committing</span>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {actionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSelectActionItem(item.id)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  item.selected
                    ? 'bg-zinc-950 border-sky-900/80 shadow-xs'
                    : 'bg-zinc-950/50 border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="pt-0.5 text-sky-400 shrink-0">
                    {item.selected ? (
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-zinc-100 leading-snug">
                        {item.title}
                      </span>

                      {/* Inline Priority selector */}
                      <select
                        value={item.priority}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleUpdateItemPriority(item.id, e.target.value as PriorityLevel)
                        }
                        className="bg-zinc-900 border border-zinc-700/80 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 shrink-0"
                      >
                        {(['Critical', 'High', 'Medium', 'Low', 'None'] as PriorityLevel[]).map(
                          (p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500 font-mono pt-1">
                      {item.assignee && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <User className="w-2.5 h-2.5" />
                          {item.assignee}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Calendar className="w-2.5 h-2.5" />
                          {item.dueDate}
                        </span>
                      )}
                      {item.urgencyRationale && (
                        <span className="text-amber-400/90 truncate max-w-[200px]">
                          {item.urgencyRationale}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Approved Tasks Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddApprovedTasks}
              disabled={selectedCount === 0 || addedSuccess}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-xs font-medium transition-colors shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {addedSuccess
                  ? 'Approved Tasks Added to Main To-Do List!'
                  : `Add Approved Tasks (${selectedCount})`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
