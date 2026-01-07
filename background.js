// Background Service Worker for 伴影 (Shadow Mate)

let activeTabInfo = { tabId: null, url: null, startTime: null };

// 1. 初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('dailyCleanup', { periodInMinutes: 1440 });
  chrome.alarms.create('checkSunset', { periodInMinutes: 60 });
});

// 2. 核心：监听标签页切换
chrome.tabs.onActivated.addListener(activeInfo => {
  handleTabChange(activeInfo.tabId);
});

// 3. 核心：监听窗口聚焦切换
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking(); 
  } else {
    chrome.tabs.query({ active: true, windowId: windowId }, tabs => {
      if (tabs[0]) handleTabChange(tabs[0].id);
    });
  }
});

// 4. 核心：监听 URL 更新 (SPA 页面切换)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    handleTabChange(tabId);
  }
});

// 处理 Tab 切换逻辑
async function handleTabChange(tabId) {
  const now = Date.now();
  if (activeTabInfo.tabId && activeTabInfo.startTime) {
    const duration = Math.floor((now - activeTabInfo.startTime) / 1000);
    if (duration > 0) await accumulateTime(activeTabInfo.url, duration);
  }
  chrome.tabs.get(tabId, tab => {
    if (chrome.runtime.lastError || !tab || !tab.url || tab.url.startsWith('chrome://')) {
      activeTabInfo = { tabId: null, url: null, startTime: null };
      return;
    }
    activeTabInfo = { tabId: tabId, url: tab.url, startTime: now };
    ensureRecordExists(tab);
  });
}

async function ensureRecordExists(tab) {
  const res = await chrome.storage.local.get({ browsingData: [] });
  let browsingData = res.browsingData;
  const today = new Date().toDateString();
  const cleanUrl = getCleanUrl(tab.url);
  
  let found = false;
  for (let r of browsingData) {
    if (getCleanUrl(r.url) === cleanUrl && new Date(r.visitTime).toDateString() === today) {
      r.title = tab.title || r.title;
      r.icon = tab.favIconUrl || r.icon;
      found = true;
      break;
    }
  }
  if (!found) {
    browsingData.push({
      url: tab.url, title: tab.title || '', icon: tab.favIconUrl || '',
      visitTime: Date.now(), activeDuration: 0, clicks: 0,
      scrollDistance: 0, charsTyped: 0, keywords: []
    });
  }
  await chrome.storage.local.set({ browsingData });
}

function stopTracking() {
  if (activeTabInfo.url && activeTabInfo.startTime) {
    const duration = Math.floor((Date.now() - activeTabInfo.startTime) / 1000);
    if (duration > 0) accumulateTime(activeTabInfo.url, duration);
  }
  activeTabInfo = { tabId: null, url: null, startTime: null };
}

async function accumulateTime(url, duration) {
  const res = await chrome.storage.local.get({ isEnabled: true, browsingData: [] });
  if (!res.isEnabled) return;
  const today = new Date().toDateString();
  const cleanUrl = getCleanUrl(url);
  let browsingData = res.browsingData;
  for (let record of browsingData) {
    if (getCleanUrl(record.url) === cleanUrl && new Date(record.visitTime).toDateString() === today) {
      record.activeDuration = (record.activeDuration || 0) + duration;
      break;
    }
  }
  await chrome.storage.local.set({ browsingData });
}

function getCleanUrl(u) {
  try {
    const urlObj = new URL(u);
    return urlObj.origin + urlObj.pathname;
  } catch(e) { return u; }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_STATS' && sender.tab) {
    updateOtherStats(sender.tab.id, message.data, sender.tab.url);
    return false;
  }
  if (message.type === 'GET_TODAY_SUMMARY') {
    handleSummaryRequest().then(sendResponse);
    return true;
  }
  if (message.type === 'GET_PAGE_MEMORY') {
    if (!sender.tab?.url) { sendResponse(null); return true; }
    const urlKey = getCleanUrl(sender.tab.url);
    chrome.storage.local.get({ highlightMoments: {} }, (res) => {
      sendResponse(res.highlightMoments[urlKey] || null);
    });
    return true;
  }
});

async function updateOtherStats(tabId, data, senderUrl) {
  const res = await chrome.storage.local.get({ browsingData: [] });
  let browsingData = res.browsingData;
  const today = new Date().toDateString();
  const targetUrl = getCleanUrl(senderUrl);
  let found = false;

  for (let record of browsingData) {
    if (getCleanUrl(record.url) === targetUrl && new Date(record.visitTime).toDateString() === today) {
      record.clicks = (record.clicks || 0) + (data.clicks || 0);
      record.scrollDistance = (record.scrollDistance || 0) + (data.scrollDistance || 0);
      record.charsTyped = (record.charsTyped || 0) + (data.charsTyped || 0);
      if (data.keywords) {
        const ks = new Set([...(record.keywords || []), ...data.keywords]);
        record.keywords = Array.from(ks).slice(0, 15);
      }
      found = true;
      break;
    }
  }

  // [重要] 如果没找到记录（可能 handleTabChange 还没跑完），则补创一条
  if (!found && targetUrl && !targetUrl.startsWith('chrome://')) {
    browsingData.push({
      url: senderUrl,
      title: '', // 稍后更新
      icon: '',
      visitTime: Date.now(),
      activeDuration: 0,
      clicks: data.clicks || 0,
      scrollDistance: data.scrollDistance || 0,
      charsTyped: data.charsTyped || 0,
      keywords: data.keywords || []
    });
  }

  await chrome.storage.local.set({ browsingData });
}

