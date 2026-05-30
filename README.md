# NeatDuck Timeline / NeatDuck 时间轴

NeatDuck is a GitHub-backed Chrome extension for Pokémon GO event planning. The extension can run as an overlay on LeekDuck Events or as its own standalone page. The GitHub repo is the public data source; the extension reads `data/events.csv` on startup and can also refresh it from the cloud on demand, because apparently calendars now need cloud rituals too.

NeatDuck 是一个基于 GitHub 数据源的 Pokémon GO 活动规划插件。它既可以作为 LeekDuck Events 页面的 overlay 使用，也可以通过插件按钮打开独立页。插件启动时会读取 GitHub 的 `data/events.csv`，也支持手动云端更新。

## v1.0.7 更新重点

- 插件按钮现在先打开一个小弹窗，可分别跳转到 **Standalone / 独立页** 或 **LeekDuck Events**。
- 默认进入 **Event Calendar** 的本周 linear timeline；`Today / This Week / This Month` 只改变时间范围，不再偷偷切换视图。
- 默认 tooltip 停留时间改为 **600 ms**；滚轮触发时立即关闭悬停窗。
- LeekDuck overlay 在页面中水平居中，不再偏右到像是网页自己在躲你。
- 顶部左侧改为三个互不干扰的 tab：**Event Calendar / Type Matchup / Pokédex**；其它 tab 下不会显示 calendar 和左侧 legend。
- 顶部右侧保留公共按钮：语言、设置；tab 专属按钮只出现在对应 tab 上方。
- Event Calendar 增加 UTC-12 到 UTC+14 的显示时区选择，每个 offset 给出 3 个代表地点。
- Shading 从活动开始位置对齐；月视图按 timeline lane 顺序排版，强化 today 标记，并加粗相邻日期行边框。
- LeekDuck 解析器增强：处理 `Calculating...`、本地时间、固定时区、地点型 GO Fest、泛称 Mega Raid Day 等情况，避免 “Mega Mega” 这类假活动幽灵混进 timeline。
- Type Matchup 页精简为 heatmap + 攻击/防御视角，删除多余说明文字。
- Pokédex 页加入中文搜索、世代筛选、特殊类别筛选、分页和 CP 计算器。
- 极巨化/超极巨化参考内容已移除。若 LeekDuck 发布真实日程类活动，calendar 仍会按事件显示，不再作为独立资料页或图鉴筛选内容维护。
- Pokémon 数据去重：插件只使用 `assets/pokemon.json`；`data/pokemon.csv` 只是给人看的导出表。

## 三个 tab 怎么用

### 1. Event Calendar

按钮：

- **Today / This Week / This Month**：只改变当前显示时间范围。
- **Mode**：在 linear timeline 和 month view 之间切换。
- **Time Zone**：按 UTC offset 显示活动时间，范围 UTC-12 到 UTC+14。
- **Page Update**：从当前 LeekDuck 页面扫描活动。
- **Cloud Update**：从 GitHub raw CSV 拉取活动数据。
- **Export Event CSV**：导出当前可见或已选择活动。
- **Export Log File**：导出当前活动日志。
- **Clear Selection**：清除活动选择。

默认进入本周 linear timeline。月视图的活动顺序与 timeline lane 顺序一致。滚轮会立即清除悬停窗，避免 tooltip 像粘在鞋底的口香糖一样跟着你。

### 2. Type Matchup / 属性克制

- 左侧是 Pokémon GO 倍率 heatmap。
- 单元格列宽 40 px、行高 35 px，倍率最多显示 2 位小数。
- 点击一行选择攻击属性；点击 1 或 2 列选择防御属性，防御列不能重复。
- 被选中的行/列会高亮边框。
- 右侧上 1/3 是攻击视角，显示选中攻击属性打选中防御组合的复合倍率。
- 右侧下 2/3 是防御视角，把所有攻击属性按超级有效 / 有效 / 一般 / 抗性 / 超级抗性分组显示。
- 按钮只保留 **Export Type CSV**。

### 3. Pokédex / 宝可梦图鉴

- 支持中文、英文、编号、属性搜索。
- 一级筛选为世代，并补齐对应游戏版本。
- 二级筛选为特殊类别：Mega capable、Legendary、Mythical、Form-changing、Fusion。极巨化/超极巨化已删除。
- 表格可显示 50 / 100 / 200 / 500 / 全部。
- GO 种族值缺省的行明确标注 `GO stats missing`，不再假装数据库比现实更完整。
- 右侧 CP 计算器：先在表格选择 Pokémon，再设置 IV 三角玫瑰图和等级，自动计算 CP。

CP 公式：

```text
CP = floor((BaseAttack + IVAttack) × sqrt(BaseDefense + IVDefense) × sqrt(BaseStamina + IVStamina) × CPM² / 10)
```

其中 CPM 使用 Pokémon GO 的 Combat Power Multiplier。Lv50 使用 `0.84029999`。

已验证样例：

| Pokémon | IV / Lv | CP |
|---|---:|---:|
| 酋雷姆·捷克罗姆合体 / Black Kyurem | 15/15/15 Lv50 | 5206 |
| 藏玛然特 王盾形态 / Zamazenta Crowned Shield | 13/15/15 Lv50 | 4681 |
| 藏玛然特 百战勇者形态 / Zamazenta Hero | 13/15/15 Lv50 | 4297 |
| 凤王 / Ho-Oh | 15/15/15 Lv50 | 4367 |
| 巨金怪 / Metagross | 15/15/15 Lv50 | 4286 |
| 盖欧卡 / Kyogre | 15/15/15 Lv50 | 4652 |
| 超甲狂犀 / Rhyperior | 15/15/15 Lv50 | 4221 |
| 三首恶龙 / Hydreigon | 15/15/15 Lv50 | 4098 |

