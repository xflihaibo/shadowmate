// Background Service Worker for 伴影 (Shadow Mate)

interface ActiveTabInfo {
  tabId: number | null
  url: string | null
  startTime: number | null
}

interface BrowsingRecord {
  url: string
  title?: string
  icon?: string
  visitTime: number
  activeDuration?: number
  clicks?: number
  scrollDistance?: number
  charsTyped?: number
  keywords?: string[]
}

interface UpdateStatsData {
  clicks?: number
  scrollDistance?: number
  charsTyped?: number
  keywords?: string[]
}

let activeTabInfo: ActiveTabInfo = { tabId: null, url: null, startTime: null }

chrome.runtime.onInstalled.addListener(() => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(1, 0, 0, 0)

  chrome.alarms.create('dailyCleanup', {
    when: tomorrow.getTime(),
    periodInMinutes: 1440
  })
  chrome.alarms.create('checkSunset', { periodInMinutes: 60 })
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  handleTabChange(activeInfo.tabId)
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking()
  } else {
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (tabs[0]) handleTabChange(tabs[0].id!)
    })
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    handleTabChange(tabId)
  }
})

async function handleTabChange(tabId: number) {
  const now = Date.now()
  if (activeTabInfo.tabId != null && activeTabInfo.startTime != null) {
    const duration = Math.floor((now - activeTabInfo.startTime) / 1000)
    if (duration > 0 && activeTabInfo.url) {
      await accumulateTime(activeTabInfo.url, duration)
    }
  }
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url || tab.url.startsWith('chrome://')) {
      activeTabInfo = { tabId: null, url: null, startTime: null }
      return
    }
    activeTabInfo = { tabId, url: tab.url, startTime: now }
    ensureRecordExists(tab)
  })
}

async function ensureRecordExists(tab: chrome.tabs.Tab) {
  const res = await chrome.storage.local.get({ browsingData: [] as BrowsingRecord[] })
  let browsingData = res.browsingData
  const today = new Date().toDateString()
  const cleanUrl = getCleanUrl(tab.url!)
  let found = false
  for (const r of browsingData) {
    if (getCleanUrl(r.url) === cleanUrl && new Date(r.visitTime).toDateString() === today) {
      r.title = tab.title || r.title
      r.icon = tab.favIconUrl || r.icon
      found = true
      break
    }
  }
  if (!found) {
    browsingData.push({
      url: tab.url!,
      title: tab.title || '',
      icon: tab.favIconUrl || '',
      visitTime: Date.now(),
      activeDuration: 0,
      clicks: 0,
      scrollDistance: 0,
      charsTyped: 0,
      keywords: []
    })
  }
  await chrome.storage.local.set({ browsingData })
  await ensureCompanionDayRecorded(today)
}

function stopTracking() {
  if (activeTabInfo.url && activeTabInfo.startTime) {
    const duration = Math.floor((Date.now() - activeTabInfo.startTime) / 1000)
    if (duration > 0) accumulateTime(activeTabInfo.url, duration)
  }
  activeTabInfo = { tabId: null, url: null, startTime: null }
}

const COMPANION_ACTIVE_DAYS_MAX = 365

async function ensureCompanionDayRecorded(today: string) {
  const res = await chrome.storage.local.get({ companionActiveDays: [] as string[] })
  let days = res.companionActiveDays || []
  if (days.includes(today)) return
  days.push(today)
  if (days.length > COMPANION_ACTIVE_DAYS_MAX) days = days.slice(-COMPANION_ACTIVE_DAYS_MAX)
  await chrome.storage.local.set({ companionActiveDays: days })
}

async function accumulateTime(url: string, duration: number) {
  const res = await chrome.storage.local.get({ isEnabled: true, browsingData: [] as BrowsingRecord[] })
  if (!res.isEnabled) return
  const today = new Date().toDateString()
  const cleanUrl = getCleanUrl(url)
  const browsingData = res.browsingData
  for (const record of browsingData) {
    if (getCleanUrl(record.url) === cleanUrl && new Date(record.visitTime).toDateString() === today) {
      record.activeDuration = (record.activeDuration || 0) + duration
      break
    }
  }
  await chrome.storage.local.set({ browsingData })
  await ensureCompanionDayRecorded(today)
}

function getCleanUrl(u: string): string {
  try {
    const urlObj = new URL(u)
    return urlObj.origin + urlObj.pathname
  } catch {
    return u
  }
}

chrome.runtime.onMessage.addListener((message: { type: string; data?: UpdateStatsData; jdBenefitInfo?: unknown; summary?: unknown }, sender, sendResponse) => {
  if (message.type === 'UPDATE_STATS' && sender.tab) {
    updateOtherStats(sender.tab.id!, message.data!, sender.tab.url!)
    return false
  }
  if (message.type === 'GET_TODAY_SUMMARY') {
    handleSummaryRequest().then(sendResponse)
    return true
  }
  if (message.type === 'GET_PAGE_MEMORY') {
    if (!sender.tab?.url) {
      sendResponse(null)
      return true
    }
    const urlKey = getCleanUrl(sender.tab.url)
    chrome.storage.local.get({ highlightMoments: {} as Record<string, unknown> }, (res) => {
      sendResponse((res.highlightMoments as Record<string, unknown>)[urlKey] ?? null)
    })
    return true
  }
  if (message.type === 'TEST_COZE_API') {
    generateContentWithCoze(message.jdBenefitInfo).then(sendResponse)
    return true
  }
  if (message.type === 'GENERATE_ENHANCED_NARRATIVE') {
    generateEnhancedNarrative(message.summary as Awaited<ReturnType<typeof getTodaySummary>>).then(sendResponse)
    return true
  }
  return false
})

