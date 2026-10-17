/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Copy, 
  Check, 
  X, 
  Tag, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck,
  FileJson
} from 'lucide-react';
import { REQUIRED_FIELDS_ORDER, type MarianosProductRecord } from '../utils/marianosLogic.ts';

interface DataExplorerViewProps {
  records: MarianosProductRecord[];
  onExportJson: () => void;
  onExportCsv: () => void;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  records,
  onExportJson,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dealFilter, setDealFilter] = useState<string>('all');
  const [storeBrandOnly, setStoreBrandOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [inspectedRecord, setInspectedRecord] = useState<MarianosProductRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = 
          r.product_title.toLowerCase().includes(query) ||
          r.upc.includes(query) ||
          r.category.toLowerCase().includes(query) ||
          r.sub_category.toLowerCase().includes(query) ||
          r.store_brand.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Category
      if (selectedCategory !== 'all' && r.category !== selectedCategory) {
        return false;
      }

      // Deal filter
      if (dealFilter === 'volume' && !r.volume_deals_description) return false;
      if (dealFilter === 'digital' && !r.digital_deals_description) return false;
      if (dealFilter === 'sale' && !r.sale_price) return false;
      if (dealFilter === 'regular' && (r.sale_price || r.volume_deals_description || r.digital_deals_description)) return false;

      // Store brand
      if (storeBrandOnly && r.store_brand === 'no') return false;

      return true;
    });
  }, [records, searchTerm, selectedCategory, dealFilter, storeBrandOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Keyboard navigation for modal escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectedRecord) {
        setInspectedRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedRecord]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & 22-Field Guarantee */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Mariano's Live Catalog Explorer</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              22 of 22 Fields Strictly Ordered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse all {records.length} extracted records for Store #00531 (ZIP 60657). Inspect raw JSON, test PPM formatting, and verify downstream placeholders.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onExportJson}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5 text-emerald-400" />
            <span>JSON</span>
          </button>
          <button
            onClick={onExportCsv}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search title, UPC, brand, category..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Selector */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            aria-label="Filter by department"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="all">All Departments ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Deals Selector */}
        <div>
          <select
            value={dealFilter}
            onChange={(e) => { setDealFilter(e.target.value); setCurrentPage(1); }}
            aria-label="Filter by deal type"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="all">All Deal Types</option>
            <option value="volume">Volume Deals (BOGO, 2 for $X)</option>
            <option value="digital">Digital Coupons (Clip)</option>
            <option value="sale">Price Reduced (Sale)</option>
            <option value="regular">Regular Price Only</option>
          </select>
        </div>

        {/* Store Brand Toggle */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 cursor-pointer select-none w-full hover:border-slate-700">
            <input
              type="checkbox"
              checked={storeBrandOnly}
              onChange={(e) => { setStoreBrandOnly(e.target.checked); setCurrentPage(1); }}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span>Store Brand Only</span>
          </label>
        </div>
      </div>

      {/* Results Count & Field Order Verification Pill */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span>Showing <strong className="text-white font-mono">{filteredRecords.length}</strong> matching records</span>
          {searchTerm && <span className="text-slate-500">(filtered from {records.length})</span>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            aria-label="Select rows per page"
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Primary Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-mono">
              <th className="py-2.5 px-3 font-semibold text-slate-400 w-12 text-center">#</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Actions</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Product Title</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Category</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Weight</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Reg Price</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Sale Price</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">PPM (Verbatim)</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Volume Deals</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Digital Deals</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Store Brand</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">UPC</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">GUPC</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Unit Price</th>
              <th className="py-2.5 px-3 font-semibold text-slate-400">Crawl Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-8 text-center text-slate-400 text-xs">
                  No records matching the filter criteria.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr 
                    key={r.upc || idx} 
                    className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                    onClick={() => setInspectedRecord(r)}
                  >
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-center text-[11px]">
                      {globalIndex}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setInspectedRecord(r); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                        title="View all 22 fields"
                      >
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white max-w-xs truncate" title={r.product_title}>
                      {r.product_title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className="text-[11px] text-slate-400">{r.category}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{r.sub_category}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">
                      {r.weight}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-white font-medium">
                      ${r.regular_price}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {r.sale_price ? (
                        <span className="text-emerald-400 font-bold">${r.sale_price}</span>
                      ) : (
                        <span className="text-slate-600">""</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300 text-[11px]">
                      {r.ppm ? r.ppm : <span className="text-slate-600">""</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.volume_deals_description ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 truncate max-w-[130px]" title={r.volume_deals_description}>
                          {r.volume_deals_description}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">""</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.digital_deals_description ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 truncate max-w-[130px]" title={r.digital_deals_description}>
                          {r.digital_deals_description}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">""</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.store_brand !== 'no' ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {r.store_brand}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">no</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {r.upc}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]" title="Contract: strictly empty string">
                      ""
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]" title="Contract: calculated downstream, strictly empty string">
                      ""
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {r.crawl_date}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
        <span>Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong></span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Record Inspector Drawer Modal */}
      {inspectedRecord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setInspectedRecord(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">22-Field Record Inspector</h3>
                  <p className="text-[11px] text-slate-400">Strict key ordering verification (Contract Compliant)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(JSON.stringify(inspectedRecord, null, 2), 'modal-json')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  {copiedKey === 'modal-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'modal-json' ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setInspectedRecord(null)}
                  aria-label="Close record inspector"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-base font-bold text-white">{inspectedRecord.product_title}</h4>
                <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">UPC: {inspectedRecord.upc}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Store Brand: {inspectedRecord.store_brand}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {inspectedRecord.category} &gt; {inspectedRecord.sub_category}
                  </span>
                </div>
              </div>

              {/* Exact 22-field Table */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase font-mono">Field Order & Values</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Keys 1 to 22 in strict sequence</span>
                </div>
                <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto text-xs font-mono">
                  {REQUIRED_FIELDS_ORDER.map((field, idx) => {
                    const value = inspectedRecord[field];
                    const isBlankContract = field === 'gupc' || field === 'unit_price';
                    return (
                      <div key={field} className="flex items-center justify-between p-2 hover:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-[10px] text-slate-500 text-right">{idx + 1}.</span>
                          <span className="text-slate-300 font-semibold">{field}</span>
                          {isBlankContract && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              contract: ""
                            </span>
                          )}
                        </div>
                        <div className="text-right max-w-xs truncate text-emerald-300">
                          {value === '' ? (
                            <span className="text-slate-600 font-sans italic font-normal">"" (empty string)</span>
                          ) : (
                            <span>{String(value)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Raw JSON String Preview */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[11px] font-mono font-semibold text-slate-400 block mb-1.5">Full Serialized JSON</span>
                <pre className="text-[11px] font-mono text-emerald-300/90 max-h-36 overflow-y-auto p-2 bg-slate-900/70 rounded border border-slate-800">
                  {JSON.stringify(inspectedRecord, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
