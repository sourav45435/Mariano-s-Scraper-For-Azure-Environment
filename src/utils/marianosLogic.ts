/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mariano's Production Scraper Logic & Validation Core
 * Strictly enforces contest requirements, 22-field ordering, deals classification,
 * approximate-weight exclusion, store brand detection, and atomic promotion validation.
 */

export interface RawScrapedItem {
  zipcode?: string;
  store_name?: string;
  store_location?: string;
  store_logo?: string;
  store_brand?: string;
  category?: string;
  sub_category?: string;
  product_title?: string;
  weight?: string;
  regular_price?: string | number;
  sale_price?: string | number;
  raw_promo_badge?: string;
  raw_coupon_badge?: string;
  volume_deals_description?: string;
  volume_deals_price?: string | number;
  digital_deals_description?: string;
  digital_deals_price?: string | number;
  image_url?: string;
  url?: string;
  upc?: string;
  gupc?: string;
  ppm?: string;
  unit_price?: string;
  crawl_date?: string;
  brand?: string;
}

/**
 * The exact 22 required fields in the exact specified order:
 * zipcode; store_name; store_location; store_logo; store_brand; category; sub_category;
 * product_title; weight; regular_price; sale_price; volume_deals_description;
 * volume_deals_price; digital_deals_description; digital_deals_price; image_url;
 * url; upc; gupc; ppm; unit_price; crawl_date
 */
export const REQUIRED_FIELDS_ORDER = [
  'zipcode',
  'store_name',
  'store_location',
  'store_logo',
  'store_brand',
  'category',
  'sub_category',
  'product_title',
  'weight',
  'regular_price',
  'sale_price',
  'volume_deals_description',
  'volume_deals_price',
  'digital_deals_description',
  'digital_deals_price',
  'image_url',
  'url',
  'upc',
  'gupc',
  'ppm',
  'unit_price',
  'crawl_date'
] as const;

export type RequiredField = typeof REQUIRED_FIELDS_ORDER[number];

export interface MarianosProductRecord {
  zipcode: string;
  store_name: string;
  store_location: string;
  store_logo: string;
  store_brand: string;
  category: string;
  sub_category: string;
  product_title: string;
  weight: string;
  regular_price: string;
  sale_price: string;
  volume_deals_description: string;
  volume_deals_price: string;
  digital_deals_description: string;
  digital_deals_price: string;
  image_url: string;
  url: string;
  upc: string;
  gupc: string;
  ppm: string;
  unit_price: string;
  crawl_date: string;
}

/** Known Mariano's / Kroger private label brands */
export const STORE_BRANDS = [
  "mariano's",
  "marianos",
  "kroger",
  "simple truth",
  "simple truth organic",
  "private selection",
  "heritage farm",
  "comforts",
  "big k",
  "bloom haus",
  "smart way",
  "home sense",
  "hemisfares",
  "pet pride",
  "fresh fin",
  "roundy's",
  "roundys",
  "dip"
];

/**
 * DATA RULE: Exclude products whose weight contains “approx,” “approximately”
 * or equivalent approximate-weight wording.
 */
export function hasApproximateWeight(weightStr?: string): boolean {
  if (!weightStr) return false;
  const lower = weightStr.toLowerCase();
  const approxPatterns = [
    /\bapprox\b/,
    /\bapproximately\b/,
    /\bapprox\./,
    /\best\b/,
    /\bestimated\b/,
    /\babout\b/,
    /~\s*\d/,
    /\bvaries\b/,
    /\baverage\b/
  ];
  return approxPatterns.some(regex => regex.test(lower));
}

/**
 * DATA RULE: Identify store-brand products when possible; otherwise store_brand defaults to “no.”
 */
export function identifyStoreBrand(brand?: string, title?: string): string {
  const brandLower = (brand || '').toLowerCase().trim();
  const titleLower = (title || '').toLowerCase().trim();

  for (const sb of STORE_BRANDS) {
    if (brandLower === sb || brandLower.includes(sb) || titleLower.startsWith(sb + ' ') || titleLower.includes(' ' + sb + ' ')) {
      return sb.charAt(0).toUpperCase() + sb.slice(1);
    }
  }
  return 'no';
}

/**
 * Numeric price formatter: returns empty string if undefined/empty,
 * otherwise formatted as numeric string (e.g. "3.99", "0.25", "10.00").
 */
