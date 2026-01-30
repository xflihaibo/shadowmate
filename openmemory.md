# OpenMemory - chromeplgin

## Overview
A new Chrome extension project.

## Architecture
- **Name**: 伴影 (Shadow Mate)
- **Concept**: Silent tracking during work hours, personified summary after 18:00. Warm, quiet companion: morning greeting on first popup open only, sunset ritual at user-set time only; no other reminders.
- **Personality**: 温馨、每天换不同提示词、安静陪伴；早上安静问安，下班给你互动，其他时间不需提醒。
- **Engine**: Background-driven active timing (Tab/Window level precision).
- **Stack**: Chrome Extension MV3, CSS Glassmorphism, Shadow Narrative AI Engine.
- **Retention**: Strictly 24-hour local data retention for maximum privacy.
- **Narrative**: Data-to-Text conversion for emotional daily summaries.

## User Defined Namespaces
- [Leave blank - user populates]

## Components
- **Shadow Logger**: Precision timer + data aggregator with 24h cleanup.
- **Digital Ghost**: Context-aware UI (ghost.gif for ritual & memory, lazhu.png for golden-hour hint).
- **Shadow Narrator**: Narrative engine generating "The Shadow Whispers" (伴影·私语).
- **Sunset Card**: Glassmorphism dashboard with 2x2 labor grid, timeline, and weighted keywords.
- **Popup Dashboard**: Real-time summary grid and time-sorted trace list.
- **Safety Fusion**: Multi-layer protection against `context invalidated` errors.
- **Clipboard Memory**: Records last 10 copied items, auto-fills empty inputs on focus, supports arrow key navigation with preview tooltip.

## Patterns
- **Time-Weighted Keywords**: Sorting 10 keywords by the accumulated stay duration of their pages.
- **Auto-Metamorphosis**: Seamless lazhu.png (candle) to ghost.gif transition at the ritual hour.
- **Behavioral Weights**: Identifying "highlight moments" based on interaction depth.
- **Privacy-First**: No data upload, local processing only.
- **Time Capsule**: Reunion messages for highly interactive pages after 12h+.
- **Clean URL Mapping**: Aggregating data based on normalized URL (origin + pathname).
- **Clipboard Persistence**: Cross-site clipboard history (max 10 items) with auto-fill on input focus, arrow key navigation, and preview tooltip. Excludes password/file/hidden inputs. Supports input/textarea/contenteditable elements.
