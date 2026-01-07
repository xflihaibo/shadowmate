---
title: '[Implementation] - 伴影 (Shadow Mate) Design Finalized'
type: note
permalink: implementations/implementation-伴影-shadow-mate-design-finalized
---

# [Implementation] - Project "伴影 (Shadow Mate)" Design

## Overview
A Chrome extension that silently tracks user browsing behavior (keywords, mood, physical effort) during the day and presents a personalized, warm summary after 18:00 via a "Digital Ghost" UI.

## Key Components
- **Shadow Logger**: Background service worker for aggregation.
- **Content Scripts**: Low-power event tracking and UI injection.
- **Visual Ritual**: Sunset-colored UI transitions and floating ghost bubble with greetings after 18:00.

## Implementation Details
- Local-first storage (chrome.storage.local).
- Keyword extraction with weighted algorithm based on DOM tags and dwell time.
- Persona-driven summary (psychological monologue).

## Reference
See `docs/plans/2026-01-06-shadow-mate-design.md` for full details.