export function formatNumericPrice(priceVal?: string | number | null): string {
  if (priceVal === undefined || priceVal === null || priceVal === '') {
    return '';
  }
  if (typeof priceVal === 'number') {
    if (isNaN(priceVal) || priceVal <= 0) return '';
    return priceVal.toFixed(2);
  }
  const clean = String(priceVal).replace(/[$\s]/g, '').trim();
  if (!clean || clean.toLowerCase() === 'null') return '';
  const parsed = parseFloat(clean);
  if (isNaN(parsed) || parsed < 0) return '';
  return parsed.toFixed(2);
}

/**
 * DEALS RULE:
 * Distinguish volume deals from digital deals and preserve retailer's displayed wording and price.
 * 
 * Volume deal: Does NOT require clipping or activation.
 * Examples: "2 for $5", "3 for $10", "Buy 1, Get 1 Free", "Buy 2, Get 1 Free", "Mix or Match 5 for $10", "Save $5 when you buy 5", "Must buy 4 at $1.99 each".
 * 
 * Digital deal: Requires customer to clip, activate, save or add a digital coupon.
 * Examples: "Clip Coupon: Save $2", "$3.99 each with Digital Coupon", "Save $5 when you buy 5 with Digital Coupon", "20% off with clipped coupon".
 */
export function classifyDeals(item: {
  rawPromo?: string;
  rawCoupon?: string;
  explicitVolumeDesc?: string;
  explicitVolumePrice?: string | number;
  explicitDigitalDesc?: string;
  explicitDigitalPrice?: string | number;
}): {
  volume_deals_description: string;
  volume_deals_price: string;
  digital_deals_description: string;
  digital_deals_price: string;
} {
  let volumeDesc = item.explicitVolumeDesc || '';
  let volumePrice = formatNumericPrice(item.explicitVolumePrice);
  let digitalDesc = item.explicitDigitalDesc || '';
  let digitalPrice = formatNumericPrice(item.explicitDigitalPrice);

  const rawPromo = (item.rawPromo || '').trim();
  const rawCoupon = (item.rawCoupon || '').trim();

  // Process raw promo if explicit not provided
  if (!volumeDesc && rawPromo) {
    const isCoupon = /clip|digital|coupon|app only|account/i.test(rawPromo);
    if (isCoupon && !digitalDesc) {
      digitalDesc = rawPromo;
      const priceMatch = rawPromo.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*(?:each|with)/i);
      if (priceMatch && !digitalPrice) {
        digitalPrice = formatNumericPrice(priceMatch[1]);
      }
    } else {
      volumeDesc = rawPromo;
      // Check if price is displayed e.g. "2 for $5" -> 5.00, "Buy 2 at $1.99 each" -> 1.99
      const totalMatch = rawPromo.match(/(?:for\s*\$([0-9]+(?:\.[0-9]{2})?)|at\s*\$([0-9]+(?:\.[0-9]{2})?))/i);
      if (totalMatch && !volumePrice) {
        volumePrice = formatNumericPrice(totalMatch[1] || totalMatch[2]);
      }
    }
  }

  // Process raw coupon
  if (!digitalDesc && rawCoupon) {
    digitalDesc = rawCoupon;
    const priceMatch = rawCoupon.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*(?:each|with)/i);
    if (priceMatch && !digitalPrice) {
      digitalPrice = formatNumericPrice(priceMatch[1]);
    }
  }

  return {
    volume_deals_description: volumeDesc,
    volume_deals_price: volumePrice,
    digital_deals_description: digitalDesc,
    digital_deals_price: digitalPrice,
  };
}

/**
 * PPM RULE:
 * Price Per Measure, such as $0.25/oz, $0.18/fl oz, $3.99/lb or $0.50/ct.
 * PPM must be scraped directly from Mariano's, including displayed measurement unit.
 * Do not calculate, estimate or reconstruct missing PPM. If not displayed, return "".
 */
export function formatPPM(rawPpm?: string): string {
  if (!rawPpm) return '';
  const trimmed = rawPpm.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null') return '';
  // Ensure it has valid PPM format like $X.XX/unit
  return trimmed;
}

/**
 * Validates and transforms a raw scraped item into a strict 22-field product record.
 * Returns null if the product should be excluded (e.g. approximate weight).
 */
