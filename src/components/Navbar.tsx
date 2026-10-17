/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, ShieldCheck, Cloud, Play, FileJson, Award, Sliders, ExternalLink } from 'lucide-react';

export type NavTab = 
  | 'contest-entry'
  | 'catalog-explorer'
  | 'deals-ppm'
  | 'canary-sentinel'
  | 'azure-pipeline'
  | 'source-code'
  | 'cost-economics'
  | 'live-runner';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  recordCount: number;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  recordCount,
  onExportJson,
  onExportCsv,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'contest-entry', label: 'Contest Submission (1-10)', icon: <Award className="w-4 h-4" />, badge: 'Official' },
    { id: 'catalog-explorer', label: 'Data Explorer (22 Fields)', icon: <Database className="w-4 h-4" />, badge: `${recordCount}` },
    { id: 'deals-ppm', label: 'Deals & PPM Matrix', icon: <Sliders className="w-4 h-4" /> },
    { id: 'canary-sentinel', label: 'Silent Blocking & Canaries', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'azure-pipeline', label: 'Atomic Azure Promotion', icon: <Cloud className="w-4 h-4" /> },
    { id: 'source-code', label: 'Code & Azure Bicep', icon: <FileJson className="w-4 h-4" /> },
    { id: 'cost-economics', label: 'Monthly Azure Cost', icon: <ExternalLink className="w-4 h-4" /> },
    { id: 'live-runner', label: 'Live Test Runner', icon: <Play className="w-4 h-4" />, badge: 'Sim' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Banner Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-950/40 shrink-0">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight">M</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-white text-sm sm:text-base tracking-tight truncate">MARIANO'S</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  Azure Scraper
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 truncate">
                <span className="truncate">Store #00531</span>
                <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="text-emerald-400 font-medium truncate">Div 705 Verified</span>
              </p>
            </div>
          </div>

          {/* Quick Export Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onExportJson}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              title="Download strict 22-field JSON file"
            >
              <FileJson className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Export JSON ({recordCount})</span>
              <span className="sm:hidden">JSON</span>
            </button>
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/40 transition-colors cursor-pointer"
              title="Download clean CSV format"
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-1" aria-label="Tabs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
