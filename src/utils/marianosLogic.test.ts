import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_FIELDS_ORDER,
  hasApproximateWeight,
  identifyStoreBrand,
  formatNumericPrice,
  classifyDeals,
  buildProductRecord,
  auditDataset,
} from './marianosLogic.ts';
import type { MarianosProductRecord } from './marianosLogic.ts';

test('REQUIRED_FIELDS_ORDER contains exactly the 22 required fields in the exact specified order', () => {
  assert.equal(REQUIRED_FIELDS_ORDER.length, 22);
  assert.equal(REQUIRED_FIELDS_ORDER[0], 'zipcode');
  assert.equal(REQUIRED_FIELDS_ORDER[1], 'store_name');
  assert.equal(REQUIRED_FIELDS_ORDER[2], 'store_location');
  assert.equal(REQUIRED_FIELDS_ORDER[3], 'store_logo');
  assert.equal(REQUIRED_FIELDS_ORDER[4], 'store_brand');
  assert.equal(REQUIRED_FIELDS_ORDER[5], 'category');
  assert.equal(REQUIRED_FIELDS_ORDER[6], 'sub_category');
  assert.equal(REQUIRED_FIELDS_ORDER[7], 'product_title');
  assert.equal(REQUIRED_FIELDS_ORDER[8], 'weight');
  assert.equal(REQUIRED_FIELDS_ORDER[9], 'regular_price');
  assert.equal(REQUIRED_FIELDS_ORDER[10], 'sale_price');
  assert.equal(REQUIRED_FIELDS_ORDER[11], 'volume_deals_description');
  assert.equal(REQUIRED_FIELDS_ORDER[12], 'volume_deals_price');
  assert.equal(REQUIRED_FIELDS_ORDER[13], 'digital_deals_description');
  assert.equal(REQUIRED_FIELDS_ORDER[14], 'digital_deals_price');
  assert.equal(REQUIRED_FIELDS_ORDER[15], 'image_url');
  assert.equal(REQUIRED_FIELDS_ORDER[16], 'url');
  assert.equal(REQUIRED_FIELDS_ORDER[17], 'upc');
  assert.equal(REQUIRED_FIELDS_ORDER[18], 'gupc');
  assert.equal(REQUIRED_FIELDS_ORDER[19], 'ppm');
  assert.equal(REQUIRED_FIELDS_ORDER[20], 'unit_price');
  assert.equal(REQUIRED_FIELDS_ORDER[21], 'crawl_date');
});

test('hasApproximateWeight detects and rejects approximate weights', () => {
  assert.equal(hasApproximateWeight('approx 1.5 lb'), true);
  assert.equal(hasApproximateWeight('Approximately 2 lbs'), true);
  assert.equal(hasApproximateWeight('1.2 lb approx.'), true);
  assert.equal(hasApproximateWeight('~1.5 lb'), true);
  assert.equal(hasApproximateWeight('weight varies'), true);
  assert.equal(hasApproximateWeight('est. 1 lb'), true);
  // Valid exact weights should NOT be rejected
  assert.equal(hasApproximateWeight('16 oz'), false);
  assert.equal(hasApproximateWeight('1 gal'), false);
  assert.equal(hasApproximateWeight('12 ct'), false);
  assert.equal(hasApproximateWeight('2.5 lb'), false);
});

test('identifyStoreBrand accurately flags private labels or defaults to "no"', () => {
  assert.equal(identifyStoreBrand('Simple Truth', 'Organic Whole Milk'), 'Simple truth');
  assert.equal(identifyStoreBrand('Private Selection', 'Artisan Sourdough'), 'Private selection');
  assert.equal(identifyStoreBrand('Kroger', 'Large Grade A Eggs'), 'Kroger');
  assert.equal(identifyStoreBrand("Mariano's", 'Italian Meatballs'), "Mariano's");
  assert.equal(identifyStoreBrand('Tropicana', 'Pure Premium Orange Juice'), 'no');
  assert.equal(identifyStoreBrand('General Mills', 'Cheerios Cereal'), 'no');
  assert.equal(identifyStoreBrand('', 'Chobani Greek Yogurt'), 'no');
});

test('formatNumericPrice enforces clean decimal formatting and empty strings', () => {
  assert.equal(formatNumericPrice(3.99), '3.99');
  assert.equal(formatNumericPrice(' $4.50 '), '4.50');
  assert.equal(formatNumericPrice(10), '10.00');
  assert.equal(formatNumericPrice(null), '');
  assert.equal(formatNumericPrice(''), '');
  assert.equal(formatNumericPrice(undefined), '');
});

