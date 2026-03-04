# 伴影 (Shadow Mate) 项目梳理

> 基于 `/Users/xurong/Desktop/chromeplgin` 当前代码与文档的整理，便于查阅与迭代。

---

## 一、项目概览

| 项 | 当前值 |
|----|--------|
| **中文名** | 伴影 |
| **英文名** | Shadow Mate |
| **定位** | 每日数字生活感性回顾的 Chrome 扩展；静默记录浏览，在「归航时刻」与首次打开时送上叙事化总结与问候。 |
| **manifest 版本** | 1.0.8（manifest.json） |
| **package 版本** | 1.0.4（package.json，构建用） |
| **Manifest** | V3 |
| **构建** | Vite + @crxjs/vite-plugin，产物 `dist/` |

**一句话**：你是数字世界的航行者，伴影是你身后的影子——零上传、24 小时本地数据、归航仪式 + 私语总结 + 剪贴板记忆。

---

## 二、功能清单（已实现）

### Popup（弹窗）

| 功能 | 说明 |
|------|------|
| 每日格言 / 每日一句 | 顶部标题与副标题，可点击「每日一句」唤出「找到伴影」悬浮幽灵。 |
| 全局开关 | 控制扩展是否启用（余晖/归航/剪贴板等）。 |
| 陪伴天数 | 有浏览活动的不同天数累计，最多 365 天。 |
| 里程碑勋章 | 7/14/30/100/365 天对应勋章与名称（如「初识」「一年之约」）。 |
| 找到伴影 | 点击「每日一句」后出现左侧悬浮幽灵（ghost.gif），点击可触发互动气泡（interactionLibrary 随机短句）。 |
| 晨间问候 | 当天第一次打开 popup 时显示问候气泡 + 幽灵图标，可关闭后当日不再显示。 |
| 今日统计 | 四张卡片：活跃时长、累计点击、滚动距离、敲击字数。 |
| 剪贴板记忆 | 开关、最多 10 条历史、单条删除/清空；详见 `docs/CLIPBOARD_MEMORY.md`。 |
| 归航时刻 | 时间选择器，设定归航仪式触发时间；余晖在该时间前约 30 分钟开始。 |
| 重置今日提示状态 | 清除当日已显示归航/已关闭提示等，便于再次体验。 |
| 多语言 | 中/英，`src/locales/zh.json`、`en.json`，`i18n.ts` 读 `languageOverride` 或浏览器语言。 |

### Content Script（注入网页）

| 功能 | 说明 |
|------|------|
| 归航仪式 | 到达用户设定时间且当日未展示过时，右下角幽灵 + 气泡；点击幽灵展开「伴影·私语」卡片（今日叙事、时间轴、关键词等）。 |
| 余晖模式 | 归航前约 30 分钟：全页淡橙滤镜 + 右下角蜡烛图标（lazhu.png）；到点切换为幽灵（ghost.gif）并触发归航。 |
| 数字漂流瓶 | 重访 12 小时前高互动页面时，右下角幽灵 + 回忆类气泡（如「我们曾在 X 月 X 日见过……」）。 |
| 剪贴板记忆 | 输入框聚焦可自动填充最近复制；↑/↓ 切换历史并带预览；与 popup 共用存储与开关。 |

### Background（Service Worker）

| 职责 | 说明 |
|------|------|
| 计时引擎 | Tab 激活/窗口焦点/URL 变化时精准计时，累加停留时长。 |
| 数据聚合 | 按 URL 归一化存储浏览记录（visitTime、activeDuration、clicks、scrollDistance、charsTyped、keywords 等）。 |
| 闹钟 | `dailyCleanup` 每日滚动清理 24 小时外数据；`checkSunset` 定期检查归航时刻。 |
| 私语生成 | 基于行为特征生成叙事化文案（伴影·私语）。 |

### 图标与资源（icons/）

| 文件 | 用途 |
|------|------|
| logo.png | 扩展图标、popup 默认站点图标。 |
| ghost.gif | 找到伴影、晨间问候、内容脚本归航/回忆幽灵。 |
| ghost.png | 备用。 |
| lazhu.png | 余晖时段「即将归航」蜡烛提示。 |
| logo.svg / promotional_banner.svg | 设计/商店用。 |

构建时 `icons/` 会完整复制到 `dist/icons/`，manifest 中 `web_accessible_resources` 声明 `icons/*`。

---

## 三、技术架构

