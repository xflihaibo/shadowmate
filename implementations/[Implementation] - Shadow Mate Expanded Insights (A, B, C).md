---
title: '[Implementation] - Shadow Mate Expanded Insights (A, B, C)'
type: note
permalink: implementations/implementation-shadow-mate-expanded-insights-a-b-c
---

# [Implementation] - Expanded Data Insights for Shadow Mate

## New Data Dimensions
- **Input Tracking (A)**: Added `input` event listeners to count characters typed in inputs, textareas, and contenteditable elements.
- **Peak Hour Analysis (B)**: Implemented logic to aggregate visit times and identify the hour with the highest browsing activity.
- **Search Intent Capture (C)**: Automatically captures search queries from Google, Baidu, and Bing URLs to summarize the user's "curiosity points."

## UI Updates
- **Summary Card**: Now displays "Peak Hour," "Total Characters Typed," and a dedicated "Curiosity Points" section (blue tags).
- **Smart Greetings**: Added a new greeting for "High Productivity" when many characters are typed.

## Technical Refinements
- `UPDATE_STATS` message now includes `charsTyped` and `searchQuery`.
- `background.js` handles aggregation of these new fields into the `browsingData` structure.
- Search queries are de-duplicated per record to keep the summary clean.