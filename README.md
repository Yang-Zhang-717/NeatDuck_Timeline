# NeatDuck v1.0.7

NeatDuck 是一个面向 Pokémon GO 活动规划的小型 Chrome 扩展。它会在 LeekDuck Events 页面内嵌一个可配置面板，也可以从扩展图标打开独立页。v1.0.7 将原来的时间轴扩展为四个互相独立的 tab：Event Calendar、属性克制、宝可梦图鉴、极巨化。

## 安装

1. 下载或解压 `NeatDuck_Timeline_v1.0.7_extension.zip`。
2. 打开 Chrome / Edge 的扩展管理页。
3. 开启“开发者模式”。
4. 选择“加载已解压的扩展程序”，选择解压后的 `extension/` 文件夹。
5. 点击扩展图标后可以选择：
   - 打开独立页
   - 打开 `https://leekduck.com/events/`

## 数据更新逻辑

- 扩展启动和安装时会尝试从 GitHub 读取 `data/events.csv`。
- “云端更新”会重新拉取 GitHub CSV。
- “页面更新”会从当前 LeekDuck Events 页面重新扫描活动，并合并到本地历史缓存，不会因为页面暂时没加载完就清空旧数据。
- `Mega Mega` 这类伪 Mega Raid 标题会被过滤；它不在 GitHub CSV 中，不应再被扩展 DOM 扫描误生出来。世界少了一个假事件，进步惊人。

事件 CSV schema 固定为：

```csv
uid,title,shortTitle,category,lane,sub,start,endKnown,endInferred,href,timeZone,timeZoneLabel,isFixedTimeZone,source,firstSeenAt,lastSeenAt,lastScrapedAt,status
```

Python 脚本、Java 合同测试、扩展 `LDT_Core.eventsToCSV()` 使用同一列顺序、同一 CSV 转义规则、同一布尔字段格式。测试文件见 `tests/`。

## Tab 1：Event Calendar

默认显示 linear timeline 的本周视图。顶部 tab 专属按钮包括：

- 今天
- 本周
- 本月
- 模式：在 linear timeline 与月视图间切换
- 时区：支持 Local 以及 UTC-12 到 UTC+14；每个 offset 至少列出三个代表城市
- 页面更新
- 云端更新
- 导出活动 CSV
- 导出日志文件
- 清除选择
- 打开独立页

说明：

- “今天 / 本周 / 本月”只改变显示时间范围，不切换视图模式。
- 悬停窗口默认停留 600 ms。
- 滚轮缩放或滚动时会立即消除悬停窗口。
- shading 的起点与活动开始位置重合。
- 月视图排序与 linear timeline 的 lane 顺序一致。
- 当天日期有明显边框标注，相邻周行边框加粗。
- 在其它 tab 中滚轮或点击不会把页面偷偷切回 Event Calendar。

## Tab 2：属性克制

左侧是 Pokémon GO 属性倍率 heatmap：

- 单元格为 35 × 35 px。
- 倍率最多显示小数点后 2 位。
- 名称色块大小一致，文字居中。
- 可以点击一行作为攻击属性。
- 可以点击一列或单元格选择一个或两个防御属性，两个防御属性不能相同。
- 被选中的行和列会高亮边框。

右侧：

- 上 1/3 是攻击视角，和左侧 heatmap 绑定，显示复合防御后的最终伤害倍率。
- 下 2/3 是防御视角，按“超级有效 / 有效 / 一般 / 无效 / 超级无效”集中显示会打到当前防御组合的攻击属性。
- 这个 tab 只有“导出 CSV”。

Pokémon GO 当前常用属性倍率采用 1.6、0.625、0.390625 等倍率，复合属性时相乘。

## Tab 3：宝可梦图鉴

顶部和表格内支持：