async function updateOtherStats(tabId: number, data: UpdateStatsData, senderUrl: string) {
  const res = await chrome.storage.local.get({ browsingData: [] as BrowsingRecord[] })
  let browsingData = res.browsingData
  const today = new Date().toDateString()
  const targetUrl = getCleanUrl(senderUrl)
  let found = false
  for (const record of browsingData) {
    if (getCleanUrl(record.url) === targetUrl && new Date(record.visitTime).toDateString() === today) {
      record.clicks = (record.clicks || 0) + (data.clicks || 0)
      record.scrollDistance = (record.scrollDistance || 0) + (data.scrollDistance || 0)
      record.charsTyped = (record.charsTyped || 0) + (data.charsTyped || 0)
      if (data.keywords) {
        const ks = new Set([...(record.keywords || []), ...data.keywords])
        record.keywords = Array.from(ks).slice(0, 15)
      }
      found = true
      break
    }
  }
  if (!found && targetUrl && !targetUrl.startsWith('chrome://')) {
    browsingData.push({
      url: senderUrl,
      title: '',
      icon: '',
      visitTime: Date.now(),
      activeDuration: 0,
      clicks: data.clicks || 0,
      scrollDistance: data.scrollDistance || 0,
      charsTyped: data.charsTyped || 0,
      keywords: data.keywords || []
    })
  }
  await chrome.storage.local.set({ browsingData })
  await ensureCompanionDayRecorded(today)
}

async function handleSummaryRequest() {
  const summary = await getTodaySummary()
  if (!summary || summary.sites === 0) return null
  return summary
}

interface TodaySummary {
  totalClicks: number
  totalScroll: number
  totalChars: number
  totalDuration: number
  sites: number
  peakHour: number
  keywords: string[]
  timeline: { morning: string[]; afternoon: string[]; evening: string[] }
  categories: Record<string, number>
  mainCategory: string
  topSiteTitle: string
}

async function getTodaySummary(): Promise<TodaySummary | null> {
  const result = await chrome.storage.local.get({ browsingData: [] as BrowsingRecord[] })
  const today = new Date().toDateString()
  const todayData = result.browsingData.filter((r) => new Date(r.visitTime).toDateString() === today)
  if (todayData.length === 0) return null

  const categoryStats: Record<string, number> = { work: 0, study: 0, social: 0, video: 0, other: 0 }
  const hourMap: Record<number, number> = {}
  const timeline = { morning: new Set<string>(), afternoon: new Set<string>(), evening: new Set<string>() }
  const keywordWeight: Record<string, number> = {}
  let topSite = { title: '', duration: 0 }

  for (const r of todayData) {
    const duration = r.activeDuration || 0
    const cat = categorizeUrl(r.url, '', r.keywords)
    categoryStats[cat] = (categoryStats[cat] || 0) + duration
    const hr = new Date(r.visitTime).getHours()
    hourMap[hr] = (hourMap[hr] || 0) + 1
    const keywords = r.keywords || []
    for (const k of keywords) {
      keywordWeight[k] = (keywordWeight[k] || 0) + duration
      if (hr >= 6 && hr < 12) timeline.morning.add(k)
      else if (hr >= 12 && hr < 18) timeline.afternoon.add(k)
      else if (hr >= 18 || hr < 6) timeline.evening.add(k)
    }
    if (duration > topSite.duration) {
      topSite = { title: r.title || '某个神秘站点', duration }
    }
  }

  const mainCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0][0]
  const topKeywords = Object.entries(keywordWeight)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((e) => e[0])

  return {
    totalClicks: todayData.reduce((s, r) => s + (r.clicks || 0), 0),
    totalScroll: todayData.reduce((s, r) => s + (r.scrollDistance || 0), 0),
    totalChars: todayData.reduce((s, r) => s + (r.charsTyped || 0), 0),
    totalDuration: todayData.reduce((s, r) => s + (r.activeDuration || 0), 0),
    sites: new Set(todayData.map((r) => getCleanUrl(r.url))).size,
    peakHour: Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 18,
    keywords: topKeywords,
    timeline: {
      morning: Array.from(timeline.morning).slice(0, 5),
      afternoon: Array.from(timeline.afternoon).slice(0, 5),
      evening: Array.from(timeline.evening).slice(0, 5)
    },
    categories: categoryStats,
    mainCategory,
    topSiteTitle: topSite.title
  }
}