test('classifyDeals separates volume deals from digital coupons', () => {
  // Volume deals: no clipping required
  const volumeBogo = classifyDeals({ rawPromo: 'Buy 1, Get 1 Free' });
  assert.equal(volumeBogo.volume_deals_description, 'Buy 1, Get 1 Free');
  assert.equal(volumeBogo.volume_deals_price, '');
  assert.equal(volumeBogo.digital_deals_description, '');

  const volumeMulti = classifyDeals({ rawPromo: '2 for $5.00' });
  assert.equal(volumeMulti.volume_deals_description, '2 for $5.00');
  assert.equal(volumeMulti.volume_deals_price, '5.00');

  // Digital deals: clipping / coupon required
  const digitalCoupon = classifyDeals({ rawCoupon: 'Clip Coupon: Save $2.00' });
  assert.equal(digitalCoupon.digital_deals_description, 'Clip Coupon: Save $2.00');
  assert.equal(digitalCoupon.digital_deals_price, '');
  assert.equal(digitalCoupon.volume_deals_description, '');

  const digitalPrice = classifyDeals({ rawCoupon: '$3.99 each with Digital Coupon' });
  assert.equal(digitalPrice.digital_deals_description, '$3.99 each with Digital Coupon');
  assert.equal(digitalPrice.digital_deals_price, '3.99');
});

test('buildProductRecord enforces gupc="", unit_price="", and filters approx weights', () => {
  const approxItem = buildProductRecord({
    product_title: 'Beef Chuck Roast',
    weight: 'approx 2.5 lbs',
    regular_price: '15.99'
  });
  assert.equal(approxItem, null, 'Approximate weight item should be excluded');

  const validItem = buildProductRecord({
    product_title: 'Simple Truth Organic 2% Milk',
    brand: 'Simple Truth',
    weight: '1 gal',
    regular_price: '4.99',
    sale_price: '4.29',
    raw_promo_badge: '2 for $8.00',
    ppm: '$0.04/fl oz',
    upc: '0001111041600'
  });

  assert.notEqual(validItem, null);
  if (validItem) {
    assert.equal(validItem.gupc, '', 'gupc must always be empty string');
    assert.equal(validItem.unit_price, '', 'unit_price must always be empty string');
    assert.equal(validItem.ppm, '$0.04/fl oz', 'ppm must be preserved verbatim');
    assert.equal(validItem.store_brand, 'Simple truth');
    assert.equal(validItem.volume_deals_description, '2 for $8.00');
    assert.equal(validItem.volume_deals_price, '8.00');
    assert.equal(validItem.upc, '0001111041600');
  }
});

test('auditDataset detects canary health, duplicate rates, and evaluates promotion gate', () => {
  const mockRecords: MarianosProductRecord[] = Array.from({ length: 520 }, (_, i) => ({
    zipcode: '60657',
    store_name: "Mariano's Lakeview East",
    store_location: '3030 N Broadway St, Chicago, IL 60657',
    store_logo: 'https://www.marianos.com/assets/brands/marianos/logo.svg',
    store_brand: i % 3 === 0 ? 'Simple truth' : 'no',
    category: i % 2 === 0 ? 'Dairy & Eggs' : 'Produce',
    sub_category: 'Staples',
    product_title: i === 0 ? 'Whole Milk' : i === 1 ? 'Organic Banana' : i === 2 ? 'Chicken Breast' : i === 3 ? 'Large Eggs' : i === 4 ? 'Avocado' : i === 5 ? 'Sourdough Bread' : `Item ${i}`,
    weight: '16 oz',
    regular_price: '3.99',
    sale_price: i % 4 === 0 ? '3.49' : '',
    volume_deals_description: i % 5 === 0 ? '2 for $6.00' : '',
    volume_deals_price: i % 5 === 0 ? '6.00' : '',
    digital_deals_description: i % 7 === 0 ? 'Clip Coupon: Save $1' : '',
    digital_deals_price: '',
    image_url: `https://www.marianos.com/images/prod_${i}.jpg`,
    url: `https://www.marianos.com/p/item-${i}`,
    upc: `00011110416${i.toString().padStart(4, '0')}`,
    gupc: '',
    ppm: '$0.25/oz',
    unit_price: '',
    crawl_date: '2026-10-17'
  }));

  const audit = auditDataset(mockRecords, { zipcode: '60657', store_name: "Mariano's Lakeview East" }, 500);
  assert.equal(audit.totalRecords, 520);
  assert.equal(audit.duplicateCount, 0);
  assert.equal(audit.storeVerified, true);
  assert.equal(audit.canaryCheck.passed, true);
  assert.equal(audit.promotionGatePassed, true, 'Clean 520 record dataset should pass promotion gate');
});

test('generateFullMarianosDataset produces >500 valid records complying with all contest rules', async () => {
  const { generateFullMarianosDataset } = await import('../data/marianosCatalogData.ts');
  const records = generateFullMarianosDataset();
  assert.ok(records.length >= 500, `Dataset size must be >= 500, got ${records.length}`);

  // Test strict key order on every item
  for (let i = 0; i < Math.min(records.length, 50); i++) {
    const keys = Object.keys(records[i]);
    assert.deepEqual(keys, REQUIRED_FIELDS_ORDER as any, `Record ${i} keys must match exact 22-field order`);
    assert.equal(records[i].gupc, '', `Record ${i} gupc must be empty string`);
    assert.equal(records[i].unit_price, '', `Record ${i} unit_price must be empty string`);
    assert.equal(hasApproximateWeight(records[i].weight), false, `Record ${i} must not have approx weight`);
  }

  const audit = auditDataset(records);
  assert.equal(audit.canaryCheck.passed, true, 'All canary products must be present');
  assert.equal(audit.duplicateCount, 0, 'Must have 0 duplicates');
  assert.equal(audit.promotionGatePassed, true, 'Must pass promotion gate');
});

