# NeatDuck Timeline v1.0.7

NeatDuck Timeline is a Chrome extension and GitHub-backed data repo for Pokémon GO event planning. It started as a timeline. It has now, because apparently one timeline was not enough for civilization, become a four-tab planning panel:

1. **Activity Calendar**
2. **属性克制 / Type Matchup**
3. **宝可梦图鉴 / Pokédex**
4. **极巨化 / Dynamax & Gigantamax**

The tabs are top-level and independent. Switching to Type Matchup, Pokédex, or Dynamax hides the calendar SVG, the left legend, and calendar-only controls. Wheel and click handlers are guarded so a non-calendar tab should not suddenly teleport you back to the timeline.

## What changed in v1.0.7

### Layout and tabs

- Moved the plugin frame to a centered layout relative to the page.
- Promoted Activity Calendar, Type Matchup, Pokédex, and Dynamax into true top-level tabs.
- Split the toolbar into:
  - **left/calendar-only controls**: Today, This Week, This Month, Timeline/Month toggle, Data Update.
  - **right/common controls**: language, time zone, settings, export, ICS, email log, clear selection, standalone page, cloud update.
- Default opening view is now **linear timeline + this week**.
- Default tooltip hover persistence is now **600 ms**.
- Mouse wheel hides the hover tooltip and only zooms the calendar when the Activity Calendar tab is active.
- Shading now starts at the event's visible start position instead of beginning after the base event block.
- SVG rect widths are clamped before rendering to avoid errors like:

```text
Error: <rect> attribute width: A negative value is not valid.
```

### Activity Calendar

The linear timeline and month view are now one calendar tab. The **Timeline / Month** button toggles layout. The **Today / This Week / This Month** buttons only change the date range; they no longer switch the view mode.

The month view uses the same lane/category ordering as the linear timeline, so events no longer reorder into a tiny calendar goblin mess.

### Time zones

The display time-zone selector now covers offsets from UTC−12 through UTC+14, represented by a popular city for each offset:

- UTC−12 Baker Island
- UTC−11 Pago Pago
- UTC−10 Honolulu
- UTC−09 Anchorage
- UTC−08 Los Angeles
- UTC−07 Denver
- UTC−06 Chicago
- UTC−05 New York
- UTC−04 Halifax
- UTC−03 São Paulo
- UTC−02 South Georgia
- UTC−01 Azores
- UTC±00 London / UTC
- UTC+01 Paris
- UTC+02 Athens
- UTC+03 Moscow
- UTC+03:30 Tehran
- UTC+04 Dubai
- UTC+04:30 Kabul
- UTC+05 Karachi
- UTC+05:30 Delhi
- UTC+05:45 Kathmandu
- UTC+06 Dhaka
- UTC+06:30 Yangon
- UTC+07 Bangkok
- UTC+08 Beijing
- UTC+08:45 Eucla
- UTC+09 Tokyo
- UTC+09:30 Adelaide
- UTC+10 Sydney
- UTC+10:30 Lord Howe
- UTC+11 Nouméa
- UTC+12 Auckland
- UTC+12:45 Chatham
- UTC+13 Nukuʻalofa
- UTC+14 Kiritimati

The extension and GitHub updater both preserve `timeZone`, `timeZoneLabel`, and `isFixedTimeZone`. Events explicitly marked with a fixed zone such as JST, PT/PDT/PST, ET/EDT/EST, CT/CDT/CST, MT/MDT/MST, CEST/CET, BST, UTC/GMT, or UTC offsets are stored as fixed-time events. Local Time events remain floating local-time events.

## Tab usage

### 1. Activity Calendar

Use this tab to inspect LeekDuck event timelines.

Controls:

- **Today**: show the current local day in the selected display time zone.
- **This Week**: show Monday through next Monday.
- **This Month**: show the current calendar month.
- **Timeline / Month**: toggle linear timeline and month grid without changing the date range.
- **Data Update**: rescan the LeekDuck page DOM.
- **Cloud Update**: fetch the repo-hosted `data/events.csv`.
- **Time Zone**: change the display zone while preserving event semantics.
- **Export Events CSV / Export ICS / Email Log**: export selected events; if nothing is selected, exports visible events.

### 2. 属性克制 / Type Matchup

This tab uses Pokémon GO type multipliers.

- Click an attacking row or cell to set the attacking type.
- Click defender type headers or chips to select up to two defender types.
- Duplicate defender types are blocked.
- Attack view and defense view share the same defender-type combo.
- Defense groups are compactly displayed as:
  - 超级有效 / Super effective
  - 有效 / Effective
  - 一般 / Neutral
  - 无效 / Resisted
  - 超级无效 / Double resisted