- 中文搜索，支持编号、英文、简体中文、繁体中文、日文、属性、世代关键词。
- 一级筛选：宝可梦世代。
- 世代说明：
  - 第 1 世代：红 / 绿 / 蓝 / 皮卡丘
  - 第 2 世代：金 / 银 / 水晶
  - 第 3 世代：红宝石 / 蓝宝石 / 绿宝石 / 火红 / 叶绿
  - 第 4 世代：钻石 / 珍珠 / 白金 / 心金 / 魂银
  - 第 5 世代：黑 / 白 / 黑2 / 白2
  - 第 6 世代：X / Y / 欧米伽红宝石 / 阿尔法蓝宝石
  - 第 7 世代：太阳 / 月亮 / 究极之日 / 究极之月 / Let’s Go
  - 第 8 世代：剑 / 盾 / 晶灿钻石 / 明亮珍珠 / 传说 阿尔宙斯
  - 第 9 世代：朱 / 紫 / 零之秘宝
- 二级筛选：可 Mega、可 Dynamax、可 Gigantamax、传说宝可梦、幻之宝可梦、究极异兽、缺省数据。
- 显示数量：50 / 100 / 200 / 500 / 全部。
- 导出 CSV。

右侧 CP 计算器：

1. 在左侧表格点击选择 Pokémon。
2. 通过三角 IV 图或数字输入修改攻击 / 防御 / 体力 IV。
3. 选择等级。
4. 结合 GO 种族值、IV 和等级 CPM 计算 CP。

CP 公式：

```text
CP = floor((Attack + IV_Attack) × sqrt(Defense + IV_Defense) × sqrt(Stamina + IV_Stamina) × CPM² / 10)
最低 CP = 10
```

注意：本包内 Pokémon GO 种族值在缺少官方 Game Master 精确值时会用主系列种族值估算，并以 `GO Stats Source=estimated-main-series` 标记。缺省字段显示为 `缺省`，不会再沉默装懂。

## Tab 4：极巨化 / 超极巨化

功能基本与图鉴页一致：

- 搜索。
- 世代筛选。
- 特殊类别筛选。
- 50 / 100 / 200 / 500 / 全部。
- 导出 CSV。

表格会集中显示：

- 名称
- 世代
- 属性
- LV40 CP
- LV50 CP
- 攻击
- 0.5s 小招
- 极巨技能
- Max伤害
- 超极巨技能
- GMax伤害

原来的“平”字段已更名为“伤害 / Damage”。

关于 Max Move 数据：

- 极巨招式绑定小招属性，例如火属性小招对应 Max Flare，水属性小招对应 Max Geyser。
- 小招频率会影响蓄能速度，因此同一 Pokémon 的可用小招数量、属性与频率都会影响极巨战表现。
- 实时可用 DMax / GMax 名单应从当前 Max Battles 数据、Game Master 或 Pokémon GO API 更新。
- 表格内缺少或不确定的值显示为 `缺省`。

## 推荐数据来源

- LeekDuck Events：活动时间与活动页。
- PokeMiners Game Master：当前游戏内 Pokémon 与招式主数据。
- PvPoke Game Master：可读性较好的 Pokémon GO 对战 / 招式数据镜像。
- Pokémon GO API：从 Game Master 与社区数据源整理出的 JSON API，包含 Pokédex、moves、Max Battles 等端点。
- Pokémon GO Hub：CPM、CP 公式、属性倍率说明。
- PokémonDB：Pokémon GO 属性克制表。
- Snacknap Current Max Battles：当前 Max Battle 列表参考。

## 开发与测试

```bash
python -m py_compile scripts/update_data.py tests/csv_python_contract.py
node --check extension/core.js extension/content.js extension/info.js extension/standalone.js extension/background.js extension/popup.js
python tests/csv_python_contract.py tests/out/python_events.csv
javac tests/EventCsvContract.java -d tests/out
java -cp tests/out EventCsvContract tests/out/java_events.csv
node tests/node_csv_contract.js tests/out/node_events.csv
cmp -s tests/out/python_events.csv tests/out/java_events.csv
cmp -s tests/out/python_events.csv tests/out/node_events.csv
```

这些测试会验证 Python、Java、扩展 JavaScript 输出的事件 CSV 完全一致。
