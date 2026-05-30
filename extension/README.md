# NeatDuck_Timeline v1.1.0

A compact Pokémon GO event timeline helper with GitHub-backed event data, timezone-aware rendering, type matchup tools, a bilingual Pokédex table, and Dynamax/Gigantamax reference data.

## 新增 / Added in v1.1.0

- 活动页默认优先读取 GitHub `data/events.csv`，只有点击“数据更新/页面扫描”按钮时才从当前 Leek Duck 页面重新抓取。浏览器扩展不是仓鼠，别让它每次打开都啃页面。
- 统一 extension 与 GitHub Python updater 的时间处理：CSV 现在支持 `isLocal,timeZone` 字段。`Local Time` 活动按当地墙上时间显示；PT/JST/UTC 等固定时区活动会随显示时区变化。
- 活动时间线新增显示时区选择器。固定时区活动使用更粗边框，便于和本地时间活动区分。
- “今天 / 本周 / 本月”只改变日期范围；“线性/月视图”由单独的切换按钮控制。
- 月视图重做：连续日期活动以连贯 block 展示，短时段每日活动也会显示，今天更醒目。
- 顶部新增四个页签：Activity Timeline / Type Matchups / Pokédex / Dynamax-Gigantamax。
- 属性克制页支持最多两个攻击属性与最多两个防守属性选择，复合属性倍率按 Pokémon GO 规则相乘并显示到小数点后三位。
- Pokédex 与 Max 页面使用 `data/pokedex.csv` 和 `data/max.csv`，中英对照，空值浅灰显示。

## Local install / 本地安装

1. 解压此目录。
2. 打开 `chrome://extensions`。
3. 开启 Developer mode / 开发者模式。
4. 点击 Load unpacked / 加载已解压的扩展程序。
5. 选择这个解压后的 extension 文件夹。
6. 打开 `https://leekduck.com/events/`，或点击扩展图标打开 standalone 页面。

## Data files / 数据文件

```text
data/events.csv       Event timeline data, with isLocal/timeZone metadata
data/type_chart.csv   Pokémon GO type effectiveness table
data/type_names.csv   English / 简中 / 繁中 type names
data/pokedex.csv      Bilingual Pokédex table from Pokemon.xlsx
data/max.csv          Dynamax / Gigantamax info table from Pokemon.xlsx
```

## Notes / 说明

This project is not affiliated with, endorsed by, or sponsored by Leek Duck, Niantic, or The Pokémon Company. Site compatibility is limited to the pages listed in `manifest.json`.

Do not put write tokens in the extension.
