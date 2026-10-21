import React from 'react';
import { Video, Users, Mic, PhoneOff, MessageSquare, ExternalLink, Globe } from 'lucide-react';
import { SAMPLE_MEETINGS } from '../data/mockMeetings.ts';

interface BrowserSimulatorProps {
  activeTabIdx: number;
  onSelectTab: (idx: number) => void;
}

export const BrowserSimulator: React.FC<BrowserSimulatorProps> = ({
  activeTabIdx,
  onSelectTab,
}) => {
  const currentMeeting = SAMPLE_MEETINGS[activeTabIdx] || SAMPLE_MEETINGS[0];

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800 overflow-hidden">
      {/* Simulated Chrome Browser Chrome / Tab bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {SAMPLE_MEETINGS.map((meeting, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectTab(idx)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-t-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTabIdx === idx
                  ? 'bg-zinc-950 text-zinc-100 border-t-2 border-sky-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{meeting.title}</span>
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
          <span>Side Panel Docked</span>
        </div>
      </div>

      {/* Simulated Address Bar */}
      <div className="bg-zinc-950 px-3 py-1.5 border-b border-zinc-800/80 flex items-center gap-2">
        <div className="flex-1 bg-zinc-900 rounded px-2.5 py-1 text-xs text-zinc-400 font-mono flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-zinc-200">
              https://meet.google.com/live-sync-{currentMeeting.platform.toLowerCase().replace(/\s+/g, '-')}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 px-1 py-0.2 rounded bg-emerald-950/80 font-sans">
            LIVE CALL
          </span>
        </div>
      </div>

      {/* Meeting Video Grid / Transcript Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Call Stage Banner */}
        <div className="relative rounded-lg bg-zinc-900 border border-zinc-800/80 p-4 overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-950 text-sky-300 border border-sky-800">
                  {currentMeeting.platform}
                </span>
                <span className="text-xs text-zinc-400">{currentMeeting.context}</span>
              </div>
              <h2 className="text-base font-semibold text-zinc-100">{currentMeeting.title}</h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                <span>6 attendees</span>
              </span>
            </div>
          </div>

          {/* Simulated Active Speaker Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            <div className="aspect-video bg-zinc-950 rounded border border-zinc-800 flex flex-col items-center justify-center p-2 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-900 text-indigo-300 flex items-center justify-center text-xs font-semibold mb-1">
                SJ
              </div>
              <span className="text-[11px] text-zinc-300">Sarah Jenkins (CX VP)</span>
              <span className="absolute bottom-1 right-1 text-[9px] text-emerald-400">Speaking</span>
            </div>

            <div className="aspect-video bg-zinc-950 rounded border border-zinc-800 flex flex-col items-center justify-center p-2 relative">
              <div className="w-8 h-8 rounded-full bg-amber-900 text-amber-300 flex items-center justify-center text-xs font-semibold mb-1">
                MV
              </div>
              <span className="text-[11px] text-zinc-300">Marcus Vance</span>
              <span className="absolute bottom-1 right-1 text-[9px] text-zinc-500">Muted</span>
            </div>

            <div className="aspect-video bg-zinc-950 rounded border border-zinc-800 flex flex-col items-center justify-center p-2 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center text-xs font-semibold mb-1">
                ER
              </div>
              <span className="text-[11px] text-zinc-300">Elena Rostova (EMEA)</span>
            </div>
          </div>
        </div>

        {/* Live Closed Captions / Subtitles stream (which content.js scrapes) */}
        <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-3.5 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Live Meeting Captions / Transcript Stream</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Scrapable by TaskMaster content.js
            </span>
          </div>

          <div className="bg-zinc-950 rounded p-3 text-xs font-mono text-zinc-300 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line border border-zinc-800/80">
            {currentMeeting.script}
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
            <span>Tip: Switch tabs above or click &quot;Grab from Active Tab&quot; inside TaskMaster</span>
            <span className="text-sky-400 font-medium">Synced with Side Panel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
