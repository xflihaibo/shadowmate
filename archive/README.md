# 归档说明

本目录为迁移到 **Vite + Vue 3 + TypeScript** 之前的旧版源码，仅作备份与对照，当前扩展已不再使用。

| 文件 | 说明 |
|------|------|
| `popup.html` | 旧版 Popup 界面（内联样式 + 静态 HTML） |
| `popup.js` | 旧版 Popup 逻辑（原生 DOM + chrome.storage） |
| `background.js` | 旧版后台服务（计时、数据聚合、闹钟） |
| `content.js` | 旧版内容脚本（统计、剪贴板、余晖仪式 UI） |
| `build.js` | 旧版构建校验脚本（现由 Vite 替代） |

当前实现位于项目根目录的 `src/` 下（Vue SFC + TS）。
