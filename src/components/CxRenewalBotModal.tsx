import React, { useState } from 'react';
import { Bot, DollarSign, Calendar, AlertTriangle, CheckCircle2, Plus, X, Search } from 'lucide-react';
import { AP_LINKED_DEALS } from '../data/mockMeetings.ts';
import { APDeal, PriorityLevel } from '../types.ts';

interface CxRenewalBotModalProps {
  onClose: () => void;
  onCreateTaskForDeal: (deal: APDeal) => void;
}

export const CxRenewalBotModal: React.FC<CxRenewalBotModalProps> = ({
  onClose,
  onCreateTaskForDeal,
}) => {
  const [filterHealth, setFilterHealth] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filteredDeals = AP_LINKED_DEALS.filter((d) => {
    const matchesSearch =
      d.dealName.toLowerCase().includes(search.toLowerCase()) ||
      d.accountPartner.toLowerCase().includes(search.toLowerCase());
    const matchesHealth = filterHealth === 'All' || d.health === filterHealth;
    return matchesSearch && matchesHealth;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700/80 rounded-lg p-4 space-y-3.5 shadow-2xl">
      {/* Bot Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-zinc-100">CX Renewal Bot</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/60 font-mono">
                Active Integration
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Quick-Action: Track Deals Linked to APs</p>
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

      {/* Filter & Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AP deals by customer name or Account Partner..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {['All', 'Critical Risk', 'At Risk', 'On Track'].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setFilterHealth(h)}
              className={`text-[10px] px-2 py-0.5 rounded whitespace-nowrap transition-colors border ${
                filterHealth === h
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800 font-medium'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Deals List */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {filteredDeals.map((deal) => {
          let badgeClass = 'bg-zinc-900 text-zinc-400 border-zinc-800';
          if (deal.health === 'Critical Risk') badgeClass = 'bg-red-950/80 text-red-400 border border-red-800/80';
          if (deal.health === 'At Risk') badgeClass = 'bg-amber-950/80 text-amber-400 border border-amber-800/80';
          if (deal.health === 'On Track') badgeClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80';

          return (
            <div
              key={deal.id}
              className="p-3 rounded bg-zinc-950/80 border border-zinc-800/80 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-zinc-100">{deal.dealName}</h4>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${badgeClass}`}>
                      {deal.health}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Account Partner: <span className="text-zinc-300 font-medium">{deal.accountPartner}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateTaskForDeal(deal)}
                  className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-amber-950/80 text-zinc-200 hover:text-amber-300 border border-zinc-700/80 rounded text-[11px] font-medium transition-colors shrink-0"
                  title="Create an AP renewal task linked to this deal"
                >
                  <Plus className="w-3 h-3" />
                  <span>Renewal Task</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-900 text-[11px] font-mono tabular-nums">
                <div className="flex items-center gap-1 text-zinc-300">
                  <DollarSign className="w-3 h-3 text-amber-400" />
                  <span>ARR: {formatCurrency(deal.arrValue)}</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400 justify-end">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  <span>Renewal: {deal.renewalDate}</span>
                </div>
              </div>

              {deal.keyContacts && deal.keyContacts.length > 0 && (
                <div className="text-[10px] text-zinc-500 truncate">
                  Stakeholders: {deal.keyContacts.join(' · ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
