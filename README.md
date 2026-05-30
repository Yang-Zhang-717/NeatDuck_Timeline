# NeatDuck_Timeline v1.0.6

A compact Chrome extension / standalone timeline for Pokémon GO event planning. It prefers the public GitHub CSV, supports manual page scraping, renders timeline/month views, exports selected events, and includes Pokémon reference pages.

## v1.0.6 changes

- GitHub CSV is now the preferred data source. Page scraping runs only when the user clicks Data Update / 数据更新.
- Added display time-zone control: browser local, UTC, PT/Pacific, Tokyo, Copenhagen, and London. Fixed-time-zone events keep their original label and receive a dashed border.
- GitHub Python scraper and browser parser both export/read `timeZone`, `timeZoneLabel`, and `isFixedTimeZone` so event times line up instead of performing the usual ritual of disagreeing by one planet rotation.
- Timeline buttons now behave separately: Timeline / Month switches view type; Today / This Week / This Month only changes range.
- Month view has taller week rows, thicker week separators, and lane packing to avoid overlapping blocks.
- Timeline outer margins are tighter, period blocks are clearer, short labels have more room, and event block borders/shadows are more visible.
- Added Pokémon reference pages: Type Matchup, Pokédex, and Max info.

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