注意：`13/15/15 Lv50 = 4681` 对应的是 Zamazenta **Crowned Shield / 王盾形态**，不是 Hero of Many Battles / 百战勇者形态。名字像神话谜语，但公式本身很无辜。

## Repository layout / 仓库结构

```text
.
├── assets/
│   └── pokemon.json            # canonical Pokémon asset for extension + repo / 唯一图鉴资源
├── data/
│   ├── events.csv              # public event library read by extension / GitHub 活动库
│   ├── events.manual.csv       # optional manual additions, kept separate / 可选手动补充
│   ├── manifest.json           # data manifest / 数据元信息
│   ├── pokemon.csv             # human-readable Pokémon export table / 给人看的图鉴 CSV
│   └── snapshot-latest.json    # latest active scrape snapshot / 最近抓取快照
├── extension/                  # unpacked Chrome extension source / 已解压插件源码
├── dist/                       # packaged extension zip only / 打包产物，不是源码源头
├── scripts/
│   ├── update_data.py          # LeekDuck scraper + merger / 抓取与合并
│   ├── validate_parsers.py     # parser regression tests / 解析回归测试
│   ├── validate_cp.py          # CP formula regression tests / CP 公式回归测试
│   ├── export_extension_csv.js # extension-side CSV normalization / 插件侧 CSV 标准化
│   ├── export_extension_csv.py # Python-side CSV normalization / Python 侧 CSV 标准化
│   └── CompareCSV.java         # strict byte/char CSV comparator / Java 严格比较器
├── schema/events.schema.json   # event row schema / 活动行结构
└── .github/workflows/          # scheduled data refresh / GitHub 自动更新
```

`extension/` 和 `dist/` 的区别：`extension/` 是 Chrome “加载已解压扩展程序”使用的源码目录；`dist/` 只是把 `extension/` 压成 zip 后的发布包。不要在 `dist/` 里改源码，除非你也喜欢把书写在密封罐头上。

## Install the extension / 安装插件

### 从 zip 安装

1. 解压 `NeatDuck_Timeline_v1.0.7_extension.zip`。
2. 打开 `chrome://extensions`。
3. 开启 **Developer mode / 开发者模式**。
4. 点击 **Load unpacked / 加载已解压的扩展程序**。
5. 选择解压后的 extension 文件夹。
6. 点击插件图标，选择打开独立页或 LeekDuck Events 页。

### 从 repo 安装

```bash
cd NeatDuck_Timeline
# Chrome 里选择这个目录：
# extension/
```

## Update event data locally / 本地更新活动数据

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/update_data.py
```

脚本会抓取 LeekDuck Events、读取详情页时间、合并历史 CSV 与 `data/events.manual.csv`。它不会因为网页临时隐藏某个活动就把历史库直接扔进虚空，虽然现代网页显然很想这么干。

## Local validation / 本地验证

```bash
# Python detail parser fixtures
TZ=UTC python scripts/validate_parsers.py

# CP formula fixtures
python scripts/validate_cp.py

# Extension JS CSV vs Python CSV, compared by Java
TZ=UTC python scripts/export_extension_csv.py tests/fixtures/events_extension_input.csv > /tmp/neatduck_py.csv
TZ=UTC node scripts/export_extension_csv.js tests/fixtures/events_extension_input.csv > /tmp/neatduck_js.csv
javac scripts/CompareCSV.java
java -cp scripts CompareCSV /tmp/neatduck_py.csv /tmp/neatduck_js.csv
```

Expected output includes:

```text
Python detail parser fixtures OK
CP formula fixtures OK
CSV identical
```

## Reset GitHub repo from the delivered zip / 用交付压缩包重置仓库

Assuming the delivered reset package is saved at `~/Downloads/NeatDuck_Timeline_github_repo_reset_v1.0.7.zip`:

```bash
mkdir -p ~/00_self_defined/1_gits
cd ~/00_self_defined/1_gits

git clone git@github.com:Yang-Zhang-717/NeatDuck_Timeline.git NeatDuck_Timeline
cd NeatDuck_Timeline

find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
unzip ~/Downloads/NeatDuck_Timeline_github_repo_reset_v1.0.7.zip -d .

python3 -m py_compile scripts/update_data.py scripts/validate_parsers.py scripts/validate_cp.py
python3 -m json.tool data/manifest.json >/dev/null
python3 -m json.tool assets/pokemon.json >/dev/null
TZ=UTC python3 scripts/validate_parsers.py
python3 scripts/validate_cp.py

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

`.github/workflows/update-data.yml` runs twice daily and can also be triggered manually. If data changes, it commits updated files under `data/`.

## Data notes / 数据说明

- `timeZone = local` means the activity happens in each viewer’s local time.
- Fixed-zone activities, such as location-specific GO Fest events, keep an IANA zone like `Europe/Copenhagen` and show `timeZoneLabel` such as `CEST`.
- Generic scheduled events with unknown Pokémon content remain generic. Example: `Mega Raid Day` stays `Mega Raid Day`; it is not converted into a fake Pokémon named “Mega Mega.” Civilization may yet recover.
- Type matchup uses Pokémon GO multipliers: `1.6`, `1`, `0.625`, `0.390625`; dual defending types multiply the two single-type results.
- `assets/pokemon.json` is canonical. `assets/pokemon_extra.json`, `extension/assets/pokemon_extra.json`, and `extension/data/pokemon.csv` were removed.

## Disclaimer / 声明

This project is not affiliated with, endorsed by, or sponsored by Leek Duck, Niantic, Nintendo, The Pokémon Company, or Game Freak.

本项目与 Leek Duck、Niantic、Nintendo、The Pokémon Company、Game Freak 均无官方关联、认可或赞助关系。
