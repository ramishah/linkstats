#!/usr/bin/env python3
"""
Estimate AWS S3 costs for plink media on the LinkStats dashboard.

Fetches live data from the local dev server to measure actual media counts
and file sizes, then projects monthly costs based on configurable usage parameters.

Requirements: Dev server running on localhost (npm run dev)
Usage: python3 scripts/estimate-aws-cost.py
"""

import json
import urllib.request
import sys

# ============================================================
# CONFIGURABLE VARIABLES - adjust these to model different scenarios
# ============================================================

# Dev server URL
DEV_SERVER = "http://localhost:3000"

# Usage assumptions
USERS = 10                          # number of people using the site
LOADS_PER_USER_PER_DAY = 5          # page loads per user per day
MINUTES_OPEN_PER_LOAD = 30          # how long the page stays open per load
CACHE_TTL_MINUTES = 10              # client-side plink cache TTL
LIGHTBOX_CLICKS_PER_LOAD = 5        # full-size media views per load

# AWS S3 pricing (us-east-1, Standard)
S3_GET_COST_PER_1000 = 0.0004       # per 1,000 GET requests
S3_DATA_OUT_PER_GB = 0.09           # first 10 TB/month
DAYS_IN_MONTH = 30

# ============================================================


def fetch_json(url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


def get_file_size(url):
    """Get file size via Range request without downloading the full file."""
    try:
        req = urllib.request.Request(url)
        req.add_header("Range", "bytes=0-0")
        with urllib.request.urlopen(req, timeout=10) as r:
            cr = r.headers.get("Content-Range", "")
            if "/" in cr:
                return int(cr.split("/")[1])
    except Exception:
        pass
    return 0


def main():
    # Check dev server
    test = fetch_json(f"{DEV_SERVER}/api/plink/links")
    if test is None:
        print("Could not connect to dev server. Make sure 'npm run dev' is running.")
        sys.exit(1)

    plink_links = test if isinstance(test, list) else []
    if not plink_links:
        print("No plink links found.")
        sys.exit(0)

    print("=" * 60)
    print("FETCHING LIVE DATA FROM DEV SERVER")
    print("=" * 60)

    total_media = 0
    total_images = 0
    total_videos = 0
    total_api_bytes = 0
    thumb_sizes = []
    full_sizes = []
    max_media_in_link = 0
    media_per_link = []

    for pl in plink_links:
        data = fetch_json(f"{DEV_SERVER}/api/plink/media/{pl['id']}")
        if not isinstance(data, list):
            continue

        count = len(data)
        total_media += count
        media_per_link.append(count)
        if count > max_media_in_link:
            max_media_in_link = count

        for item in data:
            if item.get("type") == "video" or (item.get("mime", "").startswith("video/")):
                total_videos += 1
            else:
                total_images += 1

        # Sample up to 2 items per link for size estimation
        for item in data[:2]:
            thumb_url = item.get("thumbnailUrl")
            full_url = item.get("url")
            if thumb_url:
                sz = get_file_size(thumb_url)
                if sz > 0:
                    thumb_sizes.append(sz)
            if full_url and full_url != thumb_url:
                sz = get_file_size(full_url)
                if sz > 0:
                    full_sizes.append(sz)

    avg_thumb_bytes = sum(thumb_sizes) / len(thumb_sizes) if thumb_sizes else 15000
    avg_full_bytes = sum(full_sizes) / len(full_sizes) if full_sizes else 700000

    print(f"\nPlink links:              {len(plink_links)}")
    print(f"Total media items:        {total_media} ({total_images} images, {total_videos} videos)")
    print(f"Max media in one link:    {max_media_in_link}")
    print(f"Avg media per link:       {total_media / len(plink_links):.1f}")
    print(f"Avg thumbnail size:       {avg_thumb_bytes / 1024:.0f} KB (sampled {len(thumb_sizes)} files)")
    print(f"Avg full file size:       {avg_full_bytes / 1024:.0f} KB (sampled {len(full_sizes)} files)")

    # --- Per page load ---
    presign_requests = total_media * 2  # thumb + full per item
    refreshes_per_load = max(0, (MINUTES_OPEN_PER_LOAD // CACHE_TTL_MINUTES) - 1)
    fetches_per_load = 1 + refreshes_per_load  # initial + refreshes
    s3_gets_per_load = total_media * fetches_per_load
    thumb_bytes_per_load = total_media * fetches_per_load * avg_thumb_bytes
    full_bytes_per_load = LIGHTBOX_CLICKS_PER_LOAD * avg_full_bytes

    print(f"\n{'=' * 60}")
    print("PER PAGE LOAD")
    print(f"{'=' * 60}")
    print(f"Presigned URL requests:   {presign_requests} (to media service)")
    print(f"Cache refreshes per load: {refreshes_per_load} (every {CACHE_TTL_MINUTES} min over {MINUTES_OPEN_PER_LOAD} min)")
    print(f"S3 thumbnail GETs:        {s3_gets_per_load}")
    print(f"Thumbnail data:           {thumb_bytes_per_load / 1024 / 1024:.2f} MB")
    print(f"Lightbox clicks:          {LIGHTBOX_CLICKS_PER_LOAD}")
    print(f"Full file data:           {full_bytes_per_load / 1024 / 1024:.2f} MB")
    print(f"Total data per load:      {(thumb_bytes_per_load + full_bytes_per_load) / 1024 / 1024:.2f} MB")

    # --- Monthly ---
    total_loads = USERS * LOADS_PER_USER_PER_DAY * DAYS_IN_MONTH

    monthly_thumb_gets = total_loads * s3_gets_per_load
    monthly_full_gets = total_loads * LIGHTBOX_CLICKS_PER_LOAD
    monthly_total_gets = monthly_thumb_gets + monthly_full_gets

    monthly_thumb_bytes = total_loads * thumb_bytes_per_load
    monthly_full_bytes = total_loads * full_bytes_per_load
    monthly_total_bytes = monthly_thumb_bytes + monthly_full_bytes
    monthly_total_gb = monthly_total_bytes / (1024 ** 3)

    get_cost = monthly_total_gets * S3_GET_COST_PER_1000 / 1000
    data_cost = monthly_total_gb * S3_DATA_OUT_PER_GB
    total_cost = get_cost + data_cost

    print(f"\n{'=' * 60}")
    print(f"MONTHLY ESTIMATE ({USERS} users, {LOADS_PER_USER_PER_DAY} loads/user/day)")
    print(f"{'=' * 60}")
    print(f"Total page loads:         {total_loads:,}")
    print()
    print(f"S3 GET requests:")
    print(f"  Thumbnails:             {monthly_thumb_gets:,}")
    print(f"  Full files (lightbox):  {monthly_full_gets:,}")
    print(f"  Total:                  {monthly_total_gets:,}")
    print(f"  Cost:                   ${get_cost:.4f}")
    print()
    print(f"Data transfer:")
    print(f"  Thumbnails:             {monthly_thumb_bytes / 1024 / 1024:.0f} MB")
    print(f"  Full files (lightbox):  {monthly_full_bytes / 1024 / 1024:.0f} MB")
    print(f"  Total:                  {monthly_total_gb:.2f} GB")
    print(f"  Cost:                   ${data_cost:.4f}")

    print(f"\n{'=' * 60}")
    print(f"  TOTAL MONTHLY S3 COST:  ${total_cost:.2f}")
    print(f"{'=' * 60}")

    # --- Worst case ---
    wc_media = len(plink_links) * max_media_in_link
    wc_gets_per_load = wc_media * fetches_per_load
    wc_monthly_gets = total_loads * (wc_gets_per_load + LIGHTBOX_CLICKS_PER_LOAD)
    wc_monthly_bytes = total_loads * (wc_media * fetches_per_load * avg_thumb_bytes + full_bytes_per_load)
    wc_monthly_gb = wc_monthly_bytes / (1024 ** 3)
    wc_get_cost = wc_monthly_gets * S3_GET_COST_PER_1000 / 1000
    wc_data_cost = wc_monthly_gb * S3_DATA_OUT_PER_GB
    wc_total = wc_get_cost + wc_data_cost

    print(f"\n--- WORST CASE (every link has {max_media_in_link} media items) ---")
    print(f"  Media items:            {wc_media:,}")
    print(f"  Monthly S3 GETs:        {wc_monthly_gets:,}")
    print(f"  Monthly data:           {wc_monthly_gb:.2f} GB")
    print(f"  TOTAL MONTHLY COST:     ${wc_total:.2f}")


if __name__ == "__main__":
    main()
