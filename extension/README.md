# NeatDuck v1.0.7

NeatDuck is a Chrome extension for Pokémon GO planning. It provides three independent tabs in one compact UI:

1. **Event Calendar**: GitHub-backed LeekDuck event timeline and month view.
2. **属性克制 / Type Matchup**: Pokémon GO type chart heatmap with attack and defense summaries.
3. **宝可梦图鉴 / Pokédex**: searchable Pokémon GO-oriented Pokédex plus a CP calculator.

The project is intentionally small. Apparently that is now a feature because the previous version had enough duplicated data files to qualify as a tiny bureaucracy.

## Repository layout

```text
NeatDuck_Timeline/
├── data/
│   ├── events.csv              # canonical public event CSV consumed by the extension
│   ├── events.manual.csv       # optional manually reviewed events
│   ├── pokemon_go.csv          # unified, non-redundant Pokédex CSV export
│   └── manifest.json           # data build metadata
├── assets/
│   └── pokemon_go.json         # unified type chart + Pokédex + CPM + CP verification data
├── scripts/
│   ├── update_data.py          # LeekDuck scraper / CSV updater
│   ├── normalize_event_fixture.py
│   ├── js_event_csv_runner.mjs
│   └── CompareCsv.java         # strict byte-for-byte CSV comparator
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── core.js
│   ├── content.js
│   ├── standalone.html
│   ├── standalone.js
│   ├── info.js
│   ├── timeline.css
│   ├── assets/pokemon_go.json
│   └── data/pokemon_go.csv
├── packed_extension/
│   └── NeatDuck_Timeline_v1.0.7_extension.zip
└── tests/fixtures/events_fixture.json
```

Removed duplicated runtime data files:

```text
assets/pokemon.json
assets/pokemon_extra.json
data/pokemon.csv
extension/assets/pokemon.json
extension/assets/pokemon_extra.json
extension/data/pokemon.csv
```

The extension now reads `assets/pokemon_go.json` and `data/pokemon_go.csv` only for Pokédex/type/CP data.

## Install the extension

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension/` folder.
6. Click the NeatDuck extension icon to open the standalone page, or open `https://leekduck.com/events/` and use the embedded panel.

## Event Calendar tab

The calendar tab opens by default in **linear timeline / this week** mode.

Toolbar controls:

- **Today / This Week / This Month**: changes only the visible date range. It does not switch between timeline and month view.
- **Mode**: toggles between linear timeline and month view.
- **Time Zone**: choose Browser Local, UTC, or UTC-12 through UTC+14. Each offset label includes at least three representative cities.
- **Page Update**: scans the current LeekDuck page and merges results into local history.
- **Cloud Update**: pulls the canonical CSV from GitHub.
- **Export Events CSV**: exports the current event cache using the canonical CSV schema.
- **Export Log File**: exports a small diagnostic JSON file.
- **Clear Selection**: clears selected events.

Behavior changes in v1.0.7:

- Hover popup hide delay defaults to **600 ms**.
- Mouse wheel immediately hides any hover popup.
- Shading begins at the event start edge, not after the visible event block.
- The month view follows the same lane/category ordering as the linear timeline.
- Today is highlighted with a stronger border in month view.
- Switching to Type Matchup or Pokédex hides the calendar and legend. Scroll/click inside those tabs no longer jumps back to the calendar.
- The LeekDuck embedded view is centered across the whole page instead of being biased to the right.

### Event/time robustness

`core.js` and `scripts/update_data.py` now write the same canonical CSV columns:

```csv
uid,source,title,shortTitle,category,lane,sub,overlay,overlayTargetSub,start,endKnown,endInferred,href,timeZone,timeZoneLabel,isFixedTimeZone,isLocal,status,firstSeenAt,lastSeenAt,rawText
```

The parser keeps fixed-timezone events, such as Copenhagen events in CEST, distinct from local-time events. Generic future events with undecided content, such as a placeholder “Mega Raid Day”, stay generic and no longer become fake titles like “Mega Mega”. Civilization inches forward.

