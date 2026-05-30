# NeatDuck Timeline / NeatDuck 时间轴

NeatDuck Timeline is a GitHub-backed Chrome extension and data repository for Pokémon GO event planning. It renders Leek Duck events as a compact activity calendar and adds three independent reference tabs: type matchups, Pokédex, and Dynamax/Gigantamax data.

NeatDuck Timeline 是一个基于 GitHub CSV 数据源的 Chrome 插件和资料仓库，用于整理 Pokémon GO 活动日程，并附带属性克制、宝可梦图鉴、极巨化/超极巨化资料页。是的，日程、属性、图鉴和极巨化终于被隔离开了，不再像一锅被鼠标滚轮搅乱的炖菜。

## What changed in v1.0.7 / v1.0.7 更新

- Rebuilt the UI into four top-level tabs:
  - **Activity Calendar**
  - **属性克制 / Type Chart**
  - **宝可梦图鉴 / Pokédex**
  - **极巨化 / Dynamax**
- Tabs are isolated. Switching to Type Chart, Pokédex, or Dynamax hides the calendar SVG and the left legend, so clicks/wheel gestures no longer jump back into the timeline.
- Header controls are separated:
  - left side: current-tab controls such as Today / This Week / This Month / Timeline / Month View;
  - right side: common controls such as language, time zone, settings, standalone page, cloud update, exports.
- Default extension view is now **linear timeline + current week range**.
- Tooltip persistence default changed to **600 ms**. Scrolling the timeline immediately hides the tooltip.
- Timeline wrapper is centered and nudged left to avoid the previous right-biased layout.
- Fixed negative SVG width in timeline shading, preventing errors like:

```text
Error: <rect> attribute width: A negative value is not valid.
```

- Shading now starts at the visible end of the actual activity block, not before the activity has begun.
- Added full display time-zone selector from UTC-12 through UTC+14, using one popular city per offset group.
- Event serialization, CSV, cache, and Python scraper now preserve `timeZone`, `timeZoneLabel`, and `isFixedTimeZone` consistently.
- Seeded `data/events.csv` so cloud update no longer pulls an empty CSV. The seed includes Memories in Motion, GBL Memories in Motion, Mega Medicham raids, GO Pass: June, and GO Fest 2026 Global.
- Added protections against fake duplicated Mega titles such as `Mega Mega`.
- Type Chart now supports click-order defender multi-select, max two defender types, no duplicate defender type.
- Attack and defense perspectives share the same defender type pair.
- Pokédex now supports generation/category filters, Chinese search, GO stat columns, IV sliders, triangular IV radar, and CP calculation.
- Dynamax table has missing LV40/LV50 CP filled and damage headers renamed from `平` to `平均伤害 / Avg damage`.

## Repository layout / 仓库结构

```text
.
├── data/
│   ├── events.csv              # public event library / 活动库
│   ├── events.manual.csv       # optional manual overrides / 手动补充
│   ├── manifest.json           # data manifest / 数据元信息
│   └── pokemon.csv             # compact Pokémon table / 精简图鉴表
├── assets/
│   ├── pokemon.json            # Pokémon name lookup asset / 名称翻译资源
│   └── pokemon_extra.json      # type chart + Pokédex + Max info / 信息页数据
├── extension/                  # unpacked Chrome extension source / 插件源码
├── dist/                       # packaged extension zip / 插件压缩包
├── scripts/update_data.py      # Leek Duck scraper + CSV merger / 抓取与合并脚本
├── schema/events.schema.json   # event row schema / 活动行结构
└── .github/workflows/          # scheduled data refresh / 定时更新
```

## Install the extension / 安装插件

1. Download or unzip this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension/` directory.
6. Open `https://leekduck.com/events/`, or click the extension icon to open `standalone.html`.

Current extension-icon behavior: clicking the Chrome extension action opens the standalone NeatDuck page in a new tab.

## Tab guide / Tab 使用说明

### 1. Activity Calendar

This is the main event calendar.

- **Timeline / Month View** switches only the rendering mode.
- **Today / This Week / This Month** changes only the visible date range.
- **Data Update** scrapes the current Leek Duck page and merges it into local history.
- **Cloud Update** fetches the GitHub CSV from `data/events.csv`.
- Fixed-zone events, such as PT/JST events, keep their source time-zone metadata and appear with a dashed border.
- Local-time events remain floating local events, because Pokémon GO schedules often mean “10 AM wherever the player is,” and the universe apparently considers that normal.

### 2. 属性克制 / Type Chart

The Type Chart uses Pokémon GO multipliers:

```text
Super effective: 1.6
Neutral:         1
Resisted:        0.625
Double resisted: 0.390625
```

For dual-type defenders, the two defender multipliers are multiplied:

```text
final_multiplier = multiplier(attack_type, defender_type_1) × multiplier(attack_type, defender_type_2)
```

