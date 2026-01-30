# icons 目录说明

本目录存放扩展用到的图片资源。

## 当前文件与用途

| 文件 | 用途 | 引用位置 |
|------|------|----------|
| **logo.png** | 扩展图标（工具栏、安装页） | `manifest.json`（16/32/48/128）、`App.vue` 中 `defaultIcon` |
| **ghost.gif** | 幽灵动图（找到伴影悬浮、晨间问候、归航/回忆幽灵） | `App.vue` 中 `floatingGhostUrl`；`content.ts` 中 `ghostGifUrl` |
| **ghost.png** | 幽灵静态图（备用） | 当前未在代码中引用 |
| **lazhu.png** | 蜡烛图标（余晖提前提示） | `content.ts` 中幽灵蜡烛态 |
| **logo.svg** | Logo 矢量源文件 | 未在代码中引用 |
| **promotional_banner.svg** | 推广横幅（如商店页） | 未在代码中引用 |

## 说明

- 运行时用到的图片：`logo.png`、`ghost.gif`、`lazhu.png`。
- `ghost.png`、`logo.svg`、`promotional_banner.svg` 为设计/备用资源。
