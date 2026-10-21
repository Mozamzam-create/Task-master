import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Inbox,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { Task, PriorityLevel, TaskStatus, EMEAContact, APDeal } from './types.ts';
import { StorageService } from './services/storage.ts';
import { Header } from './components/Header.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { ManualTaskForm } from './components/ManualTaskForm.tsx';
import { VoiceCaptureModal } from './components/VoiceCaptureModal.tsx';
import { MeetingScriptModal } from './components/MeetingScriptModal.tsx';
import { AnalyticsFooter } from './components/AnalyticsFooter.tsx';
import { EmeaBotModal } from './components/EmeaBotModal.tsx';
import { CxRenewalBotModal } from './components/CxRenewalBotModal.tsx';
import { ExtensionDownloadModal } from './components/ExtensionDownloadModal.tsx';
import { BrowserSimulator } from './components/BrowserSimulator.tsx';
import { SAMPLE_MEETINGS } from './data/mockMeetings.ts';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'created'>('priority');

  // Modals
  const [showVoiceCapture, setShowVoiceCapture] = useState(false);
  const [showScriptAnalysis, setShowScriptAnalysis] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showEmeaBot, setShowEmeaBot] = useState(false);
  const [showCxRenewalBot, setShowCxRenewalBot] = useState(false);
  const [showExtensionDownload, setShowExtensionDownload] = useState(false);

  // Chrome Simulator view mode
  const [viewMode, setViewMode] = useState<'sidepanel' | 'popup' | 'full'>('sidepanel');
  const [activeSimulatedTabIdx, setActiveSimulatedTabIdx] = useState(0);

  // Load tasks on mount
  useEffect(() => {
    async function load() {
      const data = await StorageService.getTasks();
      setTasks(data);
    }
    load();

    const handleStorageUpdated = async () => {
      const data = await StorageService.getTasks();
      setTasks(data);
    };

    window.addEventListener('taskmaster_storage_updated', handleStorageUpdated);
    return () => {
      window.removeEventListener('taskmaster_storage_updated', handleStorageUpdated);
    };
  }, []);

  // Task mutations
  const handleUpdateStatus = async (id: string, newStatus: TaskStatus) => {
    const updated = await StorageService.updateTask(id, { status: newStatus });
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  const handleUpdatePriority = async (id: string, newPriority: PriorityLevel) => {
    const updated = await StorageService.updateTask(id, { priority: newPriority });
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  const handleDeleteTask = async (id: string) => {
    await StorageService.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddManualTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await StorageService.addTask(taskData);
    setTasks((prev) => [created, ...prev]);
    setShowManualAdd(false);
  };

  const handleAddMultipleTasks = async (newTasks: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const created = await StorageService.addMultipleTasks(newTasks);
    setTasks((prev) => [...created, ...prev]);
  };

  const handleResetSampleData = async () => {
    const reset = await StorageService.resetToSampleData();
    setTasks(reset);
    setStatusFilter('All');
  };

  // Bot entity task creation
  const handleCreateTaskForEmeaContact = async (contact: EMEAContact) => {
    setShowEmeaBot(false);
    const created = await StorageService.addTask({
      title: `Follow up with EMEA Lead: ${contact.name} (${contact.role})`,
      description: `Coordinate regional on-call response for ${contact.region}. Email: ${contact.email}. Focus: ${contact.specialization}.`,
      priority: contact.onCallStatus === 'On Call' ? 'Critical' : 'High',
      status: 'To Do',
      category: 'EMEA Outreach',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      dueTime: '15:00',
      assignee: contact.name,
      source: 'emea-bot',
    });
    setTasks((prev) => [created, ...prev]);
  };

  const handleCreateTaskForDeal = async (deal: APDeal) => {
    setShowCxRenewalBot(false);
    const priority = deal.health === 'Critical Risk' ? 'Critical' : deal.health === 'At Risk' ? 'High' : 'Medium';
    const created = await StorageService.addTask({
      title: `Prepare AP Renewal Deck: ${deal.dealName} ($${(deal.arrValue / 1000).toFixed(0)}k ARR)`,
      description: `Target Renewal Date: ${deal.renewalDate}. Account Partner: ${deal.accountPartner}. Health: ${deal.health}. Engage key stakeholders.`,
      priority,
      status: 'To Do',
      category: 'Sales / AP Deals',
      dueDate: deal.renewalDate,
      assignee: deal.accountPartner,
      source: 'cx-bot',
    });
    setTasks((prev) => [created, ...prev]);
  };

  // Priority ranking weights
  const priorityWeight: Record<PriorityLevel, number> = {
    Critical: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    None: 1,
  };

  // Filter & Sort Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Tab separation: Active vs History
        if (activeTab === 'active') {
          if (task.status === 'Completed' || task.status === 'Missed / Late') {
            // If user explicitly clicked Completed/Missed hyperlinked filter in footer, allow showing it
            if (statusFilter !== 'Completed' && statusFilter !== 'Missed / Late') {
              return false;
            }
          }
        } else if (activeTab === 'history') {
          if (task.status !== 'Completed' && task.status !== 'Missed / Late') {
            return false;
          }
        }

        // Status filter (from hyperlinked numbers or selector)
        if (statusFilter !== 'All' && task.status !== statusFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'All' && task.category !== categoryFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description.toLowerCase().includes(q);
          const matchAssignee = task.assignee?.toLowerCase().includes(q);
          const matchUrgency = task.urgencyKeywords?.some((k) => k.toLowerCase().includes(q));
          return matchTitle || matchDesc || matchAssignee || matchUrgency;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        if (sortBy === 'date') {
          return (a.dueDate || '').localeCompare(b.dueDate || '');
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, activeTab, statusFilter, priorityFilter, categoryFilter, searchQuery, sortBy]);

  // Handle hyperlinked status filter clicks from the Analytics footer
  const handleSelectStatusFilter = (filter: TaskStatus | 'All') => {
    setStatusFilter(filter);
    if (filter === 'Completed' || filter === 'Missed / Late') {
      setActiveTab('history');
    } else if (filter === 'To Do' || filter === 'In Progress') {
      setActiveTab('active');
    }
  };

  // Extension Workspace component
  const ExtensionWorkspace = (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans border-zinc-800">
      {/* Sticky Top Header */}
      <Header
        onOpenVoiceCapture={() => {
          setShowVoiceCapture(true);
          setShowScriptAnalysis(false);
          setShowManualAdd(false);
        }}
        onOpenScriptAnalysis={() => {
          setShowScriptAnalysis(true);
          setShowVoiceCapture(false);
          setShowManualAdd(false);
        }}
        onOpenManualAdd={() => {
          setShowManualAdd(!showManualAdd);
          setShowVoiceCapture(false);
          setShowScriptAnalysis(false);
        }}
        onOpenEmeaBot={() => setShowEmeaBot(true)}
        onOpenCxRenewalBot={() => setShowCxRenewalBot(true)}
        onOpenExtensionDownload={() => setShowExtensionDownload(true)}
        onResetSampleData={handleResetSampleData}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
        {/* Modals & Forms rendered inline within side panel */}
        {showVoiceCapture && (
          <VoiceCaptureModal
            onAddTasks={handleAddMultipleTasks}
            onClose={() => setShowVoiceCapture(false)}
          />
        )}

        {showScriptAnalysis && (
          <MeetingScriptModal
            onAddTasks={handleAddMultipleTasks}
            onClose={() => setShowScriptAnalysis(false)}
            activeSimulatedTab={SAMPLE_MEETINGS[activeSimulatedTabIdx]}
          />
        )}

        {showManualAdd && (
          <ManualTaskForm
            onAddTask={handleAddManualTask}
            onCancel={() => setShowManualAdd(false)}
          />
        )}

        {showEmeaBot && (
          <EmeaBotModal
            onClose={() => setShowEmeaBot(false)}
            onCreateTaskForContact={handleCreateTaskForEmeaContact}
          />
        )}

        {showCxRenewalBot && (
          <CxRenewalBotModal
            onClose={() => setShowCxRenewalBot(false)}
            onCreateTaskForDeal={handleCreateTaskForDeal}
          />
        )}

        {/* Task Lifecycle Tabs & Search Toolbar */}
        <div className="space-y-2 pt-1">
          {/* Active Tasks vs Task History Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('active');
                  if (statusFilter === 'Completed' || statusFilter === 'Missed / Late') {
                    setStatusFilter('All');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Active Tasks</span>
                <span className="font-mono text-[10px] text-zinc-400">
                  (
                  {
                    tasks.filter((t) => t.status === 'To Do' || t.status === 'In Progress').length
                  }
                  )
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  if (statusFilter === 'To Do' || statusFilter === 'In Progress') {
                    setStatusFilter('All');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>Task History</span>
                <span className="font-mono text-[10px] text-zinc-400">
                  (
                  {
                    tasks.filter(
                      (t) => t.status === 'Completed' || t.status === 'Missed / Late'
                    ).length
                  }
                  )
                </span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <ArrowUpDown className="w-3 h-3 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="priority" className="bg-zinc-900">
                  Priority
                </option>
                <option value="date" className="bg-zinc-900">
                  Due Date
                </option>
                <option value="created" className="bg-zinc-900">
                  Recent
                </option>
              </select>
            </div>
          </div>

          {/* Search Bar & Active Filters */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, urgency words, assignees..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="None">None</option>
            </select>
          </div>

          {/* Active status filter banner if user clicked hyperlinked number */}
          {statusFilter !== 'All' && (
            <div className="flex items-center justify-between px-2.5 py-1 bg-zinc-900/90 border border-zinc-800 rounded text-xs text-zinc-300">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 font-mono">
                  Filtered:
                </span>
                <span className="font-medium text-sky-400">{statusFilter}</span>
                <span className="text-zinc-500">({filteredTasks.length} tasks)</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-0.5"
              >
                <X className="w-3 h-3" />
                <span>Clear Filter</span>
              </button>
            </div>
          )}
        </div>

        {/* Task Cards List */}
        <div className="space-y-2.5 pb-2">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdateStatus={handleUpdateStatus}
                onUpdatePriority={handleUpdatePriority}
                onDelete={handleDeleteTask}
                isHistoryView={activeTab === 'history'}
              />
            ))
          ) : (
            <div className="py-12 px-4 text-center rounded-lg border border-dashed border-zinc-800/80 bg-zinc-900/30">
              <Inbox className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <h4 className="text-xs font-semibold text-zinc-300 mb-1">
                {activeTab === 'history' ? 'No Completed / Missed Tasks' : 'No Active Tasks Found'}
              </h4>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto mb-3">
                {statusFilter !== 'All'
                  ? `There are no tasks with status "${statusFilter}". Click Clear Filter or add a task.`
                  : 'Capture tasks via Voice, extract action items from a Meeting Script, or add manually.'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceCapture(true)}
                  className="px-2.5 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded text-xs font-medium hover:bg-purple-900 transition-colors"
                >
                  Voice Capture
                </button>
                <button
                  type="button"
                  onClick={() => setShowScriptAnalysis(true)}
                  className="px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-800 rounded text-xs font-medium hover:bg-sky-900 transition-colors"
                >
                  Meeting Script
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Sticky Footer Analytics Summary Dashboard */}
      <AnalyticsFooter
        tasks={tasks}
        activeFilter={statusFilter}
        onSelectFilter={handleSelectStatusFilter}
      />
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Extension Download & Manifest V3 Code Modal */}
      {showExtensionDownload && (
        <ExtensionDownloadModal onClose={() => setShowExtensionDownload(false)} />
      )}

      {/* Viewport Render based on viewMode */}
      {viewMode === 'sidepanel' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left 65%: Simulated Google Meet / Microsoft Teams Tab */}
          <div className="flex-1 h-full min-w-0 hidden md:block">
            <BrowserSimulator
              activeTabIdx={activeSimulatedTabIdx}
              onSelectTab={setActiveSimulatedTabIdx}
            />
          </div>

          {/* Right 35%: Chrome Side Panel (~400px width) */}
          <div className="w-full md:w-[420px] lg:w-[440px] shrink-0 h-full shadow-2xl border-l border-zinc-800">
            {ExtensionWorkspace}
          </div>
        </div>
      )}

      {viewMode === 'popup' && (
        <div className="flex-1 relative flex items-center justify-center bg-zinc-900/60 p-4 overflow-hidden">
          {/* Background simulated browser window */}
          <div className="absolute inset-4 rounded-xl border border-zinc-800 overflow-hidden opacity-40 pointer-events-none">
            <BrowserSimulator
              activeTabIdx={activeSimulatedTabIdx}
              onSelectTab={setActiveSimulatedTabIdx}
            />
          </div>

          {/* Action Popup floating frame (compact 380px x 620px) */}
          <div className="relative z-10 w-[390px] h-[640px] max-h-[92vh] rounded-xl border border-zinc-700/80 shadow-2xl overflow-hidden bg-zinc-950">
            {ExtensionWorkspace}
          </div>
        </div>
      )}

      {viewMode === 'full' && (
        <div className="flex-1 h-full max-w-4xl mx-auto w-full border-x border-zinc-800 shadow-2xl">
          {ExtensionWorkspace}
        </div>
      )}
    </div>
  );
}
