# NeatDuck Timeline / NeatDuck 插件

NeatDuck 是一个 Chrome 扩展：在 LeekDuck event 页面内嵌一个居中的 Pokémon GO 活动/资料窗口，同时提供独立页面。窗口分为三个互不干扰的 tab：**活动日历 / 属性克制 / 宝可梦图鉴**。顶部左侧只负责切换 tab；点击、滚轮、拖动时间轴都不会顺手把 tab 切掉，人类终于暂时战胜了误触。

## 仓库结构

```text
.
├── README.md
├── assets/
│   ├── pokemon.json             # 旧版名称/翻译索引，保留兼容
│   ├── pokemon_extra.json       # 属性克制表与补充资料
│   └── pokemon_go.json          # 合并后的 Pokémon GO 图鉴与种族值
├── data/
│   ├── events.csv               # 扩展远程兼容用活动库，脚本仍能读取
│   ├── events.xlsx              # 活动库 Excel 输出
│   ├── events.manual.csv        # 可选手动活动补充
│   ├── pokemon.csv              # 原始/旧版精简图鉴表
│   └── manifest.json
├── extension/                   # 未打包 Chrome 扩展源码
├── packed_extension/            # 已打包扩展 zip
├── schema/
└── scripts/
    ├── update_data.py           # LeekDuck 抓取、合并、导出 CSV/XLSX
    ├── cp_verify.py             # Python CP 校验
    ├── js_cp_verify.mjs         # JS CP 校验
    ├── verify_excel_parity.py   # Python/JS Excel sheet XML 对照
    └── ExcelProbe.java          # Java 检查 XLSX 结构
```

`assets/pokemon.json`、`assets/pokemon_extra.json`、`data/pokemon.csv` 的关系：它们不是完全同一个东西。`pokemon.json` 主要是旧版名称/翻译索引，`pokemon_extra.json` 负责属性克制和页面补充资料，`data/pokemon.csv` 是早期表格数据。v1.0.7 新增并优先使用 `assets/pokemon_go.json`，作为图鉴页和 CP 计算器的统一、非冗余 Pokémon GO 数据入口。

## 安装插件

1. 打开 `chrome://extensions`。
2. 开启 **Developer mode / 开发者模式**。
3. 点 **Load unpacked / 加载已解压的扩展程序**。
4. 选择仓库里的 `extension/` 目录。
5. 打开 `https://leekduck.com/events/`，或点击扩展图标打开独立页。

也可以直接使用 `packed_extension/NeatDuck_Timeline_v1.0.7_extension.zip` 解压后加载。

## 活动日历 tab

默认显示：**linear timeline 的本周视图**。

按钮：今日 / 本周 / 本月 / 模式 / 时区 / 页面更新 / 云端更新 / 导出活动 Excel / 导出日志文件 / 清除选择。

- 今日 / 本周 / 本月只改变显示时间范围，不切换 linear timeline 与月视图。
- 模式按钮在 linear timeline 与月视图之间切换。
- 时区支持 UTC-12 到 UTC+14，每个 offset 在下拉选项中列出多个代表城市。
- 云端更新会拒绝“只有表头没有数据”的远程文件，避免把本地活动历史覆盖成一片空白。是的，空 CSV 这件事真的发生了。
- 活动数据保留 `timeZone`、`timeZoneLabel`、`isFixedTimeZone`，用于统一 extension 与 Python 脚本解析结果。
- shading 从活动开始位置绘制；活动块本体仍表示真实持续时间。
- 月视图排序与 timeline 同源，today 单元格有明显边框，相邻日期行边框加粗。
- 悬停详情弹窗默认 400 ms 后消失，触发滚轮立即隐藏。

## 属性克制 tab

按钮：导出 Excel。

左侧 heatmap 为 Pokémon GO 倍率表：单一攻击属性 × 单/双防御属性，复合防御时倍率相乘。