function categorizeUrl(url: string, _title: string, keywords: string[] = []): string {
  const categories: Record<string, string[]> = {
    work: ['github', 'stackoverflow', 'docs', 'feishu', 'dingtalk', 'work', 'office', 'coding', 'programming', 'jira', 'confluence', 'vsc', 'developer'],
    study: ['wikipedia', 'zhihu', 'edu', 'course', 'learning', 'research', 'bible', 'nature', 'science', 'medium'],
    social: ['weibo', 'xiaohongshu', 'v2ex', 'reddit', 'twitter', 'facebook', 'instagram', 'tieba'],
    video: ['bilibili', 'youtube', 'netflix', 'douyin', 'video', 'tv', 'stream'],
    news: ['news', 'reuters', 'bbc', 'sina', 'toutiao']
  }
  const text = (url + (keywords || []).join(' ')).toLowerCase()
  for (const [cat, words] of Object.entries(categories)) {
    if (words.some((word) => text.includes(word))) return cat
  }
  return 'other'
}

async function checkAndTriggerSunset() {
  const settings = await chrome.storage.local.get({ sunsetTime: '18:00', isEnabled: true })
  if (!settings.isEnabled) return
  const [h, m] = (settings.sunsetTime as string).split(':').map(Number)
  const now = new Date()
  if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { type: 'CHECK_SUNSET' }).catch(() => {})
    })
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyCleanup') clearOldData()
  else if (alarm.name === 'checkSunset') checkAndTriggerSunset()
})

async function generateContentWithCoze(jdBenefitInfo: unknown): Promise<unknown> {
  const apiUrl = 'https://5p3pcj4wg7.coze.site/run'
  const bearerToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjcyYmU4YTQyLThhZmMtNGI1ZC04NWM5LTc5YjU1NmU0YzZjOCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIm5iV2J3MHFlTW5SWVRnSG5FR2FqcHBaUFQxdWhGTU9LIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY4NDU3NjQ3LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTk1NDYwNzcxMTk1MTI1ODAyIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTk1NDY3NzU5ODk5NjM5ODE4In0.m4IW8OeYHEVnOUqNpekezyuFIjtDYOZL9R18RZaREfVNaOs9kH9at7Qzg2BCIIovdo8YkUCxAIlE6MxTkXuDtaDHygMPJIE04im90aqPUfKJptwU9FGFdsxDC9X9V0_NMwUA2E3ZsLxKLYdL-VA0SIkUeVfiqituD1wg32M7aici-nox_6lkcgSf0e1DqyeyGStxoM8jc9QT5_4wcbEFR0IiohID50hlwn3QGJRiC9lkgZEnp4Q5GIxZlRmQuY5JNYoraiVFY9h-Iq0fT6mg3Frk17-PDb2_SWoaQw0CZo9iyLMCsGYG7X9LHE4Iwiov_ieGT9rAFa3DbPWTlTN5rw'
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jd_benefit_info: jdBenefitInfo })
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Error calling Coze API:', error)
    return null
  }
}

async function generateEnhancedNarrative(summary: TodaySummary | null): Promise<string> {
  if (!summary) return ''
  const shoppingKeywords = ['jd', 'taobao', 'tmall', 'pdd', 'suning', 'gome', 'amazon']
  const hasShoppingActivity = summary.keywords.some((k) =>
    shoppingKeywords.some((shop) => k.toLowerCase().includes(shop))
  )
  let additionalContent = ''
  if (hasShoppingActivity && summary.keywords.length > 0) {
    const result = await chrome.storage.local.get({ browsingData: [] as BrowsingRecord[] })
    const today = new Date().toDateString()
    const todayData = result.browsingData.filter((r) => new Date(r.visitTime).toDateString() === today)
    const shoppingUrls = todayData
      .filter((r) => shoppingKeywords.some((shop) => r.url.toLowerCase().includes(shop)))
      .map((r) => r.url)
      .slice(0, 3)
    for (const url of shoppingUrls) {
      const cozeResult = (await generateContentWithCoze(url)) as { generated_copy?: string; generated_image_url?: string } | null
      if (cozeResult?.generated_copy) {
        additionalContent += `\n\n💰 今日购物发现：\n${cozeResult.generated_copy}`
        if (cozeResult.generated_image_url) additionalContent += '\n📸 [商品图片已生成]'
      }
    }
  }
  return additionalContent
}

function clearOldData() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const today = new Date().toDateString()
  chrome.storage.local.get({ browsingData: [] as BrowsingRecord[] }, (result) => {
    const filteredData = result.browsingData.filter((r) => r.visitTime > oneDayAgo)
    chrome.storage.local.set({ browsingData: filteredData })
  })
  chrome.storage.local.get(['isGhostClosedToday', 'isHintClosedToday', 'lastRitualDate'], (result: { isGhostClosedToday?: string; isHintClosedToday?: string; lastRitualDate?: string }) => {
    const updates: Record<string, string> = {}
    if (result.isGhostClosedToday !== today) updates.isGhostClosedToday = ''
    if (result.isHintClosedToday !== today) updates.isHintClosedToday = ''
    if (result.lastRitualDate !== today) updates.lastRitualDate = ''
    if (Object.keys(updates).length > 0) chrome.storage.local.set(updates)
  })
}
