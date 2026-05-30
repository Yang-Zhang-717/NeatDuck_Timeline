# NeatDuck_Timeline v1.0.7 Extension

This folder is the unpacked Chrome extension source. Load this directory in `chrome://extensions` during development. The packaged zip lives in `dist/`, because source code and shipping boxes are different objects, a concept humanity keeps rediscovering with zip files.

## Main UI

- Extension icon opens a popup with two destinations: standalone NeatDuck page or LeekDuck Events.
- Top-left tabs: Event Calendar, Type Matchup, Pokédex.
- Top-right common controls: language and settings.
- Tab-specific controls only appear inside that tab.

## Event Calendar

- Default view: this week, linear timeline.
- Today / This Week / This Month only changes time range.
- Mode switches linear timeline and month view.
- Tooltip delay defaults to 600 ms and disappears immediately on wheel scroll.
- Cloud Update reads the GitHub CSV.
- Page Update scans the current LeekDuck page.
- Display time zone supports UTC-12 through UTC+14.

## Type Matchup

The heatmap uses Pokémon GO multipliers. Pick one attacking row and one or two defending columns. The right panel shows attacking and defending summaries. Export button outputs CSV.

## Pokédex and CP calculator

Search supports Chinese, English, ID, and type names. Filters include generation and compact special categories. Dynamax/Gigantamax reference content has been removed.

CP formula:

```text
floor((Atk + IVAtk) × sqrt(Def + IVDef) × sqrt(Sta + IVSta) × CPM² / 10)
```

Lv50 CPM: `0.84029999`.

## Data

The extension uses one canonical Pokémon asset:

```text
assets/pokemon.json
```

`pokemon_extra.json` and duplicated extension CSV Pokémon assets were removed.
