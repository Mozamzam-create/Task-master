import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus,
  Flame,
  Check,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { Task, PriorityLevel } from '../types.ts';
import { TaskApiService, ParsedVoiceTask } from '../services/api.ts';

interface VoiceCaptureModalProps {
  onAddTasks: (tasks: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onClose: () => void;
}

const VOICE_PRESETS = [
  {
    label: 'Critical AP Renewal Blocker',
    text: 'We immediately need to resolve the Nordic Telecom AP deal blocker and send the updated ISO security clauses before 5 PM today, this is critical!',
  },
  {
    label: 'Urgent EMEA Team Escalation',
    text: 'Please retrieve the EMEA team contacts ASAP and schedule an urgent call with Klaus Weber to check Frankfurt cluster webhook latency.',
  },
  {
    label: 'Operational Backlog Task',
    text: 'Update the quarterly documentation for developer onboarding next sprint, low priority whenever there is spare time.',
  },
];

export const VoiceCaptureModal: React.FC<VoiceCaptureModalProps> = ({ onAddTasks, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedVoiceTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [urgencyDetected, setUrgencyDetected] = useState<string[]>([]);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          setTranscript(current.trim());
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone permission was denied. You can also paste or choose a voice preset.');
          }
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    setError(null);
    setAddedSuccess(false);

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsRecording(false);
    } else {
      if (!recognitionRef.current) {
        setError('Browser microphone speech recognition is not natively supported in this browser. Please use the Voice Presets or type below.');
        return;
      }
      try {
        setTranscript('');
        setParsedTasks([]);
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error('Failed to start microphone:', err);
        setError('Could not access microphone: ' + (err.message || 'Check browser permissions'));
        setIsRecording(false);
      }
    }
  };

  const handleProcessTranscript = async (textToProcess?: string) => {
    const text = textToProcess || transcript;
    if (!text.trim()) {
      setError('Please record audio or enter a spoken sentence first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setAddedSuccess(false);

    try {
      const response = await TaskApiService.parseVoiceTranscript(text);
      setParsedTasks(response.tasks || []);

      // Gather detected urgency words across tasks
      const allWords = new Set<string>();
      (response.tasks || []).forEach((t) => {
        t.urgencyKeywordsDetected?.forEach((w) => allWords.add(w));
      });
      setUrgencyDetected(Array.from(allWords));
    } catch (err: any) {
      console.error('Failed to parse voice transcript:', err);
      setError(err.message || 'Failed to analyze voice input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPreset = (presetText: string) => {
    setTranscript(presetText);
    handleProcessTranscript(presetText);
  };

  const handleAddAllTasks = () => {
    if (parsedTasks.length === 0) return;

    const mapped = parsedTasks.map((t) => ({
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: 'To Do' as const,
      category: t.category,
      dueDate: t.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      dueTime: t.dueTime,
      source: 'voice' as const,
      urgencyKeywords: t.urgencyKeywordsDetected,
    }));

    onAddTasks(mapped);
    setAddedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700/80 rounded-lg p-4 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800/80">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Voice Task Capture</h3>
            <p className="text-[11px] text-zinc-400">Audio Parser & Urgency Word Detection</p>
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

      {/* Interactive Pulsing Microphone Interface */}
      <div className="flex flex-col items-center justify-center py-4 bg-zinc-950/70 border border-zinc-800/70 rounded-lg relative overflow-hidden">
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-32 h-32 rounded-full bg-red-500/10 animate-ping" />
            <span className="w-24 h-24 rounded-full bg-red-500/20 animate-pulse" />
          </div>
        )}

        <button
          type="button"
          onClick={toggleRecording}
          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
            isRecording
              ? 'bg-rose-600 text-white shadow-rose-600/50 scale-105 animate-pulse'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
          }`}
          title={isRecording ? 'Click to stop recording' : 'Click to start voice recording'}
        >
          {isRecording ? <Mic className="w-7 h-7" /> : <Mic className="w-7 h-7 text-zinc-300" />}
        </button>

        <div className="mt-3 text-center">
          <p className="text-xs font-medium text-zinc-200">
            {isRecording ? 'Listening... Speak your task naturally' : 'Click microphone to record voice'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Auto-detects urgency: <span className="text-zinc-400 font-mono">immediately, ASAP, urgent, critical, emergency</span>
          </p>
        </div>
      </div>

      {/* Voice Presets / Quick Test Actions */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5 flex items-center gap-1">
          <Volume2 className="w-3 h-3" />
          <span>Quick Voice Samples (Simulate Speech)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VOICE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p.text)}
              className="text-left text-xs bg-zinc-950 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spoken Transcript Input & AI Trigger */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
          Spoken Transcript
        </label>
        <textarea
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Spoken words will appear here in real time, or you can paste a spoken prompt..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none font-mono"
        />
        <div className="flex items-center justify-between mt-2">
          {transcript && (
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                setParsedTasks([]);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            disabled={!transcript.trim() || isProcessing}
            onClick={() => handleProcessTranscript()}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting Tasks...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse Voice Tasks</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Extracted Tasks Preview */}
      {parsedTasks.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <span>Extracted Action Items ({parsedTasks.length})</span>
              {urgencyDetected.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950/80 text-red-400 border border-red-800/80">
                  <Flame className="w-2.5 h-2.5" />
                  Urgency: {urgencyDetected.join(', ')}
                </span>
              )}
            </h4>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {parsedTasks.map((task, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-zinc-950/90 border border-zinc-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-100">{task.title}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                      task.priority === 'Critical'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : task.priority === 'High'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-sky-950 text-sky-400 border border-sky-800'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px]">{task.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span>Category: {task.category}</span>
                  {task.dueTime && <span>Time: {task.dueTime}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddAllTasks}
              disabled={addedSuccess}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
            >
              {addedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tasks Added to Your List!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Approved Tasks to Main List ({parsedTasks.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
