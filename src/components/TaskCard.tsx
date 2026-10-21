import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  User,
  Trash2,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Mic,
  FileText,
  Bot,
  Calendar,
} from 'lucide-react';
import { Task, PriorityLevel, TaskStatus } from '../types.ts';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdatePriority: (id: string, priority: PriorityLevel) => void;
  onDelete: (id: string) => void;
  isHistoryView?: boolean;
}

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; borderClass: string; badgeClass: string; textClass: string; bgClass: string }
> = {
  Critical: {
    label: 'Critical',
    borderClass: 'border-l-4 border-l-red-500',
    badgeClass: 'text-red-400 bg-red-950/60 border border-red-800/80',
    textClass: 'text-red-400',
    bgClass: 'bg-red-500',
  },
  High: {
    label: 'High',
    borderClass: 'border-l-4 border-l-amber-500',
    badgeClass: 'text-amber-400 bg-amber-950/60 border border-amber-800/80',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500',
  },
  Medium: {
    label: 'Medium',
    borderClass: 'border-l-4 border-l-sky-500',
    badgeClass: 'text-sky-400 bg-sky-950/60 border border-sky-800/80',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500',
  },
  Low: {
    label: 'Low',
    borderClass: 'border-l-4 border-l-emerald-500',
    badgeClass: 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/80',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500',
  },
  None: {
    label: 'None',
    borderClass: 'border-l-4 border-l-zinc-700',
    badgeClass: 'text-zinc-400 bg-zinc-900 border border-zinc-800',
    textClass: 'text-zinc-400',
    bgClass: 'bg-zinc-600',
  },
};

const STATUS_ITEMS: Array<{ status: TaskStatus; label: string; icon: React.ReactNode; color: string }> = [
  { status: 'To Do', label: 'To Do', icon: <Circle className="w-3.5 h-3.5" />, color: 'text-zinc-400' },
  { status: 'In Progress', label: 'In Progress', icon: <PlayCircle className="w-3.5 h-3.5" />, color: 'text-sky-400' },
  { status: 'Completed', label: 'Completed', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
  { status: 'Missed / Late', label: 'Missed', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-rose-400' },
];

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onUpdatePriority,
  onDelete,
  isHistoryView = false,
}) => {
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const priorityStyle = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPriorityDropdownOpen(false);
      }
    }
    if (priorityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [priorityDropdownOpen]);

  // Format timestamps nicely
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getSourceIcon = () => {
    switch (task.source) {
      case 'voice':
        return (
          <span title="Captured via Voice">
            <Mic className="w-3 h-3 text-purple-400" />
          </span>
        );
      case 'meeting-script':
        return (
          <span title="Extracted from Meeting Script">
            <FileText className="w-3 h-3 text-sky-400" />
          </span>
        );
      case 'emea-bot':
        return (
          <span title="EMEA Notification Bot">
            <Bot className="w-3 h-3 text-emerald-400" />
          </span>
        );
      case 'cx-bot':
        return (
          <span title="CX Renewal Bot">
            <Bot className="w-3 h-3 text-amber-400" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`group relative bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/80 rounded-r-lg rounded-l-none ${priorityStyle.borderClass} p-3.5 transition-all shadow-sm`}
    >
      {/* Top row: Category, Source & Inline Priority Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
          <span className="font-medium text-zinc-300 truncate">{task.category || 'General'}</span>
          {getSourceIcon()}
          {task.urgencyKeywords && task.urgencyKeywords.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400/90 font-mono">
              <Sparkles className="w-2.5 h-2.5" />
              {task.urgencyKeywords.slice(0, 2).join(', ')}
            </span>
          )}
        </div>

        {/* Inline changeable priority badge with dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${priorityStyle.badgeClass}`}
            title="Click to change priority level"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.bgClass}`} />
            <span>{task.priority}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {priorityDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-950 border border-zinc-700/90 rounded-md shadow-xl py-1 z-30">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800">
                Change Priority
              </div>
              {(['Critical', 'High', 'Medium', 'Low', 'None'] as PriorityLevel[]).map((level) => {
                const conf = PRIORITY_CONFIG[level];
                const isCurrent = task.priority === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      onUpdatePriority(task.id, level);
                      setPriorityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left hover:bg-zinc-800 transition-colors ${
                      isCurrent ? 'bg-zinc-800/80 font-medium text-zinc-100' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${conf.bgClass}`} />
                      <span>{level}</span>
                    </div>
                    {isCurrent && <CheckCircle2 className="w-3 h-3 text-zinc-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4
        className={`text-sm font-medium leading-snug mb-1 text-zinc-100 ${
          task.status === 'Completed' ? 'line-through text-zinc-400' : ''
        }`}
      >
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-zinc-400 leading-relaxed mb-2.5 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta Row: Due Date, Assignee, Timestamps */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mb-3 font-mono tabular-nums">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-zinc-300">
            <Calendar className="w-3 h-3 text-zinc-500" />
            <span>
              {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
            </span>
          </div>
        )}

        {task.assignee && (
          <div className="flex items-center gap-1 text-zinc-300">
            <User className="w-3 h-3 text-zinc-500" />
            <span className="truncate max-w-[140px]">{task.assignee}</span>
          </div>
        )}

        {/* History Timestamps */}
        {isHistoryView && task.completedAt && (
          <div className="flex items-center gap-1 text-emerald-400/90">
            <Clock className="w-3 h-3" />
            <span>Completed: {formatDateTime(task.completedAt)}</span>
          </div>
        )}

        {isHistoryView && task.missedAt && (
          <div className="flex items-center gap-1 text-rose-400/90">
            <AlertTriangle className="w-3 h-3" />
            <span>Missed: {formatDateTime(task.missedAt)}</span>
          </div>
        )}
      </div>

      {/* Multi-State Status Control Panel */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 bg-zinc-950/70 p-0.5 rounded border border-zinc-800/60">
          {STATUS_ITEMS.map((item) => {
            const isActive = task.status === item.status;
            let activeBg = 'bg-zinc-800 text-zinc-100 shadow-xs';
            if (item.status === 'Completed') activeBg = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60';
            if (item.status === 'Missed / Late') activeBg = 'bg-rose-950/80 text-rose-300 border border-rose-800/60';
            if (item.status === 'In Progress') activeBg = 'bg-sky-950/80 text-sky-300 border border-sky-800/60';

            return (
              <button
                key={item.status}
                type="button"
                onClick={() => onUpdateStatus(task.id, item.status)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  isActive ? activeBg : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title={`Mark as ${item.status}`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Delete action */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors rounded hover:bg-zinc-800/60"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
