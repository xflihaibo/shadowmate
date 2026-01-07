---
title: '[Implementation] - Shadow Mate Base Structure & Retention Logic'
type: note
permalink: implementations/implementation-shadow-mate-base-structure-retention-logic
---

# [Implementation] - Project Structure & Data Retention

## Files Created
- `manifest.json`: Configuration with permissions for storage, alarms, tabs, and webNavigation.
- `background.js`: Implements silent tracking and a 7-day data retention policy using `chrome.alarms`.
- `content.js`: Placeholder for future behavioral tracking and UI injection.
- `popup.html`: Simple status display.

## Data Retention Policy
- Records stored in `chrome.storage.local`.
- Weekly cleanup alarm (`weeklyCleanup`) removes records older than 7 days.
- Check-in alarm (`checkSunset`) runs every 60 minutes to monitor for the 18:00 threshold.

## Notes
- User needs to add icons (16, 48, 128) to the `icons/` directory.
- `background.js` currently captures URL, title, favicon, and visit time.