# NeatDuck_Timeline public event library

This repository publishes a public, extension-readable event CSV for NeatDuck_Timeline.

Default public CSV URL after enabling GitHub Pages:

```text
https://yang-zhang-717.github.io/NeatDuck_Timeline/data/events.csv
```

## Files

```text
data/events.csv              Accumulated historical library used by the extension
data/events.manual.csv       Optional manually maintained rows; merged into events.csv
data/manifest.json           Metadata for clients
data/snapshot-latest.json    Current scrape snapshot only, mostly for debugging
data/detail_cache.json       Cached detail-page dates to reduce repeated page requests
scripts/update_data.py       Fetch, parse, compare, merge, and write data
.github/workflows/update-data.yml
requirements.txt
```

## How updates work

The GitHub Action runs twice daily and can also be triggered manually from the Actions tab. It fetches Leek Duck's public events page, parses the current/upcoming event cards, compares them with the existing `data/events.csv`, and writes a merged historical CSV. Old rows are not deleted; if they are not seen in the latest scrape, they remain as archived history. The CSV is sorted for table reading: active/future rows first, nearest upcoming first; historical rows below, newest old rows first.

## Legal / etiquette notes

This project should not copy Leek Duck graphics, long descriptions, page layout, or branding. It should only store factual schedule metadata needed for timeline display. Keep attribution and a clear non-affiliation statement in your extension and store listing.