Click defender types in order to select up to two types. Selecting a third type drops the oldest one. Selecting the same type again moves it to the latest position rather than creating a duplicate, because even a browser extension deserves standards.

The defense view groups incoming attack types into:

- 超级有效 / Super effective
- 有效 / Effective
- 一般 / Neutral
- 无效 / Resisted
- 超级无效 / Double resisted

### 3. 宝可梦图鉴 / Pokédex

The Pokédex tab supports:

- continuous table display;
- Chinese, English, Japanese, number, type, and form search;
- generation filter;
- category filter: Mega-capable, Dynamax-capable, Gigantamax-capable, Legendary, Mythical;
- GO Attack / Defense / Stamina columns;
- IV controls and triangular IV radar;
- automatic CP calculation from base stats, IVs, and level.

Generation labels include numeric generation and corresponding main game versions, for example Gen 1 红/绿/蓝/皮卡丘 and Gen 4 钻石/珍珠/白金/心金/魂银.

### 4. 极巨化 / Dynamax

The Dynamax tab includes Max/G-Max data from `assets/pokemon_extra.json`:

- LV40 CP;
- LV50 CP;
- type badges;
- fast move notes;
- attack stat where available;
- Max Move names;
- G-Max Move names;
- average damage columns.

The old `平` column is renamed to **平均伤害 / Avg damage**. Missing CP values for Falinks, Passimian, Machamp, Urshifu, Unfezant, Kingler, Inteleon, and Entei are filled.

## CP formula / CP 计算公式

The Pokédex CP calculator uses the Pokémon GO CP formula:

```text
CP = floor((BaseAttack + AttackIV)
     × sqrt(BaseDefense + DefenseIV)
     × sqrt(BaseStamina + StaminaIV)
     × CPM(level)^2 / 10)
```

Minimum CP is 10:

```text
CP = max(10, CP)
```

Where:

- `BaseAttack`, `BaseDefense`, `BaseStamina` are Pokémon GO base stats;
- `AttackIV`, `DefenseIV`, `StaminaIV` range from 0 to 15;
- `CPM(level)` is the Pokémon GO CP multiplier for levels 1 to 50 in 0.5 increments.

When direct Pokémon GO base stats are not present in the local data, the extension fills them using the common main-series-to-GO conversion approximation:

```text
SpeedMod = 1 + (Speed - 75) / 500
GO Attack  = round(2 × (max(Atk, SpA) × 0.875 + min(Atk, SpA) × 0.125) × SpeedMod)
GO Defense = round(2 × (max(Def, SpD) × 0.875 + min(Def, SpD) × 0.125) × SpeedMod)
GO Stamina = floor(HP × 1.75 + 50)
```

## Event time-zone handling / 活动时区处理

`data/events.csv` contains these fields:

```text
timeZone,timeZoneLabel,isFixedTimeZone
```

Rules:

- `Local Time` events are stored as floating local datetimes without converting them to UTC.
- Named time-zone events such as PT, PDT, JST, UTC are stored as fixed instants and keep the source zone label.
- The extension and Python scraper both read and write the same fields, preventing the classic “cloud says one thing, browser says another” disaster goblin.

## Update event data locally / 本地更新活动数据

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/update_data.py
```

The script merges fresh Leek Duck scrape results with existing history and optional `data/events.manual.csv`. Existing rows are preserved unless an updated row for the same normalized URL/title identity replaces them.

## Reset this GitHub repo from the delivered zip / 用交付压缩包重置仓库

```bash
mkdir -p ~/00_self_defined/1_gits
cd ~/00_self_defined/1_gits
git clone git@github.com:Yang-Zhang-717/NeatDuck_Timeline.git NeatDuck_Timeline
cd NeatDuck_Timeline
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
unzip ~/Downloads/NeatDuck_Timeline_github_repo_reset_v1.0.7.zip -d .
python3 -m py_compile scripts/update_data.py
python3 -m json.tool data/manifest.json >/dev/null
python3 -m json.tool assets/pokemon_extra.json >/dev/null
git add -A
git commit -m "Reset NeatDuck Timeline v1.0.7"
git push origin main
```

HTTPS remote alternative:

```bash
git clone https://github.com/Yang-Zhang-717/NeatDuck_Timeline.git NeatDuck_Timeline
```

## GitHub Actions / 自动更新

The workflow `.github/workflows/update-data.yml` runs on schedule and can be triggered manually from GitHub Actions. It commits updated event data when changes exist.

## Disclaimer / 声明

This project is not affiliated with, endorsed by, or sponsored by Leek Duck, Niantic, Nintendo, The Pokémon Company, or Game Freak.

本项目与 Leek Duck、Niantic、Nintendo、The Pokémon Company、Game Freak 均无官方关联、认可或赞助关系。