## Type Matchup tab

The Type Matchup tab has one tab-specific toolbar action: **Export Type CSV**.

Layout:

- Left: Pokémon GO type heatmap.
  - Column width: 40 px.
  - Row height: 35 px.
  - Multipliers are shown with at most two decimals.
  - Type labels use same-size centered badges.
  - Click a row/cell to choose the attacking type.
  - Click one or two defense columns to choose defending type(s). The two defense columns cannot be the same.
  - Selected row and columns are highlighted.
- Right top third: attack view, showing the selected attack type against the selected single/dual defense combination.
- Right bottom two thirds: defense view, grouping incoming attack types into:
  - 超级有效 / Double super effective
  - 有效 / Super effective
  - 一般 / Neutral
  - 抗性 / Resisted
  - 超级抗性 / Double resisted

The previous explanatory joke sentence was removed to save space. Mourning period: zero seconds.

## Pokédex tab

Toolbar controls:

- Search box: accepts Chinese, English, Japanese, number, form, type, and category text.
- Generation filter: includes generation number and representative game versions.
- Special category filter:
  - Can Mega
  - Legendary
  - Mythical
  - Form change
  - Fusion
  - Verified Pokémon GO CP data
- Row count: 50 / 100 / 200 / 500 / all.
- Export Pokédex CSV.

Removed from the UI/data pages:

- Dynamax
- Gigantamax
- the old Max-info tab

### CP calculator

Select a Pokémon from the table, then set:

- Level, including half-level steps from 1 to 50.
- IV Attack / Defense / Stamina using sliders or the triangular IV selector.

Formula:

```text
CP = floor((BaseAttack + IVAttack) × sqrt(BaseDefense + IVDefense) × sqrt(BaseStamina + IVStamina) × CPM(Level)^2 / 10)
minimum CP = 10
```

The CPM table is embedded in `assets/pokemon_go.json`.

Verification cases included in `assets/pokemon_go.json`:

| Case | Expected | Computed |
|---|---:|---:|
| Black Kyurem, 15/15/15, Lv50 | 5206 | 5206 |
| Zamazenta Crowned Shield, 13/15/15, Lv50 | 4681 | 4681 |
| Ho-Oh, 15/15/15, Lv50 | 4367 | 4367 |
| Metagross, 15/15/15, Lv50 | 4286 | 4286 |
| Kyogre, 15/15/15, Lv50 | 4652 | 4652 |
| Rhyperior, 15/15/15, Lv50 | 4221 | 4221 |
| Hydreigon, 15/15/15, Lv50 | 4098 | 4098 |

Note: the requested “13/15/15 Lv50 Zamazenta Hero of Many Battles = 4681” conflicts with current public Pokémon GO stats. The calculator labels the matching case as **Crowned Shield** because 4681 matches the Crowned Shield stats used by the verification table.

## Updating event data

Run the updater in a network-enabled environment:

```bash
python scripts/update_data.py
```

The updater writes:

```text
data/events.csv
data/manifest.json
data/snapshot-latest.json
data/detail_cache.json
```

The extension uses GitHub raw CSV by default:

```text
https://raw.githubusercontent.com/Yang-Zhang-717/NeatDuck_Timeline/main/data/events.csv
```

## Strict CSV comparison test

The extension parser is JavaScript, not Java. The test harness runs:

1. Python normalization through `scripts/normalize_event_fixture.py`.
2. JavaScript extension serialization through Node.js and `extension/core.js`.
3. Java byte-for-byte comparison through `scripts/CompareCsv.java`.

```bash
python scripts/normalize_event_fixture.py tests/fixtures/events_fixture.json tmp_test/python_events.csv
node scripts/js_event_csv_runner.mjs tests/fixtures/events_fixture.json tmp_test/js_events.csv
javac scripts/CompareCsv.java
java -cp scripts CompareCsv tmp_test/python_events.csv tmp_test/js_events.csv
```

Expected output:

```text
CSV byte-for-byte match: tmp_test/python_events.csv == tmp_test/js_events.csv
```