export function buildProductRecord(
  raw: RawScrapedItem,
  defaultStore = {
    zipcode: '60657',
    store_name: "Mariano's Lakeview East",
    store_location: '3030 N Broadway St, Chicago, IL 60657',
    store_logo: 'https://www.marianos.com/assets/brands/marianos/logo.svg'
  },
  defaultDate = new Date().toISOString().split('T')[0]
): MarianosProductRecord | null {
  // DATA RULE: Exclude products whose weight contains "approx", "approximately" etc.
  if (hasApproximateWeight(raw.weight)) {
    return null;
  }

  const deals = classifyDeals({
    rawPromo: raw.raw_promo_badge,
    rawCoupon: raw.raw_coupon_badge,
    explicitVolumeDesc: raw.volume_deals_description,
    explicitVolumePrice: raw.volume_deals_price,
    explicitDigitalDesc: raw.digital_deals_description,
    explicitDigitalPrice: raw.digital_deals_price,
  });

  const storeBrand = raw.store_brand !== undefined && raw.store_brand !== ''
    ? raw.store_brand
    : identifyStoreBrand(raw.brand, raw.product_title);

  const regularPrice = formatNumericPrice(raw.regular_price);
  const salePrice = formatNumericPrice(raw.sale_price);

  // Return object with strict 22 keys
  const record: MarianosProductRecord = {
    zipcode: raw.zipcode || defaultStore.zipcode,
    store_name: raw.store_name || defaultStore.store_name,
    store_location: raw.store_location || defaultStore.store_location,
    store_logo: raw.store_logo || defaultStore.store_logo,
    store_brand: storeBrand,
    category: raw.category || '',
    sub_category: raw.sub_category || '',
    product_title: (raw.product_title || '').trim(),
    weight: (raw.weight || '').trim(),
    regular_price: regularPrice,
    sale_price: salePrice,
    volume_deals_description: deals.volume_deals_description,
    volume_deals_price: deals.volume_deals_price,
    digital_deals_description: deals.digital_deals_description,
    digital_deals_price: deals.digital_deals_price,
    image_url: raw.image_url || '',
    url: raw.url || '',
    upc: (raw.upc || '').trim(),
    // REQUIRED: gupc is returned as empty string ""
    gupc: '',
    // REQUIRED: ppm is scraped verbatim with unit or empty string ""
    ppm: formatPPM(raw.ppm),
    // REQUIRED: unit_price is calculated downstream, returned as empty string ""
    unit_price: '',
    // REQUIRED: crawl_date is the collection date and is strictly the final field
    crawl_date: raw.crawl_date || defaultDate,
  };

  return record;
}

/**
 * Serializes a record or list of records to JSON string ensuring strict 22-field key order.
 */
export function serializeStrictJson(records: MarianosProductRecord[]): string {
  const orderedList = records.map(record => {
    const orderedObj: Record<string, string> = {};
    for (const field of REQUIRED_FIELDS_ORDER) {
      orderedObj[field] = record[field] ?? '';
    }
    return orderedObj;
  });
  return JSON.stringify(orderedList, null, 2);
}

/**
 * Dataset audit & validation results
 */
export interface DatasetAuditResult {
  totalRecords: number;
  uniqueRecords: number;
  duplicateCount: number;
  duplicates: Array<{ upc: string; title: string; count: number }>;
  categoryCounts: Record<string, number>;
  fieldCompleteness: Record<RequiredField, number>;
  overallCompletenessPct: number;
  excludedApproximateWeightCount: number;
  storeVerified: boolean;
  storeDetails: {
    zipcode: string;
    store_name: string;
    store_location: string;
  };
  dealsBreakdown: {
    totalVolumeDeals: number;
    totalDigitalDeals: number;
    totalOnSale: number;
    totalRegularOnly: number;
  };
  canaryCheck: {
    passed: boolean;
    missingCanaries: string[];
    foundCanaries: string[];
  };
  promotionGatePassed: boolean;
  rejectionReasons: string[];
}

export const CANARY_PRODUCTS = [
  'Milk',
  'Avocado',
  'Banana',
  'Chicken',
  'Eggs',
  'Bread'
];

/**
 * Audits a dataset according to contest criteria and determines whether it passes
 * the atomic promotion gate to overwrite latest.json.
 */