async function handleSummaryRequest() {
  const result = await chrome.storage.local.get({ lastShownDate: "" });
  const today = new Date().toDateString();
  if (result.lastShownDate === today) return null;
  const summary = await getTodaySummary();
  if (!summary || summary.sites === 0) return null;
  await chrome.storage.local.set({ lastShownDate: today });
  return summary;
}

async function getTodaySummary() {
  const result = await chrome.storage.local.get({ browsingData: [] });
  const today = new Date().toDateString();
  const todayData = result.browsingData.filter(record => new Date(record.visitTime).toDateString() === today);

  if (todayData.length === 0) return null;

  const categoryStats = { work: 0, study: 0, social: 0, video: 0, other: 0 };
  const hourMap = {};
  const timeline = { morning: new Set(), afternoon: new Set(), evening: new Set() };
  
  // 新逻辑：按停留时长加权计算关键词优先级
  const keywordWeight = {};
  let topSite = { title: '', duration: 0 };

  todayData.forEach(r => {
    const duration = r.activeDuration || 0;
    const cat = categorizeUrl(r.url, '', r.keywords);
    categoryStats[cat] = (categoryStats[cat] || 0) + duration;
    
    const hr = new Date(r.visitTime).getHours();
    hourMap[hr] = (hourMap[hr] || 0) + 1;
    
    const keywords = r.keywords || [];
    keywords.forEach(k => {
      // 核心：关键词的权重 = 该页面累计停留的时长
      keywordWeight[k] = (keywordWeight[k] || 0) + duration;
      
      if (hr >= 6 && hr < 12) timeline.morning.add(k);
      else if (hr >= 12 && hr < 18) timeline.afternoon.add(k);
      else if (hr >= 18 || hr < 6) timeline.evening.add(k);
    });

    if (duration > topSite.duration) {
      topSite = { title: r.title || '某个神秘站点', duration: duration };
    }
  });

  const mainCategory = Object.entries(categoryStats).sort((a,b)=>b[1]-a[1])[0][0];
  
  // 根据累加的时长权重进行排序，取前10
  const topKeywords = Object.entries(keywordWeight)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);

  return {
    totalClicks: todayData.reduce((sum, r) => sum + (r.clicks || 0), 0),
    totalScroll: todayData.reduce((sum, r) => sum + (r.scrollDistance || 0), 0),
    totalChars: todayData.reduce((sum, r) => sum + (r.charsTyped || 0), 0),
    totalDuration: todayData.reduce((sum, r) => sum + (r.activeDuration || 0), 0),
    sites: new Set(todayData.map(r => getCleanUrl(r.url))).size,
    peakHour: Object.entries(hourMap).sort((a,b)=>b[1]-a[1])[0]?.[0] || 18,
    keywords: topKeywords,
    timeline: {
      morning: Array.from(timeline.morning).slice(0, 5),
      afternoon: Array.from(timeline.afternoon).slice(0, 5),
      evening: Array.from(timeline.evening).slice(0, 5)
    },
    categories: categoryStats,
    mainCategory,
    topSiteTitle: topSite.title
  };
}

function categorizeUrl(url, title, keywords) {
  const categories = {
    work: ['github', 'stackoverflow', 'docs', 'feishu', 'dingtalk', 'work', 'office', 'coding', 'programming', 'jira', 'confluence', 'vsc', 'developer'],
    study: ['wikipedia', 'zhihu', 'edu', 'course', 'learning', 'research', 'bible', 'nature', 'science', 'medium'],
    social: ['weibo', 'xiaohongshu', 'v2ex', 'reddit', 'twitter', 'facebook', 'instagram', 'tieba'],
    video: ['bilibili', 'youtube', 'netflix', 'douyin', 'video', 'tv', 'stream'],
    news: ['news', 'reuters', 'bbc', 'sina', 'toutiao']
  };
  const text = (url + (keywords || []).join(' ')).toLowerCase();
  for (const [cat, words] of Object.entries(categories)) {
    if (words.some(word => text.includes(word))) return cat;
  }
  return 'other';
}

async function checkAndTriggerSunset() {
  const settings = await chrome.storage.local.get({ sunsetTime: '18:00' });
  const [h, m] = settings.sunsetTime.split(':').map(Number);
  const now = new Date();
  if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_SUNSET' }).catch(()=>{});
    });
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyCleanup') clearOldData();
  else if (alarm.name === 'checkSunset') checkAndTriggerSunset();
});

function clearOldData() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  chrome.storage.local.get({ browsingData: [] }, (result) => {
    const filteredData = result.browsingData.filter(record => record.visitTime > oneDayAgo);
    chrome.storage.local.set({ browsingData: filteredData });
  });
}