| 层 | 技术/文件 |
|----|------------|
| 构建 | Vite 5、Vue 3、TypeScript、@crxjs/vite-plugin；manifest 以 JSON 引入。 |
| 入口 | manifest 指定 `background.service_worker: src/background.ts`、`content_scripts[].js: src/content.ts`、`action.default_popup: src/popup/index.html`。 |
| Popup | Vue 3 SFC（App.vue）、main.ts、interactionLibrary.ts（互动短句库）。 |
| 样式 | CSS Glassmorphism（毛玻璃风格）。 |
| 通信 | popup ↔ background ↔ content 通过 chrome.runtime.sendMessage / onMessage；具备 context invalidated 熔断保护。 |
| 多语言 | 自研 i18n（getEffectiveLocale、t、placeholders），非 vue-i18n；locale 存 `chrome.storage.local.languageOverride`。 |
| 数据 | 全部 `chrome.storage.local`，24 小时滚动保留，零上传。 |

### 权限（manifest）

- `storage`、`alarms`、`tabs`、`activeTab`、`scripting`、`webNavigation`、`clipboardRead`
- `host_permissions: ["<all_urls>"]`

---

## 四、目录结构（精简）

```
chromeplgin/
├── manifest.json          # MV3 配置与权限
├── package.json           # 版本 1.0.4，依赖 vue / @crxjs/vite-plugin 等
├── vite.config.ts         # Vite + crx(manifest) + copyIconsPlugin
├── src/
│   ├── background.ts      # 计时、聚合、闹钟、私语
│   ├── content.ts         # 余晖/归航/漂流瓶/剪贴板、UI 注入
│   ├── i18n.ts            # 语言解析与 t()
│   ├── locales/
│   │   ├── zh.json
│   │   └── en.json
│   └── popup/
│       ├── index.html
│       ├── main.ts
│       ├── App.vue
│       └── interactionLibrary.ts   # 伴影互动短句库
├── icons/                 # logo, ghost.gif, ghost.png, lazhu.png 等
├── docs/
│   ├── FEATURES.md        # 功能说明
│   ├── CLIPBOARD_MEMORY.md
│   ├── STORE_DESCRIPTION.md
│   ├── plans/             # 设计稿（shadow-mate-design, i18n-design）
│   └── PROJECT-SUMMARY.md # 本梳理
├── implementations/       # 实现记录（设计定稿、Base、Advanced、Full Feature 等）
├── archive/               # 旧版 HTML/JS，当前未使用
├── README.md
├── CHANGELOG.md
├── PRIVACY.md
└── openmemory.md
```

---

## 五、数据与隐私

- **存储**：仅 `chrome.storage.local`，含浏览记录、陪伴天数、归航时刻、剪贴板历史（最多 10 条）、语言覆盖、当日提示关闭状态等。
- **保留**：浏览类数据仅保留 24 小时，`dailyCleanup` 定时清理。
- **上传**：无；分析与私语生成均在本地完成。

详见 `PRIVACY.md`。

---

## 六、文档与路线图

- **功能与交互**：`docs/FEATURES.md`
- **剪贴板**：`docs/CLIPBOARD_MEMORY.md`
- **商店文案**：`docs/STORE_DESCRIPTION.md`
- **设计计划**：`docs/plans/`（如 2026-01-06-shadow-mate-design、2026-02-03-i18n-design）
- **实现历程**：`implementations/` 下多份 Shadow Mate 实现记录

**README 路线图**：AI 梦境生成、周度/月度勋章、数据导出、多端同步、剪贴板增强等。

---

## 七、与 Y2K-ifier 的简要对比

| 维度 | 伴影 (chromeplgin) | Y2K-ifier (myself) |
|------|--------------------|---------------------|
| 定位 | 数字陪伴、归航仪式、私语总结、剪贴板记忆 | 网页视觉复古、主题页、怀旧助手 |
| 核心交互 | 计时 + 归航时刻 + 余晖 + 幽灵/蜡烛 UI | 复古/CRT 开关 + 主题页 + 50 条话术 + 随机书签 |
| 构建 | @crxjs/vite-plugin，manifest 直接 JSON | @samrum/vite-plugin-web-extension，manifest 在 vite 里写死 |
| 多语言 | 自研 i18n + zh/en.json | vue-i18n + en/zh-CN.ts |
| 数据 | 24h 浏览记录、剪贴板、陪伴天数 | 开关、搜索引擎、locale，无行为记录 |
| 内容脚本 | 有（余晖、归航、漂流瓶、剪贴板） | 无（仅 background 注入 retro.css） |

---

## 八、当前可优化点（建议）

- **版本统一**：manifest 1.0.8 与 package.json 1.0.4 不一致，建议发版时对齐并更新 CHANGELOG。
- **依赖**：与 Y2K-ifier 类似，若需上架可考虑生产 minify、依赖锁定。
- **测试**：若有核心路径（如计时、归航触发）可加简单单测或 E2E，便于重构。

---

**梳理完成。** 伴影与 Y2K-ifier 均为你名下的 Chrome 扩展，伴影偏「陪伴与回顾」，Y2K-ifier 偏「复古视觉与怀旧氛围」，技术栈相近（Vite + Vue 3 + TS），可互相参考文档与工程实践。
