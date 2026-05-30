# NeatDuck Timeline v1.1.0

NeatDuck 是一个 Pokémon GO 活动时间线浏览器扩展，v1.1.0 将主界面整理为三个互不干扰的 tab：

- **event calendar**：活动日历，默认进入本周 linear timeline。
- **属性克制**：Pokémon GO 属性倍率 heatmap，可从攻击视角和防御视角查看复合倍率。
- **宝可梦图鉴**：Pokémon GO 图鉴表 + CP 计算器。

## 目录结构

```text
data/                 # 统一 TSV 数据源，不再输出 CSV
  events.tsv           # 云端活动源
  events.manual.tsv    # 手工补充活动源
  pokemon.tsv          # 合并后的 Pokémon GO 图鉴数据
scripts/              # 数据更新与校验脚本
extension/            # Chrome/Edge unpacked extension 源码
packed_extension/     # 已打包扩展 zip
```

## 安装

1. 打开 Chrome/Edge 的扩展管理页面。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本仓库的 `extension/` 目录。

也可以直接解压 `packed_extension/NeatDuck_v1.1.0_extension.zip` 后加载。

## event calendar

左上角 tab 进入 event calendar。默认显示 **本周**、**linear timeline**。按钮包括：今日、本周、本月、模式、时区、页面更新、云端更新、导出活动 TSV、导出日志文件、清除选择。今日/本周/本月只改变时间范围，不强行改变 linear/month 模式。

云端默认读取：

```text
https://raw.githubusercontent.com/Yang-Zhang-717/NeatDuck_Timeline/main/data/events.tsv
```

v1.1 仍兼容读取旧 CSV 缓存，但所有新导出都是 TSV。悬停窗默认 600 ms；滚轮滚动会立即关闭悬停窗。Mega Raid Day 等“时间已定、内容未定”的活动会保留事件标题，不再把它伪装成 Mega Mega Raid boss rollover。

## 属性克制

heatmap 使用 Pokémon GO 倍率。左侧点击一行作为攻击属性，点击一到两列作为防御属性组合，所选行/列会高亮。右侧上方显示攻击视角的复合伤害倍率；下方按超级有效、有效、一般、抗性、超级抗性分区显示防御视角。

## 宝可梦图鉴与 CP 计算器

图鉴支持中文搜索、世代筛选、特殊类别筛选、显示 50/100/200/500/全部，以及 TSV 导出。右侧 CP 计算器先从左侧选择 Pokémon，再调 IV 与等级。

CP 公式：

```text
CP = floor((BaseAtk + AtkIV) × sqrt(BaseDef + DefIV) × sqrt(BaseSta + StaIV) × CPM(level)^2 / 10)
```

v1.1 内置了 Level 50 的 CPM `0.84029999`，并在 `scripts/validate_cp.py` 中用以下样例校验：

- 满 IV Lv50 酋雷姆·捷克罗姆合体 / White Kyurem：5206
- 13/15/15 Lv50 藏玛然特 剑/盾形态 / Crowned Shield Zamazenta：4681
- 满 IV Lv50 凤王：4367
- 满 IV Lv50 巨金怪：4286
- 满 IV Lv50 盖欧卡：4652
- 满 IV Lv50 超甲狂犀：4221
- 满 IV Lv50 三首恶龙：4098

## 校验

```bash
python3 scripts/validate_cp.py
node scripts/compare_event_tables.js
javac scripts/TsvRoundTrip.java && java -cp scripts TsvRoundTrip data/events.tsv
```

这些校验分别覆盖 CP 公式、扩展 JavaScript TSV round-trip、Java TSV 结构比对。

## 数据说明

旧包中 `assets/pokemon.json`、`assets/pokemon_extra.json`、`data/pokemon.csv` 存在内容重叠：`assets/pokemon.json` 偏名称字典，`assets/pokemon_extra.json` 供扩展 UI 使用，`data/pokemon.csv` 是表格数据副本。v1.1 合并为 `data/pokemon.tsv` + `assets/pokemon_extra.json`，扩展直接使用非冗余图鉴字段。极巨化 / 超极巨化内容已移除。
