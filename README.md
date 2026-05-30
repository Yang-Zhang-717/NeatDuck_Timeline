# NeatDuck_Timeline public data repo / 公共数据仓库

NeatDuck_Timeline publishes extension-readable Pokémon GO event data and reference CSV files for the Chrome extension.

NeatDuck_Timeline 用这个仓库发布 Chrome extension 可读取的 Pokémon GO 活动数据与附加资料页 CSV。

Default event CSV URL / 默认活动 CSV：

```text
https://raw.githubusercontent.com/Yang-Zhang-717/NeatDuck_Timeline/main/data/events.csv
```

## What is inside / 内容

```text
data/events.csv              活动时间线数据，包含 isLocal/timeZone
data/events.manual.csv       手动维护活动，可被 Python updater 合并
data/manifest.json           数据仓库 manifest
data/type_chart.csv          Pokémon GO 属性克制表
data/type_names.csv          属性英文 / 简中 / 繁中名称
data/pokedex.csv             Pokémon 图鉴信息表
data/max.csv                 极巨化 / 超极巨化信息表
assets/pokemon.json          extension 辅助名称数据
schema/events.schema.json    events.csv 行结构说明
scripts/update_data.py       GitHub / 本地 Python 抓取与合并脚本
.github/workflows/update-data.yml  GitHub Actions 定时更新
extension/                   可直接 Load unpacked 的 Chrome extension 源码
dist/                        打包后的 extension zip
```

## v1.1.0 changes / v1.1.0 更新

- Added `isLocal,timeZone` to `events.csv` so the JavaScript extension and Python updater use the same time semantics.
- Local-time events stay at the same local wall-clock hour; fixed-zone events such as PT/JST/UTC shift under the page timezone selector.
- Extension source is now stored under `extension/`; a packaged extension zip can live under `dist/` for releases.
- Added type matchup, Pokédex, and Dynamax/Gigantamax CSV files generated from `Pokemon.xlsx`.
- README is bilingual for English and Chinese users.

## Local Python update / 本地更新活动数据

```bash
cd ~/00_self_defined/1_gits/NeatDuck_Timeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/update_data.py
```

The updater writes `data/events.csv`, `data/manifest.json`, and `data/snapshot-latest.json` when a scrape succeeds.

脚本成功抓取后会写入 `data/events.csv`、`data/manifest.json` 和 `data/snapshot-latest.json`。

## Full reset workflow on Linux / Linux 上彻底重置仓库

From a clean shell:

```bash
mkdir -p ~/00_self_defined/1_gits
cd ~/00_self_defined/1_gits

git clone git@github.com:Yang-Zhang-717/NeatDuck_Timeline.git
cd NeatDuck_Timeline

git checkout main
git pull --ff-only

# Remove tracked files from the working tree, then unpack this reset package.
git rm -r .
unzip /path/to/NeatDuck_Timeline_github_repo_reset_v1.1.0.zip -d .

git status
git add .
git commit -m "Reset NeatDuck Timeline v1.1.0"
git push origin main
```

If SSH is not configured, use HTTPS instead:

```bash
git clone https://github.com/Yang-Zhang-717/NeatDuck_Timeline.git
```

如果本地已有旧目录，而且需要清空后覆盖，请确认当前位置是目标仓库目录：

```bash
cd ~/00_self_defined/1_gits/NeatDuck_Timeline
git checkout main
git pull --ff-only
git rm -r .
unzip /path/to/NeatDuck_Timeline_github_repo_reset_v1.1.0.zip -d .
git add .
git commit -m "Reset NeatDuck Timeline v1.1.0"
git push origin main
```

## Extension packaging / 打包 extension

```bash
cd ~/00_self_defined/1_gits/NeatDuck_Timeline/extension
zip -r ../dist/NeatDuck_Timeline_v1.1.0_extension.zip . -x '*.DS_Store' '__MACOSX/*'
```

Chrome local install / Chrome 本地加载：

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click “Load unpacked”.
4. Select `~/00_self_defined/1_gits/NeatDuck_Timeline/extension`.

## Notes / 说明

This project is not affiliated with, endorsed by, or sponsored by Leek Duck, Niantic, or The Pokémon Company. Public webpages and CSVs can change; review generated data before committing.
