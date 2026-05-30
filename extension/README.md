# NeatDuck_Timeline v1.0.7

A compact Chrome extension / standalone timeline for Pokémon GO event planning. It prefers the public GitHub CSV, supports manual page scraping, renders timeline/month views, exports selected events, and includes Pokémon reference pages.

## v1.0.7 changes

- GitHub CSV is now the preferred data source. Page scraping runs only when the user clicks Data Update / 数据更新.
- Added display time-zone control from UTC-12 through UTC+14, using a representative popular city per offset. Fixed-time-zone events keep their original label and receive a dashed border.
- GitHub Python scraper and browser parser both export/read `timeZone`, `timeZoneLabel`, and `isFixedTimeZone` so event times line up instead of performing the usual ritual of disagreeing by one planet rotation.
- Top-level tabs are Activity Calendar / 属性克制 / 宝可梦图鉴 / 极巨化. Default launch is current week + linear timeline; hover popups persist for 600 ms.
- One button toggles linear timeline/month view; Today / This Week / This Month only changes range.
- Shading begins at the activity start, and embedded LeekDuck placement shifts left.
- Month view follows the same lane order as the linear timeline.
- Type Matchup supports click-ordered dual defender selection; Pokédex supports full view/generation filter/Chinese search; Max info has filled CP gaps and Max/G-Max power notes.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this extracted extension folder.
5. Open `https://leekduck.com/events/`, or click the extension icon for the standalone page.

## Data source

Default remote CSV:

```text
https://raw.githubusercontent.com/Yang-Zhang-717/NeatDuck_Timeline/main/data/events.csv
```

Do not put GitHub write tokens in the extension. Browser storage is not a bank vault, no matter how confidently browsers wear little lock icons.

## Trademark / affiliation note

This project is not affiliated with, endorsed by, or sponsored by Leek Duck, Niantic, Nintendo, The Pokémon Company, or Game Freak. It is a personal planning helper that reads public event information and user-provided/reference data.
