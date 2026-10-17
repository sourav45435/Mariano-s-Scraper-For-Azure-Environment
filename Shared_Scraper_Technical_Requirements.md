# Shared Scraper Technical Requirements & Architectural Specifications

## 1. Enterprise Overview
This document specifies the technical standards, execution architecture, data validation contracts, and operational safeguards for the production web scraper servicing **Mariano's** (Kroger banner operating primarily across Illinois and the Chicagoland metropolitan area).

The scraper is engineered for deployment in **Microsoft Azure**, executing twice weekly (`0 2 * * 2,5` - Tuesday & Friday at 02:00 UTC) with zero continuous human intervention, full location pinning, resilient pagination, canary silent-blocking mitigation, and atomic dataset staging/promotion into Azure Blob Storage.

---

## 2. Target Retailer Profile
* **Banner**: Mariano's (Roundy's Supermarkets, Inc. / The Kroger Co.)
* **Division Code**: 705 (Roundy's / Mariano's division)
* **Store Identifiers**: Specific 5-digit store IDs (e.g., `00531` Lakeview East - 3030 N Broadway St, Chicago, IL 60657; `00535` New Eastside - 333 E Benton Pl, Chicago, IL 60601).
* **Fulfillment Modality**: In-Store / Pickup pricing context.

---

## 3. Strict 22-Field Output Contract

Output must strictly adhere to the following **exact key ordering** (22 fields):
```
1.  zipcode
2.  store_name
3.  store_location
4.  store_logo
5.  store_brand
6.  category
7.  sub_category
8.  product_title
9.  weight
10. regular_price
11. sale_price
12. volume_deals_description
13. volume_deals_price
14. digital_deals_description
15. digital_deals_price
16. image_url
17. url
18. upc
19. gupc
20. ppm
21. unit_price
22. crawl_date
```

### Strict Field Semantics:
* **Missing Values**: Must be serialized as empty string (`""`), NEVER `null` or missing keys.
* **Numeric Price Formatting**: Normalized decimal string (e.g. `"3.99"`, `"0.25"`). Strip dollar signs and whitespace.
* **Store Brand**: Detect Mariano's / Kroger private labels (`Simple Truth`, `Private Selection`, `Kroger`, `Mariano's`, `Heritage Farm`, `Big K`, `Bloom Haus`, `Smart Way`, `Comforts`, etc.). When detected, set to the brand name; otherwise strictly defaults to `"no"`.
* **Approximate Weights**: MUST exclude products whose weight contains `"approx"`, `"approximately"`, `"approx."`, `"est."`, `"~"`, or `"varies"`.
* **PPM (Price Per Measure)**: Scraped verbatim from retailer UI with displayed unit (e.g. `"$0.25/oz"`, `"$3.99/lb"`, `"$0.18/fl oz"`). Never estimate or calculate missing PPM. If not displayed, return `""`.
* **unit_price**: Calculated downstream by ingestion pipeline. The scraper MUST include this key in position 21 but return strictly `""`.
* **gupc**: Position 19 immediately following `upc`. Global UPC is assigned downstream. Return strictly `""`. Original retailer UPC must be preserved in `upc`.
* **crawl_date**: Collection date in ISO `YYYY-MM-DD` format. Must strictly be the 22nd and final field.

---

## 4. Deals Classification Rules

Retailer promotions must be categorized cleanly into two distinct buckets:

### A. Volume Deals (`volume_deals_description`, `volume_deals_price`)
* **Definition**: Quantity or bundle promotions that do **not** require clipping or digital coupon activation.
* **Examples**:
  * `"2 for $5"` -> description: `"2 for $5"`, price: `"5.00"`
  * `"Buy 1, Get 1 Free"` -> description: `"Buy 1, Get 1 Free"`, price: `""` (no calculated price invented)
  * `"Mix or Match 5 for $10"` -> description: `"Mix or Match 5 for $10"`, price: `"10.00"`
  * `"Must buy 4 at $1.99 each"` -> description: `"Must buy 4 at $1.99 each"`, price: `"1.99"`

### B. Digital Deals (`digital_deals_description`, `digital_deals_price`)
* **Definition**: Promotions requiring user activation, account login, or clipping digital coupons.
* **Examples**:
  * `"Clip Coupon: Save $2.00"` -> description: `"Clip Coupon: Save $2.00"`, price: `""`
  * `"$3.99 each with Digital Coupon"` -> description: `"$3.99 each with Digital Coupon"`, price: `"3.99"`
  * `"Save $5 when you buy 5 with Digital Coupon"` -> description: `"Save $5 when you buy 5 with Digital Coupon"`, price: `""`

---

## 5. Azure Execution Architecture

```
[Azure Event Grid / Cron Schedule: 0 2 * * 2,5]
                     │
                     ▼
       [Azure Container Apps Job]
  (Python 3.11 + Playwright Headless + Chromium)
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
[Store Pinning Verification]  [Rotating Proxy Pool]
(Cookies: kds-store-id,       (US Residential IP)
 division-id: 705)
       │
       ▼
[Category Pagination & Crawl]
(Marianos_Category_URLs.csv)
       │
       ▼
[In-Flight Anomaly Sentinel]
 - Canary Item Verification (Milk, Eggs, Avocado, Bread)
 - Empty Results Threshold
 - Yield Comparison (vs. Baseline >= 500 items, max drop <30%)
       │
       ▼
[Staging Export -> staging/{run_id}.json]
       │
       ▼
[Atomic Promotion Gatekeeper]
 ├── Passed ──► Overwrite /latest/{store_id}.json & write /archive/{date}_{store_id}.json
 └── Failed ──► Move to /quarantine/{run_id}.json & trigger Azure Monitor Alert
```

---

## 6. Anti-Detection & Silent Blocking Safeguards
1. **Stealth Playwright Driver**: Patched navigator properties (`navigator.webdriver` spoofing, WebGL vendor masking, authentic Chrome user-agents).
2. **Canary Verification**: A curated list of high-velocity staple SKUs is monitored continuously. If canaries fail to render or return 0 results, the run is flagged for silent blocking.
3. **Yield Baselines**: Compares current crawl item count against rolling 4-week historical averages. An abnormal drop (>30%) halts promotion.
4. **Exponential Backoff**: HTTP 429 and Akamai challenge triggers jittered exponential backoff (2s, 4s, 8s, 16s) before switching proxy endpoint.

---

## 7. Atomic Dataset Promotion
* **Contract**: Never overwrite a known good dataset with an empty, partial, or corrupted run.
* **Implementation**: The pipeline writes to an isolated Azure Blob container prefix `staging/`. An independent audit step validates:
  1. Record count >= 500
  2. 0 duplicate UPCs or <0.5% threshold
  3. 100% adherence to the 22-field ordering
  4. 0 invalid approximate-weight items
  5. Store location matched correctly
* Only upon unanimous pass does an Azure Blob Storage copy operation update `production/latest_{store_id}.json`.
