# 更新记录 (Changelog)

## [1.0.5] - 2025-01-27

### 新增

- **功能文档**：新增 `docs/FEATURES.md`，完整描述 Popup、内容脚本、图标资源、数据与隐私。
- **商店描述**：新增 `docs/STORE_DESCRIPTION.md`，提供 Chrome 网上应用店简短说明与详细说明文案。
- **图标构建**：构建时自动将 `icons/` 目录完整复制到 `dist/icons/`，确保 `ghost.gif`、`ghost.png`、`lazhu.png` 等打包后可被加载。
- **web_accessible_resources**：在 manifest 中声明 `icons/*`，使 popup 与 content 脚本可通过 `chrome.runtime.getURL('icons/xxx')` 正常加载图片。

### 变更

- **找到伴影**：悬浮按钮与晨间问候统一使用 `ghost.gif` 动图；加载失败时回退为 👻 emoji。
- **晨间问候**：每天第一次见面的悬浮图标由 `ghost.png` 改为 `ghost.gif`，与找到伴影一致。
- **内容脚本 · 归航/回忆幽灵**：页面右下角伴影图标由 👻 emoji 改为 `ghost.gif` 图片（归航仪式、数字漂流瓶「见过面」回忆）。
- **内容脚本 · 余晖提前提示**：蜡烛态由 🕯️ emoji 改为 `lazhu.png` 图片。
- **找到伴影点击交互**：移除点击悬浮按钮时的水波动画，仅保留伴影互动气泡。
- **README**：核心特性与项目结构更新，增加功能文档链接；归航/余晖/找到伴影/晨间/里程碑/剪贴板等描述与当前实现一致。
- **icons/README.md**：更新各图标用途说明（ghost.gif、lazhu.png 等引用位置）。
- **openmemory.md**：Digital Ghost 与 Auto-Metamorphosis 描述更新为 ghost.gif / lazhu.png。

### 修复

- 打包后扩展内 `ghost.gif`、`ghost.png`、`lazhu.png` 无法加载的问题：通过构建时复制 icons 目录并声明 web_accessible_resources 解决。

---

## 版本说明

- **1.0.5**：图标资源统一（ghost.gif / lazhu.png）、文档完善、商店描述、构建与 manifest 资源声明。
- 更早版本功能包括：归航仪式、余晖模式、陪伴天数与里程碑勋章、剪贴板记忆、数字漂流瓶、今日统计等，详见 `docs/FEATURES.md`。
