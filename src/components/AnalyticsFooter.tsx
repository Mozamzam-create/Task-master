import React from 'react';
import { Task, TaskStatus } from '../types.ts';

interface AnalyticsFooterProps {
  tasks: Task[];
  activeFilter: TaskStatus | 'All';
  onSelectFilter: (filter: TaskStatus | 'All') => void;
}

export const AnalyticsFooter: React.FC<AnalyticsFooterProps> = ({
  tasks,
  activeFilter,
  onSelectFilter,
}) => {
  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'To Do').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
    missed: tasks.filter((t) => t.status === 'Missed / Late').length,
  };

  const metrics: Array<{
    key: TaskStatus | 'All';
    label: string;
    count: number;
    color: string;
    hoverColor: string;
    activeBorder: string;
  }> = [
    {
      key: 'All',
      label: 'All Tasks',
      count: counts.all,
      color: 'text-zinc-200',
      hoverColor: 'hover:text-white hover:bg-zinc-800/80',
      activeBorder: 'border-zinc-400 bg-zinc-800/90 text-white',
    },
    {
      key: 'To Do',
      label: 'To Do',
      count: counts.todo,
      color: 'text-zinc-400',
      hoverColor: 'hover:text-zinc-200 hover:bg-zinc-800/80',
      activeBorder: 'border-zinc-500 bg-zinc-800/90 text-zinc-100',
    },
    {
      key: 'In Progress',
      label: 'In Progress',
      count: counts.inProgress,
      color: 'text-sky-400',
      hoverColor: 'hover:text-sky-300 hover:bg-sky-950/50',
      activeBorder: 'border-sky-500 bg-sky-950/70 text-sky-300',
    },
    {
      key: 'Completed',
      label: 'Completed',
      count: counts.completed,
      color: 'text-emerald-400',
      hoverColor: 'hover:text-emerald-300 hover:bg-emerald-950/50',
      activeBorder: 'border-emerald-500 bg-emerald-950/70 text-emerald-300',
    },
    {
      key: 'Missed / Late',
      label: 'Missed',
      count: counts.missed,
      color: 'text-rose-400',
      hoverColor: 'hover:text-rose-300 hover:bg-rose-950/50',
      activeBorder: 'border-rose-500 bg-rose-950/70 text-rose-300',
    },
  ];

  return (
    <footer className="sticky bottom-0 z-20 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {metrics.map((metric) => {
          const isActive = activeFilter === metric.key;
          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => onSelectFilter(metric.key)}
              className={`flex-1 min-w-[58px] flex flex-col items-center justify-center py-1 px-1.5 rounded transition-all cursor-pointer border ${
                isActive
                  ? `${metric.activeBorder} shadow-xs scale-102`
                  : `border-transparent ${metric.hoverColor}`
              }`}
              title={`Click to filter tasks by ${metric.label}`}
            >
              {/* Hyperlinked numeric count */}
              <span
                className={`text-sm font-semibold font-mono tabular-nums leading-none mb-0.5 ${metric.color}`}
              >
                {metric.count}
              </span>
              <span className="text-[10px] text-zinc-400 whitespace-nowrap leading-tight truncate">
                {metric.label}
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};