export function auditDataset(
  records: MarianosProductRecord[],
  expectedStore = { zipcode: '60657', store_name: "Mariano's Lakeview East" },
  historicalBaselineCount = 500
): DatasetAuditResult {
  const upcMap = new Map<string, number>();
  const titleWeightMap = new Map<string, number>();
  const duplicateList: Array<{ upc: string; title: string; count: number }> = [];
  const categoryCounts: Record<string, number> = {};

  const fieldPresence: Record<RequiredField, number> = {} as any;
  for (const f of REQUIRED_FIELDS_ORDER) {
    fieldPresence[f] = 0;
  }

  let totalVolumeDeals = 0;
  let totalDigitalDeals = 0;
  let totalOnSale = 0;
  let totalRegularOnly = 0;

  const foundCanarySet = new Set<string>();

  for (const r of records) {
    // Check duplicates
    if (r.upc) {
      upcMap.set(r.upc, (upcMap.get(r.upc) || 0) + 1);
    }
    const twKey = `${r.product_title.toLowerCase()}|||${r.weight.toLowerCase()}`;
    titleWeightMap.set(twKey, (titleWeightMap.get(twKey) || 0) + 1);

    // Categories
    const cat = r.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Field completeness
    for (const f of REQUIRED_FIELDS_ORDER) {
      if (r[f] !== undefined && r[f] !== null && r[f] !== '') {
        fieldPresence[f]++;
      }
    }

    // Deals classification
    if (r.volume_deals_description) totalVolumeDeals++;
    if (r.digital_deals_description) totalDigitalDeals++;
    if (r.sale_price) totalOnSale++;
    if (!r.sale_price && !r.volume_deals_description && !r.digital_deals_description) {
      totalRegularOnly++;
    }

    // Canaries
    const titleLower = r.product_title.toLowerCase();
    for (const canary of CANARY_PRODUCTS) {
      if (titleLower.includes(canary.toLowerCase())) {
        foundCanarySet.add(canary);
      }
    }
  }

  // Count duplicates
  let duplicateCount = 0;
  upcMap.forEach((cnt, upc) => {
    if (cnt > 1) {
      duplicateCount += (cnt - 1);
      const sample = records.find(r => r.upc === upc);
      duplicateList.push({
        upc,
        title: sample ? sample.product_title : 'Unknown',
        count: cnt
      });
    }
  });

  const uniqueRecords = records.length - duplicateCount;

  // Field completeness percentage
  const fieldCompleteness: Record<RequiredField, number> = {} as any;
  let totalPctSum = 0;
  for (const f of REQUIRED_FIELDS_ORDER) {
    // Note: gupc and unit_price are required to be empty strings by contract
    if (f === 'gupc' || f === 'unit_price') {
      fieldCompleteness[f] = 100;
    } else {
      const pct = records.length > 0 ? (fieldPresence[f] / records.length) * 100 : 0;
      fieldCompleteness[f] = Math.round(pct * 10) / 10;
    }
    totalPctSum += fieldCompleteness[f];
  }
  const overallCompletenessPct = Math.round((totalPctSum / REQUIRED_FIELDS_ORDER.length) * 10) / 10;

  // Store verification
  const storeSample = records[0];
  const storeVerified = !!storeSample &&
    storeSample.zipcode === expectedStore.zipcode &&
    storeSample.store_name.toLowerCase().includes("mariano");

  // Canary check
  const missingCanaries = CANARY_PRODUCTS.filter(c => !foundCanarySet.has(c));
  const foundCanaries = Array.from(foundCanarySet);
  const canaryPassed = missingCanaries.length === 0;

  // Atomic promotion gate evaluation
  const rejectionReasons: string[] = [];

  if (records.length < 500) {
    rejectionReasons.push(`Record count (${records.length}) is below required minimum threshold of 500`);
  }

  // Detect abnormally thin results (>30% drop from baseline)
  if (historicalBaselineCount > 0 && records.length < historicalBaselineCount * 0.70) {
    rejectionReasons.push(`Abnormally thin results detected: record count (${records.length}) is >30% below baseline (${historicalBaselineCount})`);
  }

  if (!storeVerified) {
    rejectionReasons.push(`Store verification failed: expected ${expectedStore.store_name} (${expectedStore.zipcode}), received ${storeSample?.store_name || 'none'}`);
  }

  if (!canaryPassed) {
    rejectionReasons.push(`Canary silent-blocking check failed: missing essential staples [${missingCanaries.join(', ')}]`);
  }

  if (duplicateCount > records.length * 0.05) {
    rejectionReasons.push(`High duplicate rate detected: ${duplicateCount} duplicates (${((duplicateCount / records.length) * 100).toFixed(1)}%)`);
  }

  const promotionGatePassed = rejectionReasons.length === 0;

  return {
    totalRecords: records.length,
    uniqueRecords,
    duplicateCount,
    duplicates: duplicateList,
    categoryCounts,
    fieldCompleteness,
    overallCompletenessPct,
    excludedApproximateWeightCount: 0,
    storeVerified,
    storeDetails: {
      zipcode: storeSample?.zipcode || expectedStore.zipcode,
      store_name: storeSample?.store_name || expectedStore.store_name,
      store_location: storeSample?.store_location || '',
    },
    dealsBreakdown: {
      totalVolumeDeals,
      totalDigitalDeals,
      totalOnSale,
      totalRegularOnly
    },
    canaryCheck: {
      passed: canaryPassed,
      missingCanaries,
      foundCanaries
    },
    promotionGatePassed,
    rejectionReasons
  };
}
