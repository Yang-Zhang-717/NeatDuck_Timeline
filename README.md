# NeatDuck Timeline / NeatDuck 时间轴

A GitHub-backed data repository and Chrome extension source tree for a compact Pokémon GO event timeline. It includes:

- public event CSV data used by the extension;
- a Python scraper/merger for Leek Duck event pages;
- the Chrome extension source under `extension/`;
- Pokémon reference data for type matchups, Pokédex, and Max/Gigantamax pages.

一个基于 GitHub 数据源的 Pokémon GO 活动时间轴项目。仓库包含：

- 供插件读取的公开活动 CSV；
- 用于抓取和合并 Leek Duck 活动页的 Python 脚本；
- `extension/` 目录中的 Chrome 插件源码；
- 属性克制、图鉴、极巨化/超极巨化信息页所需的 Pokémon 参考数据。

## What changed in v1.0.7 / v1.0.7 更新

- The extension now prefers GitHub data first. Page scraping happens only when the user clicks **Data Update / 数据更新**.
- Events now carry `timeZone`, `timeZoneLabel`, and `isFixedTimeZone`, so the Python scraper and browser extension render fixed-time-zone activities consistently.
- Added a display time-zone selector covering UTC-12 through UTC+14, shown as one representative city per offset.
- Fixed-time-zone events keep `timeZone`, `timeZoneLabel`, and `isFixedTimeZone`; Local Time events remain local to the selected/browser zone.
- One toggle switches linear timeline ↔ month view; `Today` / `This Week` / `This Month` only changes the visible range.
- Default view is the current week in linear timeline mode, with hover popups kept for 600 ms.
- Month view now follows the same lane order as the linear timeline.
- Top-level tabs are now Activity Calendar / 属性克制 / 宝可梦图鉴 / 极巨化.
- Type matchup supports click-ordered dual defender selection; Pokédex supports full view, generation filter, and Chinese search; Max info has filled CP gaps and Max/G-Max power notes.

中文概括：优先用 GitHub 数据；手动点击才重新爬网页；顶层四 tab；默认本周直线时间轴；悬停窗口 600 ms；时区从 UTC-12 到 UTC+14；时间轴/月视图合并成一个切换；今天/本周/本月只改范围；月视图按直线时间轴顺序排；属性克制支持最多两个防御属性；图鉴支持世代筛选和中文搜索；极巨化补了 CP 和技能威力说明。

## Repository layout / 仓库结构

```text
.
├── data/
│   ├── events.csv              # public event library / 活动库
│   ├── events.manual.csv       # optional manual overrides / 手动补充
│   ├── manifest.json           # data manifest / 数据元信息
│   └── pokemon.csv             # compact Pokémon table / 精简图鉴表
├── assets/
│   ├── pokemon.json            # existing Pokémon asset / 旧版图鉴资源
│   └── pokemon_extra.json      # type chart + Pokédex + Max info / 新信息页数据
├── extension/                  # unpacked Chrome extension source / 插件源码
├── dist/                       # packaged extension zip / 插件压缩包
├── scripts/update_data.py      # scraper + CSV merger / 抓取与合并脚本
├── schema/events.schema.json   # event row schema / 活动行结构
└── .github/workflows/          # scheduled data refresh / 定时更新
```

## Install the extension / 安装插件

### Download packaged zip / 下载打包版

The repo includes `dist/NeatDuck_Timeline_v1.0.7_extension.zip`. Download and unzip it, then load the extracted folder in Chrome. Keeping the zip in `dist/` is useful because normal humans do not enjoy rebuilding extensions just to click a calendar.

中文：仓库内已包含 `dist/NeatDuck_Timeline_v1.0.7_extension.zip`。下载、解压，然后在 Chrome 里加载解压后的文件夹即可。


1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `extension/` directory.
5. Open `https://leekduck.com/events/`, or click the extension icon to open the standalone timeline.

中文：打开 `chrome://extensions`，开启开发者模式，选择“加载已解压的扩展程序”，选中 `extension/` 目录。

## Update event data locally / 本地更新活动数据

```bash
cd ~/00_self_defined/1_gits/NeatDuck_Timeline
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/update_data.py
git status
```

The script merges fresh public scrape results with existing history and optional `data/events.manual.csv`. Existing rows are not thrown into the void just because a site temporarily hides them, which is apparently a thing websites like to do for sport.

脚本会把新抓取结果、历史数据和可选的 `data/events.manual.csv` 合并。旧活动不会因为网页临时隐藏就立刻丢失。

## Reset this GitHub repo from the delivered zip / 用交付压缩包重置仓库

Assuming the delivered reset package is saved at `~/Downloads/NeatDuck_Timeline_github_repo_reset_v1.0.7.zip`:

```bash
mkdir -p ~/00_self_defined/1_gits
cd ~/00_self_defined/1_gits

# Clone once. Replace the URL if your remote is different.
git clone git@github.com:Yang-Zhang-717/NeatDuck_Timeline.git NeatDuck_Timeline
cd ~/00_self_defined/1_gits/NeatDuck_Timeline

git status

# Remove tracked/untracked files, then unpack the reset package into this repo.
# Check the path before pressing Enter, because rm -rf is not a toy, despite humanity's long-running experiment.
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
unzip ~/Downloads/NeatDuck_Timeline_github_repo_reset_v1.0.7.zip -d .

# Sanity checks
python3 -m py_compile scripts/update_data.py
python3 -m json.tool data/manifest.json >/dev/null
python3 -m json.tool assets/pokemon_extra.json >/dev/null

git status
git add -A
git commit -m "Reset NeatDuck Timeline v1.0.7"
git push origin main
```

HTTPS remote alternative:

```bash
git clone https://github.com/Yang-Zhang-717/NeatDuck_Timeline.git NeatDuck_Timeline
```

## GitHub Actions / 自动更新

The workflow `.github/workflows/update-data.yml` runs twice daily and can also be triggered manually from GitHub Actions. It commits updated `data/events.csv`, `data/manifest.json`, `data/snapshot-latest.json`, and `data/detail_cache.json` when changes exist.

GitHub Actions 会每天两次自动运行，也可以手动触发。若数据有变化，它会自动提交更新后的数据文件。

## Data notes / 数据说明

- Main event data is in `data/events.csv`.
- Time-zone fields:
  - `timeZone`: canonical IANA zone or `local`.
  - `timeZoneLabel`: original label such as `JST`, `PDT`, `PT`, or `Local Time`.
  - `isFixedTimeZone`: `1` for fixed-zone events, blank otherwise.
- Pokémon reference data is generated from the uploaded `Pokemon.xlsx` plus public PokéAPI CSV/reference data.
- Type matchup uses Pokémon GO-style single-type multipliers: `1.6`, `1`, `0.625`, `0.390625`; dual defending types multiply the two single-type results.

## Disclaimer / 声明

This project is not affiliated with, endorsed by, or sponsored by Leek Duck, Niantic, Nintendo, The Pokémon Company, or Game Freak.

本项目与 Leek Duck、Niantic、Nintendo、The Pokémon Company、Game Freak 均无官方关联、认可或赞助关系。
