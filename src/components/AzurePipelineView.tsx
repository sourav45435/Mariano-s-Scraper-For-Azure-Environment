/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Cloud, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ShieldAlert, 
  Database, 
  Play, 
  RotateCcw,
  Layers,
  Lock,
  Archive,
  AlertTriangle
} from 'lucide-react';

export const AzurePipelineView: React.FC = () => {
  const [simulationMode, setSimulationMode] = useState<'healthy' | 'silent_blocked' | 'abnormally_thin'>('healthy');

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Cloud className="w-4 h-4" />
          Atomic Dataset Promotion Architecture
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Safe Staging, Quarantine & Atomic Azure Blob Promotion
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          <strong>Non-Negotiable Rule:</strong> Never overwrite the last successful dataset with an empty, partial, or corrupted run.
          All crawlers output exclusively into isolated staging containers. The atomic promotion gatekeeper evaluates 5 mathematical and heuristic criteria before promoting to <code className="text-cyan-300 font-mono">production/latest_00531.json</code>.
        </p>

        {/* Interactive Simulation Switcher */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Test Pipeline Safety Guard:</span>
          <button
            onClick={() => setSimulationMode('healthy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulationMode === 'healthy'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Scenario 1: Healthy Full Run (550 Items)
          </button>
          <button
            onClick={() => setSimulationMode('silent_blocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulationMode === 'silent_blocked'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Scenario 2: Silent Block (Missing Canaries)
          </button>
          <button
            onClick={() => setSimulationMode('abnormally_thin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulationMode === 'abnormally_thin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Scenario 3: Abnormally Thin (120 Items)
          </button>
        </div>
      </div>

      {/* Visual Pipeline Flow Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Azure Storage Promotion State Machine</span>
          <span className="text-xs font-mono text-slate-400">
            Active Mode: <strong className="text-white capitalize">{simulationMode.replace('_', ' ')}</strong>
          </span>
        </h3>

        {/* Horizontal Flow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">STAGE 1</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Crawler</span>
            </div>
            <h4 className="text-xs font-bold text-white">Azure Container Job</h4>
            <p className="text-[11px] text-slate-400">
              Scrapes Mariano's with pinned store session (<code className="text-slate-300">kds-store-id=00531</code>).
            </p>
            <div className="p-2 rounded bg-slate-900 text-[10px] font-mono text-slate-300">
              Yield: {simulationMode === 'healthy' ? '550 records' : simulationMode === 'silent_blocked' ? '410 records' : '120 records'}
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">STAGE 2</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Isolated Blob</span>
            </div>
            <h4 className="text-xs font-bold text-white">Staging Container</h4>
            <p className="text-[11px] text-slate-400">
              Writes to <code className="text-cyan-300 font-mono">staging/run_20261017.json</code>.
            </p>
            <div className="p-2 rounded bg-slate-900 text-[10px] font-mono text-cyan-400">
              Status: Staged (Pending Audit)
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-xl border space-y-2 transition-all ${
            simulationMode === 'healthy' 
              ? 'bg-slate-950 border-emerald-500/40' 
              : 'bg-red-950/20 border-red-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">STAGE 3</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Gatekeeper</span>
            </div>
            <h4 className="text-xs font-bold text-white">Promotion Gatekeeper</h4>
            <p className="text-[11px] text-slate-400">
              Evaluates 5 validation criteria before touching production.
            </p>
            <div className={`p-2 rounded text-[10px] font-mono font-bold ${
              simulationMode === 'healthy' 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {simulationMode === 'healthy' ? 'PASSED: All 5 Gates Cleared' : 'REJECTED: Safety Breach Detected'}
            </div>
          </div>

          {/* Step 4 */}
          <div className={`p-4 rounded-xl border space-y-2 transition-all ${
            simulationMode === 'healthy' 
              ? 'bg-emerald-950/20 border-emerald-500/50' 
              : 'bg-red-950/20 border-red-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">STAGE 4</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Target Destination</span>
            </div>
            <h4 className="text-xs font-bold text-white">
              {simulationMode === 'healthy' ? 'Production Promotion' : 'Quarantine Diversion'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {simulationMode === 'healthy' 
                ? 'Atomic copy to production/latest_00531.json & archive.' 
                : 'Moved to quarantine/rejected.json. Production untouched!'}
            </p>
            <div className={`p-2 rounded text-[10px] font-mono font-bold ${
              simulationMode === 'healthy' 
                ? 'bg-emerald-500/10 text-emerald-300' 
                : 'bg-amber-500/10 text-amber-300'
            }`}>
              {simulationMode === 'healthy' ? 'production/latest_00531.json' : 'Existing Prod Preserved Intact'}
            </div>
          </div>
        </div>

        {/* Detailed Decision Table for Active Scenario */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Automated Safety Gate Audit Breakdown</span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
              simulationMode === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              Decision: {simulationMode === 'healthy' ? 'PROCEED WITH PROMOTION' : 'HALT & QUARANTINE'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {/* Gate 1 */}
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Gate 1: Minimum Record Count (&ge; 500)</span>
                <p className="text-[11px] text-slate-400">Contest threshold: at least 500 valid records.</p>
              </div>
              <div className="text-right">
                {simulationMode === 'abnormally_thin' ? (
                  <span className="text-red-400 font-mono font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> FAILED (120 &lt; 500)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PASSED ({simulationMode === 'healthy' ? '550' : '410'} &ge; 500)
                  </span>
                )}
              </div>
            </div>

            {/* Gate 2 */}
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Gate 2: Canary Staple SKUs Present</span>
                <p className="text-[11px] text-slate-400">Milk, Avocado, Banana, Chicken, Eggs, Bread check.</p>
              </div>
              <div className="text-right">
                {simulationMode === 'silent_blocked' ? (
                  <span className="text-red-400 font-mono font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> FAILED (Milk, Bread missing - Silent Block)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PASSED (All 6 staples confirmed)
                  </span>
                )}
              </div>
            </div>

            {/* Gate 3 */}
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Gate 3: Abnormally Thin Results Threshold</span>
                <p className="text-[11px] text-slate-400">Yield drop &lt; 30% against historical store baseline.</p>
              </div>
              <div className="text-right">
                {simulationMode === 'abnormally_thin' ? (
                  <span className="text-red-400 font-mono font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> FAILED (-76% drop vs baseline)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PASSED (Normal yield)
                  </span>
                )}
              </div>
            </div>

            {/* Gate 4 */}
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Gate 4: Store Location & Division Code</span>
                <p className="text-[11px] text-slate-400">Pinned to Store #00531, Division 705, ZIP 60657.</p>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED (Confirmed #00531)
                </span>
              </div>
            </div>

            {/* Gate 5 */}
            <div className="py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Gate 5: Strict 22-Field Ordering & Zero Nulls</span>
                <p className="text-[11px] text-slate-400">Key order match + gupc="" + unit_price="".</p>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED (100% Schema Valid)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
