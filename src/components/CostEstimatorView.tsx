/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DollarSign, Calculator, Server, Wifi, Database, Info, Layers } from 'lucide-react';

export const CostEstimatorView: React.FC = () => {
  const [storeCount, setStoreCount] = useState<number>(1);
  const [runsPerWeek, setRunsPerWeek] = useState<number>(2); // Required: twice per week
  const [runDurationMin, setRunDurationMin] = useState<number>(15);
  const [proxyCostPerGb, setProxyCostPerGb] = useState<number>(10.0);

  // Math calculation
  const calculations = useMemo(() => {
    const monthlyRunsPerStore = runsPerWeek * 4.33; // ~8.66 to 9 runs/mo
    const totalMonthlyRuns = monthlyRunsPerStore * storeCount;
    
    // Azure Container Apps (1.0 vCPU, 2.0 GiB RAM)
    const runSeconds = runDurationMin * 60;
    const totalVcpuSeconds = totalMonthlyRuns * runSeconds * 1.0;
    const totalGibSeconds = totalMonthlyRuns * runSeconds * 2.0;

    // Rates in Azure East US / Central US
    const vcpuCost = totalVcpuSeconds * 0.000024;
    const ramCost = totalGibSeconds * 0.000003;
    const acaComputeCost = vcpuCost + ramCost;

    // Azure Blob Storage (Hot tier storage + read/write operations)
    // ~15 MB per crawl JSON output + snapshots
    const storageGb = (totalMonthlyRuns * 0.015) + 5; // buffer
    const blobStorageCost = (storageGb * 0.018) + (totalMonthlyRuns * 0.005);

    // Proxy Bandwidth (~150 MB per run with headless image blocking)
    const bandwidthGb = (totalMonthlyRuns * 0.15);
    const proxyCost = bandwidthGb * proxyCostPerGb;

    // Azure Fixed Buffer (NAT Gateway / Key Vault transactions)
    const azureFixedCost = storeCount > 0 ? 17.70 : 0; // standard egress NAT allocation

    const totalMonthly = acaComputeCost + blobStorageCost + proxyCost + azureFixedCost;
    const costPerStore = storeCount > 0 ? totalMonthly / storeCount : 0;
    const costPerRun = totalMonthlyRuns > 0 ? totalMonthly / totalMonthlyRuns : 0;

    return {
      totalMonthlyRuns: Math.round(totalMonthlyRuns),
      acaComputeCost,
      blobStorageCost,
      proxyCost,
      azureFixedCost,
      totalMonthly,
      costPerStore,
      costPerRun,
      bandwidthGb: Math.round(bandwidthGb * 10) / 10
    };
  }, [storeCount, runsPerWeek, runDurationMin, proxyCostPerGb]);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Calculator className="w-4 h-4" />
          Financial Architecture & Azure Operational Cost
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Estimated Monthly Operating Cost Calculator (Item 9)
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          The scraper utilizes a 100% serverless compute model in Azure Container Apps.
          Zero idle server charges: compute charges accrue exclusively during active crawl execution.
          Below is the granular monthly breakdown based on twice-weekly scheduling.
        </p>

        {/* Big Cost Callout */}
        <div className="mt-6 flex flex-wrap items-baseline gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Estimated Monthly Cost</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                ${calculations.totalMonthly.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-800 hidden sm:block"></div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Cost Per Store Location</span>
            <p className="text-xl font-bold text-white font-mono mt-1">
              ${calculations.costPerStore.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ store / mo</span>
            </p>
          </div>

          <div className="h-8 w-[1px] bg-slate-800 hidden sm:block"></div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Cost Per Crawl Execution</span>
            <p className="text-xl font-bold text-white font-mono mt-1">
              ${calculations.costPerRun.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ run</span>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Configured Locations: <span className="text-emerald-400 font-mono font-bold">{storeCount} store</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={storeCount}
            onChange={(e) => setStoreCount(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500">Supports multi-store scaling</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Crawl Frequency: <span className="text-emerald-400 font-mono font-bold">{runsPerWeek}x per week</span>
          </label>
          <input
            type="range"
            min={1}
            max={7}
            value={runsPerWeek}
            onChange={(e) => setRunsPerWeek(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500">Twice weekly (Tue & Fri) per scope</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Avg Run Duration: <span className="text-emerald-400 font-mono font-bold">{runDurationMin} minutes</span>
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={runDurationMin}
            onChange={(e) => setRunDurationMin(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500">Includes pacing & canary checks</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Residential Proxy: <span className="text-emerald-400 font-mono font-bold">${proxyCostPerGb.toFixed(2)}/GB</span>
          </label>
          <input
            type="range"
            min={5}
            max={15}
            step={1}
            value={proxyCostPerGb}
            onChange={(e) => setProxyCostPerGb(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500">Pay-as-you-go pool rate</span>
        </div>
      </div>

      {/* Itemized Cost Breakdown Table */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          Itemized Monthly Cost Breakdown
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono">
                <th className="py-2.5 px-3 font-semibold">Service Category</th>
                <th className="py-2.5 px-3 font-semibold">Resource Allocation</th>
                <th className="py-2.5 px-3 font-semibold">Pricing Model</th>
                <th className="py-2.5 px-3 font-semibold text-right">Monthly Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-medium text-white">Azure Container Apps Job (Compute)</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">1.0 vCPU, 2.0 GiB RAM Serverless</td>
                <td className="py-2.5 px-3 text-slate-400">vCPU & Memory seconds</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                  ${calculations.acaComputeCost.toFixed(2)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-medium text-white">Azure Blob Storage (Hot Tier)</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">Staging, Production & Archive containers</td>
                <td className="py-2.5 px-3 text-slate-400">$0.018/GB-month + API writes</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                  ${calculations.blobStorageCost.toFixed(2)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-medium text-white">Residential Proxy Rotation (BrightData / Oxylabs)</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">{calculations.bandwidthGb} GB bandwidth</td>
                <td className="py-2.5 px-3 text-slate-400">${proxyCostPerGb.toFixed(2)}/GB pay-as-you-go</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                  ${calculations.proxyCost.toFixed(2)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-medium text-white">Azure Virtual Network NAT Gateway & Egress</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">Static outbound IP buffer & Key Vault</td>
                <td className="py-2.5 px-3 text-slate-400">Hourly standard resource</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                  ${calculations.azureFixedCost.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-slate-900/80 font-bold text-white">
                <td className="py-3 px-3">TOTAL ALL-INCLUSIVE MONTHLY COST</td>
                <td className="py-3 px-3 font-mono" colSpan={2}>
                  {calculations.totalMonthlyRuns} runs scheduled across {storeCount} store{storeCount > 1 ? 's' : ''}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm">
                  ${calculations.totalMonthly.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
