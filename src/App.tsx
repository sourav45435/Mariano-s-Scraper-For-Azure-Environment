/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Navbar, type NavTab } from './components/Navbar.tsx';
import { ContestSubmissionView } from './components/ContestSubmissionView.tsx';
import { DataExplorerView } from './components/DataExplorerView.tsx';
import { DealsMatrixView } from './components/DealsMatrixView.tsx';
import { QualityAuditView } from './components/QualityAuditView.tsx';
import { AzurePipelineView } from './components/AzurePipelineView.tsx';
import { SourceCodeHubView } from './components/SourceCodeHubView.tsx';
import { CostEstimatorView } from './components/CostEstimatorView.tsx';
import { LiveRunnerView } from './components/LiveRunnerView.tsx';
import { generateFullMarianosDataset } from './data/marianosCatalogData.ts';
import { 
  auditDataset, 
  serializeStrictJson, 
  REQUIRED_FIELDS_ORDER, 
  type MarianosProductRecord 
} from './utils/marianosLogic.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('contest-entry');
  const [records, setRecords] = useState<MarianosProductRecord[]>(() => generateFullMarianosDataset());

  // Compute dataset audit & promotion gate
  const audit = useMemo(() => {
    return auditDataset(records);
  }, [records]);

  // Export strict 22-field JSON
  const handleExportJson = () => {
    const jsonString = serializeStrictJson(records);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marianos_store00531_lakeview_production_${records[0]?.crawl_date || '2026-10-17'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export clean CSV with strict 22-column header
  const handleExportCsv = () => {
    const header = REQUIRED_FIELDS_ORDER.join(',');
    const rows = records.map(r => {
      return REQUIRED_FIELDS_ORDER.map(field => {
        const val = String(r[field] ?? '');
        // Escape quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marianos_store00531_lakeview_production_${records[0]?.crawl_date || '2026-10-17'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        recordCount={records.length}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'contest-entry' && (
          <ContestSubmissionView
            records={records}
            audit={audit}
            onNavigateToTab={setActiveTab}
            onExportJson={handleExportJson}
          />
        )}

        {activeTab === 'catalog-explorer' && (
          <DataExplorerView
            records={records}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'deals-ppm' && (
          <DealsMatrixView records={records} />
        )}

        {activeTab === 'canary-sentinel' && (
          <QualityAuditView audit={audit} records={records} />
        )}

        {activeTab === 'azure-pipeline' && (
          <AzurePipelineView />
        )}

        {activeTab === 'source-code' && (
          <SourceCodeHubView />
        )}

        {activeTab === 'cost-economics' && (
          <CostEstimatorView />
        )}

        {activeTab === 'live-runner' && (
          <LiveRunnerView
            onRunComplete={(newRecs) => {
              if (newRecs && newRecs.length > 0) {
                setRecords(newRecs);
              }
            }}
          />
        )}
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Mariano's Azure Production Scraper</span>
            <span>•</span>
            <span>Kroger Banner Division 705</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Store #00531 Pinned</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Twice-Weekly Azure Container Job: <code className="text-emerald-400 font-mono">0 2 * * 2,5</code></span>
            <span>•</span>
            <span>22-Field Contract Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
