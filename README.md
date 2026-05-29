# NeatDuck_Timeline public data

Public CSV data for NeatDuck_Timeline.

## Files

- `data/events.csv`: extension-readable event database.
- `data/events.manual.csv`: optional hand-maintained source CSV.
- `data/manifest.json`: update metadata.
- `assets/pokemon.json`: Pokémon name lookup seed.
- `scripts/update_data.py`: validates, dedupes, and republishes `events.csv`.
- `.github/workflows/update-data.yml`: scheduled update twice daily, plus manual run.

## Public URL after GitHub Pages is enabled

```text
https://yang-zhang-717.github.io/NeatDuck_Timeline/data/events.csv
```

The extension defaults to that URL. Keep this repo public unless you move the URL into extension settings.

## Safer maintenance model

Do not put a GitHub personal access token inside a browser extension. The extension should read public data only. Updates should happen through GitHub, GitHub Actions, or your own backend.
