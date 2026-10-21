import React from 'react';
import {
  Bot,
  Mic,
  FileText,
  Plus,
  Download,
  PanelRightClose,
  Maximize2,
  Minimize2,
  Layout,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  onOpenVoiceCapture: () => void;
  onOpenScriptAnalysis: () => void;
  onOpenManualAdd: () => void;
  onOpenEmeaBot: () => void;
  onOpenCxRenewalBot: () => void;
  onOpenExtensionDownload: () => void;
  onResetSampleData: () => void;
  viewMode: 'sidepanel' | 'popup' | 'full';
  onChangeViewMode: (mode: 'sidepanel' | 'popup' | 'full') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVoiceCapture,
  onOpenScriptAnalysis,
  onOpenManualAdd,
  onOpenEmeaBot,
  onOpenCxRenewalBot,
  onOpenExtensionDownload,
  onResetSampleData,
  viewMode,
  onChangeViewMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      {/* Primary Brand & Extension Context Row */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
            TM
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-zinc-100 tracking-tight leading-none truncate">
              TaskMaster
            </h1>
            <span className="text-[10px] text-zinc-400 leading-none">
              Voice & Meeting AI
            </span>
          </div>
        </div>

        {/* View mode & Extension Package Trigger */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* View Mode Toggle: Sidepanel | Popup | Full */}
          <div className="hidden sm:flex items-center bg-zinc-900 rounded p-0.5 border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => onChangeViewMode('sidepanel')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'sidepanel'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Chrome Side Panel docked next to active browser tab"
            >
              Side Panel
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('popup')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'popup'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Chrome Action Popup (380px compact)"
            >
              Popup
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('full')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'full'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Full Extension View"
            >
              Full
            </button>
          </div>

          {/* Download Extension Zip */}
          <button
            type="button"
            onClick={onOpenExtensionDownload}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/80 rounded text-xs font-medium transition-colors"
            title="Download Manifest V3 Chrome Extension ZIP"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Extension (.zip)</span>
          </button>
        </div>
      </div>

      {/* External Bot Quick-Actions Bar (Required Section 4) */}
      <div className="px-3 py-1.5 bg-zinc-900/80 border-t border-zinc-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5">
          {/* EMEA Notification Bot Quick Action */}
          <button
            type="button"
            onClick={onOpenEmeaBot}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-300 hover:text-emerald-200 border border-emerald-800/70 rounded text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            title="Launch EMEA Notification Bot to retrieve team contacts"
          >
            <Bot className="w-3 h-3 text-emerald-400" />
            <span>Retrieve Team Contacts</span>
          </button>

          {/* CX Renewal Bot Quick Action */}
          <button
            type="button"
            onClick={onOpenCxRenewalBot}
            className="flex items-center gap-1 px-2 py-1 bg-amber-950/60 hover:bg-amber-950 text-amber-300 hover:text-amber-200 border border-amber-800/70 rounded text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            title="Launch CX Renewal Bot to track deals linked to Account Partners (APs)"
          >
            <Bot className="w-3 h-3 text-amber-400" />
            <span>Track Deals Linked to APs</span>
          </button>
        </div>

        {/* Reset sample data */}
        <button
          type="button"
          onClick={onResetSampleData}
          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Reset to default sample tasks"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Fast Task Capture Action Toolbar */}
      <div className="px-3 py-2 bg-zinc-950 border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {/* Voice Capture */}
        <button
          type="button"
          onClick={onOpenVoiceCapture}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-800/80 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5 text-purple-400" />
          <span>Voice Capture</span>
        </button>

        {/* Meeting Script Analysis */}
        <button
          type="button"
          onClick={onOpenScriptAnalysis}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-sky-950/70 hover:bg-sky-900/80 text-sky-200 border border-sky-800/80 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Meeting Script</span>
        </button>

        {/* Add Manually */}
        <button
          type="button"
          onClick={onOpenManualAdd}
          className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Manually</span>
        </button>
      </div>
    </header>
  );
};
