import React, { useState } from 'react';
import { Bot, Search, Mail, MapPin, Clock, Plus, Check, X } from 'lucide-react';
import { EMEA_TEAM_CONTACTS } from '../data/mockMeetings.ts';
import { EMEAContact, Task } from '../types.ts';

interface EmeaBotModalProps {
  onClose: () => void;
  onCreateTaskForContact: (contact: EMEAContact) => void;
}

export const EmeaBotModal: React.FC<EmeaBotModalProps> = ({
  onClose,
  onCreateTaskForContact,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const regions = ['All', 'United Kingdom', 'Germany', 'UAE', 'France', 'South Africa'];

  const filtered = EMEA_TEAM_CONTACTS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesRegion =
      selectedRegion === 'All' || c.region.toLowerCase().includes(selectedRegion.toLowerCase());
    return matchesSearch && matchesRegion;
  });

  const handleCopyEmail = (contact: EMEAContact) => {
    navigator.clipboard?.writeText(contact.email);
    setCopiedId(contact.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700/80 rounded-lg p-4 space-y-3.5 shadow-2xl">
      {/* Bot Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-zinc-100">EMEA Notification Bot</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                Active Integration
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Quick-Action: Retrieve Team Contacts</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Region Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search EMEA team directory by name, role, specialization..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {regions.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setSelectedRegion(reg)}
              className={`text-[10px] px-2 py-0.5 rounded whitespace-nowrap transition-colors border ${
                selectedRegion === reg
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 font-medium'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filtered.map((contact) => (
          <div
            key={contact.id}
            className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800/80 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-zinc-100">{contact.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      contact.onCallStatus === 'On Call'
                        ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                        : contact.onCallStatus === 'Available'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {contact.onCallStatus}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">{contact.role}</div>
              </div>

              {/* Action: Create Task for this Contact */}
              <button
                type="button"
                onClick={() => onCreateTaskForContact(contact)}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-emerald-900/60 text-zinc-200 hover:text-emerald-300 border border-zinc-700/80 rounded text-[11px] font-medium transition-colors shrink-0"
                title="Create a new task assigned to this contact"
              >
                <Plus className="w-3 h-3" />
                <span>Assign Task</span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 leading-tight">
              Focus: {contact.specialization}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono">
              <div className="flex items-center gap-1 text-zinc-400 truncate max-w-[190px]">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{contact.region}</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyEmail(contact)}
                className="flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors"
                title="Copy contact email address"
              >
                {copiedId === contact.id ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-2.5 h-2.5" />
                    <span>{contact.email.split('@')[0]}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