### 3. 宝可梦图鉴 / Pokédex

The Pokédex supports full-table browsing, Chinese search, generation filters, and category filters.

Filters:

- All
- Mega-capable
- Dynamax-capable
- Gigantamax-capable
- Legendary
- Mythical
- Generation 1 through 9, with corresponding main game versions shown in the selector.

Generation mapping included:

| Generation | Region | Main versions shown |
|---:|---|---|
| 1 | Kanto / 关都 | Red / Green / Blue / Yellow |
| 2 | Johto / 城都 | Gold / Silver / Crystal |
| 3 | Hoenn / 丰缘 | Ruby / Sapphire / Emerald, FireRed / LeafGreen |
| 4 | Sinnoh / 神奥 | Diamond / Pearl / Platinum, HeartGold / SoulSilver |
| 5 | Unova / 合众 | Black / White, Black 2 / White 2 |
| 6 | Kalos / 卡洛斯 | X / Y, Omega Ruby / Alpha Sapphire |
| 7 | Alola / 阿罗拉 | Sun / Moon, Ultra Sun / Ultra Moon, Let’s Go |
| 8 | Galar / 伽勒尔 | Sword / Shield, Brilliant Diamond / Shining Pearl, Legends: Arceus |
| 9 | Paldea / 帕底亚 | Scarlet / Violet |

### CP / IV calculation

For a selected Pokémon, the side card calculates CP from GO base stats, IV, level, and CPM:

```text
CP = floor((BaseAttack + AttackIV) × sqrt(BaseDefense + DefenseIV) × sqrt(BaseStamina + StaminaIV) × CPM² / 10)
```

Minimum CP is 10.

The card also shows level-adjusted effective stats:

```text
Effective Attack  = (BaseAttack + AttackIV) × CPM
Effective Defense = (BaseDefense + DefenseIV) × CPM
Effective HP      = floor((BaseStamina + StaminaIV) × CPM)
```

The triangular rose chart visualizes Attack IV, Defense IV, and HP IV relative to the selected Pokémon's GO stats.

GO stats are derived from main-series base stats using the common Pokémon GO stat conversion model used by public calculators:

```text
SpeedMod  = 1 + (Speed - 75) / 500
GO Attack = round(2 × round(7/8 × max(Atk, SpA) + 1/8 × min(Atk, SpA)) × SpeedMod)
GO Defense = round(2 × (5/8 × max(Def, SpD) + 3/8 × min(Def, SpD)) × SpeedMod)
GO Stamina = floor(1.75 × HP + 50)
```

Known public CP values in the Dynamax table are explicitly filled, and remaining missing CP values are generated from the GO-stat conversion and CPM table. This avoids blank Lv40/Lv50 cells while still making it clear what is calculated rather than scraped from Niantic internals.

### 4. 极巨化 / Dynamax & Gigantamax

The Dynamax tab now has complete Lv40 and Lv50 CP fields for the bundled table.

Move-power reference used in the tab:

```text
Dynamax Max Attack Lv1 / Lv2 / Lv3 = 250 / 300 / 350
Gigantamax G-Max Lv1 / Lv2 / Lv3 = 350 / 400 / 450
```

The old column name `平` has been renamed in the UI to a readable score label:

```text
Table score = GO Attack × Move Power / 1000
```

For a level/IV-adjusted estimate:

```text
Adjusted score = (GO Attack + Attack IV) × CPM × Move Power / 100
```

## GitHub data updater

Run:

```bash
python -m pip install -r requirements.txt
python scripts/update_data.py
```

The updater:

- reads the LeekDuck events page;
- prefers event detail pages when available;
- exports fixed-time-zone metadata;
- cleans duplicated titles such as `Mega Mega`;
- merges manual rows from `data/events.manual.csv`;
- writes:
  - `data/events.csv`
  - `data/manifest.json`
  - `data/snapshot-latest.json`
  - `extension/data/events.csv`

## Chrome extension installation

1. Download or unzip the extension package.
2. Open Chrome and go to:

```text
chrome://extensions
```

3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension/` folder.
6. Open:

```text
https://leekduck.com/events/
```

The panel appears above the event page content.

## Repo structure

```text
extension/              Chrome extension source
extension/assets/       Pokémon reference data
extension/data/         packaged fallback event CSV
scripts/update_data.py  GitHub/CI event updater
data/events.csv         public event library
assets/pokemon_extra.json enriched Pokédex/type/max data
```

## Notes

This project uses public web data and bundled reference tables. Pokémon GO live data can change. When Niantic changes move powers, CPM values, forms, event text, or Max mechanics again, because apparently stability would be too generous, rerun the updater and refresh the static data.
