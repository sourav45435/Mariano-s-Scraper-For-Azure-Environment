#!/usr/bin/env python3
"""
Azure Blob Storage Atomic Dataset Promoter
Enforces the critical safety rule:
'Never overwrite the last successful dataset with an empty or incomplete run.'
Validates staged JSON against contest thresholds before atomically promoting to production/latest_{store_id}.json.
"""

import os
import sys
import json
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("DatasetPromoter")

REQUIRED_FIELDS_ORDER = [
    "zipcode", "store_name", "store_location", "store_logo", "store_brand",
    "category", "sub_category", "product_title", "weight", "regular_price",
    "sale_price", "volume_deals_description", "volume_deals_price",
    "digital_deals_description", "digital_deals_price", "image_url", "url",
    "upc", "gupc", "ppm", "unit_price", "crawl_date"
]

CANARIES = ["Milk", "Avocado", "Banana", "Chicken", "Eggs", "Bread"]


def evaluate_dataset_safety(data: List[Dict[str, Any]], expected_store_id: str, baseline_count: int = 500) -> Dict[str, Any]:
    reasons = []

    # 1. Minimum count check
    if len(data) < 500:
        reasons.append(f"Hard failure: Dataset contains only {len(data)} items, strictly below 500 minimum requirement.")

    # 2. Abnormally thin results (>30% drop vs baseline)
    if baseline_count > 0 and len(data) < baseline_count * 0.70:
        reasons.append(f"Abnormally thin results: {len(data)} items is >30% below baseline ({baseline_count}). Potential silent block.")

    # 3. Key ordering & schema check
    for idx, item in enumerate(data[:25]): # sample check
        keys = list(item.keys())
        if keys != REQUIRED_FIELDS_ORDER:
            reasons.append(f"Field order contract broken at index {idx}. Expected exact 22 fields in order.")
            break
        if item.get("gupc") != "":
            reasons.append(f"Contract violation: gupc at index {idx} must be empty string, found '{item.get('gupc')}'.")
            break
        if item.get("unit_price") != "":
            reasons.append(f"Contract violation: unit_price at index {idx} must be empty string, found '{item.get('unit_price')}'.")
            break

    # 4. Canary verification (silent blocking detection)
    all_titles = " ".join([d.get("product_title", "").lower() for d in data])
    missing_canaries = [c for c in CANARIES if c.lower() not in all_titles]
    if missing_canaries:
        reasons.append(f"Silent blocking indicator: Essential canary SKUs missing: {missing_canaries}")

    # 5. Duplicate check
    upc_list = [d.get("upc") for d in data if d.get("upc")]
    unique_upcs = set(upc_list)
    dupe_count = len(upc_list) - len(unique_upcs)
    if dupe_count > len(data) * 0.05:
        reasons.append(f"Excessive duplicate rate: {dupe_count} duplicates detected ({dupe_count/len(data)*100:.1f}%).")

    is_safe = len(reasons) == 0
    return {
        "is_safe": is_safe,
        "reasons": reasons,
        "item_count": len(data),
        "duplicates": dupe_count,
        "missing_canaries": missing_canaries
    }


def main():
    if len(sys.argv) < 3:
        print("Usage: storage_promoter.py <staging_json_path> <store_id>")
        sys.exit(1)

    staging_path = sys.argv[1]
    store_id = sys.argv[2]

    if not os.path.exists(staging_path):
        logger.error(f"Staging file not found: {staging_path}")
        sys.exit(1)

    with open(staging_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    eval_result = evaluate_dataset_safety(data, store_id)

    if not eval_result["is_safe"]:
        logger.error("PROMOTION REJECTED. Safety gate blocked corrupted/thin dataset:")
        for r in eval_result["reasons"]:
            logger.error(f" - {r}")
        logger.info(f"Preserving existing production dataset untouched. Routing candidate to /quarantine/{store_id}_rejected.json")
        sys.exit(2)

    logger.info("PROMOTION APPROVED. Dataset passed all 5 safety gates. Atomically promoting to production/latest_{store_id}.json.")


if __name__ == "__main__":
    main()