- 单元格列宽 35 px，行高 32 px。
- 数值最多显示两位小数。
- 点击一行选择攻击属性；点击一到两列选择防御属性，防御属性不能重复。
- 已选择的行、列、交叉格会高亮。
- 右侧上部显示攻击视角和复合倍率。
- 右侧下部显示防御视角：当前防御组合，以及超级有效 / 有效 / 一般 / 抗性 / 超级抗性分区。

## 宝可梦图鉴 tab

按钮：搜索框 / 世代筛选 / 特殊类别筛选 / 显示数量 / 导出 Excel。

- 搜索框支持中文输入法 composition，不会在刚开始拼音输入时被重渲染打断。
- 一级筛选为数字世代，并带对应主系列版本：红/绿/蓝/皮卡丘、金/银/水晶、红宝石/蓝宝石/绿宝石、钻石/珍珠/白金、黑/白/黑2/白2、X/Y、太阳/月亮/究极日月、剑/盾、朱/紫。
- 二级筛选包含 Mega、传奇/幻之宝可梦、可变换形态、可合体等。v1.0.7 已移除极巨化内容。
- 左表可显示 50 / 100 / 200 / 500 / 全部。
- 右侧 CP 计算器默认选择皮卡丘，也可从左表点击任意 Pokémon。
- 右侧显示种族值三角雷达图、攻击/防御/生命 IV 滑条、等级输入和实时 CP。

## CP 计算公式

```text
CP = floor((BaseAtk + AtkIV) × sqrt(BaseDef + DefIV) × sqrt(BaseSta + StaIV) × CPM(level)^2 / 10)
```

等级默认 50。IV 范围是 0 到 15。CP 下限按 Pokémon GO 规则为 10。

校验样例由 `scripts/cp_verify.py` 和 `scripts/js_cp_verify.mjs` 同时检查：

| Pokémon | IV | Lv | CP |
|---|---:|---:|---:|
| 酋雷姆·捷克罗姆/莱希拉姆合体 White/Black Kyurem | 15/15/15 | 50 | 5206 |
| 藏玛然特 Crowned Shield | 13/15/15 | 50 | 4681 |
| 凤王 | 15/15/15 | 50 | 4367 |
| 巨金怪 | 15/15/15 | 50 | 4286 |
| 盖欧卡 | 15/15/15 | 50 | 4652 |
| 超甲狂犀 | 15/15/15 | 50 | 4221 |
| 三首恶龙 | 15/15/15 | 50 | 4098 |
| 利欧路 | 15/15/15 | 50 | 1123 |
| 钢铠鸦 | 15/15/15 | 50 | 2777 |

## 本地更新活动数据

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/update_data.py
```

脚本会合并新抓取数据、历史活动和 `data/events.manual.csv`。如果网页出现“正在进行 / 未来未开始 / 已预定但内容未定”的活动，脚本会尽量保留原始标题，不在本地硬编码活动内容，也不会把未定 Mega Raid Day 变成假的 “Mega Mega”。

## 校验

```bash
python3 -m py_compile scripts/update_data.py
node --check extension/core.js
node --check extension/content.js
node --check extension/info.js
node --check extension/standalone.js
python scripts/cp_verify.py
node scripts/js_cp_verify.mjs
python scripts/verify_excel_parity.py
javac scripts/ExcelProbe.java
java -cp scripts ExcelProbe tmp_test/events_py.xlsx
java -cp scripts ExcelProbe tmp_test/events_js.xlsx
```

## 数据来源说明

- 活动页面来源：LeekDuck event 页面。
- Pokémon GO 图鉴数值优先使用 Pokémon GO 标准字段；本包内 `pokemon_go.json` 由脚本统一生成。
- CP 计算器底部保留 Dittobase 与 Pokémon GO Hub 公式链接。
- GitHub 在线数据建议后续通过 PokeMiners GAME_MASTER 或同等官方/拆包数据源更新 Pokémon GO 实际数值。

## 声明

本项目与 LeekDuck、Niantic、Nintendo、The Pokémon Company、Game Freak 均无官方关联、认可或赞助。
