/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  Tag, 
  Smartphone, 
  Coins, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import type { MarianosProductRecord } from '../utils/marianosLogic.ts';

interface DealsMatrixViewProps {
  records: MarianosProductRecord[];
}

export const DealsMatrixView: React.FC<DealsMatrixViewProps> = ({ records }) => {
  const [activeTab, setActiveTab] = useState<'volume' | 'digital' | 'ppm' | 'regular'>('volume');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Segregate samples
  const volumeDeals = records.filter(r => r.volume_deals_description);
  const digitalDeals = records.filter(r => r.digital_deals_description);
  const ppmItems = records.filter(r => r.ppm);
  const regularItems = records.filter(r => !r.sale_price && !r.volume_deals_description && !r.digital_deals_description);

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sliders className="w-4 h-4" />
          Retailer Deals & Pricing Engine
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Strict Separation of Volume vs. Digital Deals & Verbatim PPM
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          The scraper preserves Mariano's exact promotional mechanics without hallucinating prices.
          Volume deals (e.g. BOGO, 2 for $5) are strictly decoupled from digital coupons requiring activation.
          PPM is scraped verbatim directly from the shelf tag, while <code className="text-indigo-300 font-mono">unit_price</code> and <code className="text-indigo-300 font-mono">gupc</code> are returned strictly as empty strings for downstream pipeline computation.
        </p>

        {/* 4 Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          <button
            onClick={() => setActiveTab('volume')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'volume'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Volume Deals ({volumeDeals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('digital')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'digital'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span>Digital Coupons ({digitalDeals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ppm')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ppm'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verbatim PPM ({ppmItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('regular')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'regular'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Standard Regular Items ({regularItems.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'volume' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              Volume Deals Specification (No Clipping Required)
            </h3>
            <p>
              Applies to quantity bundles and BOGO offers: "2 for $5", "3 for $10", "Buy 1, Get 1 Free", "Mix or Match 5 for $10".
              Terms are stored in <code className="text-amber-400 font-mono">volume_deals_description</code>.
              When Mariano's displays a total promotional price, it is stored in <code className="text-amber-400 font-mono">volume_deals_price</code>.
              For BOGO offers where no price is displayed, the scraper <strong>does not invent a calculated price</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {volumeDeals.slice(0, 12).map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-amber-500/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-mono">{item.category} &gt; {item.sub_category}</span>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{item.product_title}</h4>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap">
                    {item.volume_deals_description}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">regular_price</span>
                    <span className="text-slate-300">${item.regular_price}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">volume_deals_price</span>
                    <span className="text-amber-400 font-bold">{item.volume_deals_price ? `$${item.volume_deals_price}` : '"" (None displayed)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ppm</span>
                    <span className="text-cyan-300">{item.ppm || '""'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'digital' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              Digital Deals Specification (Requires Customer Clip/Activation)
            </h3>
            <p>
              Digital coupons require account login or app clipping: "Clip Coupon: Save $2.00", "$3.99 each with Digital Coupon", "Save $5 when you buy 5 with Digital Coupon".
              Terms are preserved in <code className="text-purple-400 font-mono">digital_deals_description</code>.
              When Mariano's displays the final promotional price, it is stored in <code className="text-purple-400 font-mono">digital_deals_price</code>; if only "Save $1" is stated, the description is preserved without fabricating a price.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {digitalDeals.slice(0, 12).map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-mono">{item.category} &gt; {item.sub_category}</span>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{item.product_title}</h4>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 whitespace-nowrap">
                    {item.digital_deals_description}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">regular_price</span>
                    <span className="text-slate-300">${item.regular_price}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">digital_deals_price</span>
                    <span className="text-purple-300 font-bold">{item.digital_deals_price ? `$${item.digital_deals_price}` : '"" (Savings only)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">sale_price</span>
                    <span className="text-emerald-400">{item.sale_price ? `$${item.sale_price}` : '""'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ppm' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              PPM & Downstream Placeholders Specification
            </h3>
            <p>
              <strong>PPM (Price Per Measure):</strong> Must be scraped verbatim from Mariano's UI including unit ($0.25/oz, $3.99/lb, $0.18/fl oz, $0.50/ct).
              Never calculate or estimate missing PPM.
              <strong>unit_price & gupc:</strong> Calculated downstream by ingestion pipeline. The scraper MUST return both as empty strings (<code className="text-cyan-400 font-mono">""</code>).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ppmItems.slice(0, 12).map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-mono">{item.category} &gt; {item.sub_category}</span>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{item.product_title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">Weight: {item.weight}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 block">
                      {item.ppm}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">scraped verbatim</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-500 block">upc</span>
                    <span className="text-slate-300 truncate">{item.upc}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">gupc</span>
                    <span className="text-slate-500 italic">"" (downstream)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">unit_price</span>
                    <span className="text-slate-500 italic">"" (downstream)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">crawl_date</span>
                    <span className="text-slate-400">{item.crawl_date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'regular' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Standard Items (Without Active Deals)
            </h3>
            <p>
              For standard items, all promotional columns are returned cleanly as empty strings (<code className="text-slate-400 font-mono">""</code>), never nulls.
              The regular shelf price is strictly normalized to decimal format.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regularItems.slice(0, 12).map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-mono">{item.category} &gt; {item.sub_category}</span>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{item.product_title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">Weight: {item.weight}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                    ${item.regular_price}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-500 block">sale_price</span>
                    <span className="text-slate-500 italic">""</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">volume_deals</span>
                    <span className="text-slate-500 italic">""</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">digital_deals</span>
                    <span className="text-slate-500 italic">""</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
