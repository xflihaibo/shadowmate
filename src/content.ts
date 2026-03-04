// Content Script for 伴影 (Shadow Mate)
import { getEffectiveLocale, t } from './i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

type Locale = 'zh' | 'en'
function getMessages(locale: Locale): Record<string, unknown> {
  return locale === 'zh' ? (zh as Record<string, unknown>) : (en as Record<string, unknown>)
}
function getFallback(locale: Locale): Record<string, unknown> {
  return locale === 'zh' ? (en as Record<string, unknown>) : (zh as Record<string, unknown>)
}
function msg(messages: Record<string, unknown>, locale: Locale, key: string, placeholders?: Record<string, string | number>) {
  return t(messages, key, { placeholders, fallbackMessages: getFallback(locale) })
}

interface PageStats {
  clicks: number
  scrollDistance: number
  keywords: string[]
  charsTyped: number
  searchQuery: string | null
  activeDuration: number
}

interface ClipboardHistoryItem {
  text: string
  timestamp: number
  url?: string
}

const stats: PageStats = {
  clicks: 0,
  scrollDistance: 0,
  keywords: [],
  charsTyped: 0,
  searchQuery: null,
  activeDuration: 0
}

const lazhuIconUrl = chrome.runtime.getURL('icons/lazhu.png')
const ghostGifUrl = chrome.runtime.getURL('icons/ghost.gif')

function isCandleGhost(el: Element | null): boolean {
  if (!el) return false
  return (el as HTMLElement).dataset?.candle === 'true' || !!el.querySelector('.shadow-mate-ghost-candle-icon')
}

let isRitualShown = false
let localGhostClosed = false

const MAX_CLIPBOARD_HISTORY = 10
let clipboardHistory: ClipboardHistoryItem[] = []
let currentFocusedInput: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null
let currentClipboardIndex = -1
let hasFilledFromClipboardThisFocus = false
let previewTooltip: HTMLDivElement | null = null
let lastSelection = ''
const inputValueCache = new WeakMap<HTMLElement, string>()
let lastPasteTime = 0
let lastScrollY = window.scrollY

function isContextValid(): boolean {
  return typeof chrome !== 'undefined' && !!chrome?.runtime?.id
}

if (isContextValid()) {
  chrome.storage.onChanged.addListener((changes) => {
    const today = new Date().toDateString()
    if (changes.isGhostClosedToday?.newValue === today) {
      document.querySelectorAll('.shadow-mate-ghost, .shadow-mate-card').forEach((el) => {
        if ((el as HTMLElement).dataset?.type !== 'hint') el.remove()
      })
      document.getElementById('shadow-mate-sunset-overlay')?.remove()
    }
    if (changes.isHintClosedToday?.newValue === today) {
      document.querySelectorAll('.shadow-mate-ghost').forEach((el) => {
        if (isCandleGhost(el)) el.remove()
      })
      document.getElementById('shadow-mate-sunset-overlay')?.remove()
    }
  })
}

async function checkGhostClosed(): Promise<boolean> {
  if (!isContextValid()) return true
  const today = new Date().toDateString()
  const res = await chrome.storage.local.get({ isGhostClosedToday: '' })
  if (res.isGhostClosedToday && res.isGhostClosedToday !== today) localGhostClosed = false
  if (localGhostClosed) return true
  const closed = res.isGhostClosedToday === today
  if (closed) localGhostClosed = true
  return closed
}

const heartbeatInterval = setInterval(() => {
  if (!isContextValid()) {
    clearInterval(heartbeatInterval)
    return
  }
  checkEnabled(() => {
    if (document.visibilityState === 'visible') stats.activeDuration++
  })
}, 1000)

window.addEventListener('click', () => {
  if (!isContextValid()) return
  checkEnabled(() => { stats.clicks++ })
})

window.addEventListener(
  'input',
  (e: Event) => {
    if (!isContextValid()) return
    const target = e.target as HTMLElement
    checkEnabled(() => {
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement & { isContentEditable?: boolean }).isContentEditable) {
        stats.charsTyped++
      }
    })
  },
  true
)

window.addEventListener(
  'scroll',
  () => {
    if (!isContextValid()) return
    checkEnabled(() => {
      const currentScrollY = window.scrollY
      stats.scrollDistance += Math.abs(currentScrollY - lastScrollY)
      lastScrollY = currentScrollY
    })
  },
  { passive: true }
)

async function loadClipboardHistoryFromStorage() {
  if (!isContextValid()) return
  try {
    const res = await chrome.storage.local.get({ clipboardHistory: [] as ClipboardHistoryItem[] })
    clipboardHistory = res.clipboardHistory || []
    if (clipboardHistory.length === 0 || currentClipboardIndex >= clipboardHistory.length) {
      currentClipboardIndex = -1
    }
  } catch (e) {
    console.error('伴影：加载剪贴板历史失败', e)
  }
}

async function saveClipboardHistoryToStorage() {
  if (!isContextValid()) return
  try {
    await chrome.storage.local.set({
      clipboardHistory: clipboardHistory.slice(0, MAX_CLIPBOARD_HISTORY)
    })
  } catch (e) {
    console.error('伴影：保存剪贴板历史失败', e)
  }
}

document.addEventListener('selectionchange', () => {
  if (!isContextValid()) return
  try {
    const selection = window.getSelection()?.toString().trim()
    if (selection) lastSelection = selection
  } catch {}
})

async function saveClipboardText(text: string): Promise<boolean> {
  if (!text?.trim()) return false
  const trimmedText = text.trim()
  await loadClipboardHistoryFromStorage()
  const isDuplicate = clipboardHistory.some((item) => item.text === trimmedText)
  if (isDuplicate) return false
  clipboardHistory.unshift({
    text: trimmedText,
    timestamp: Date.now(),
    url: window.location.href
  })
  if (clipboardHistory.length > MAX_CLIPBOARD_HISTORY) {
    clipboardHistory = clipboardHistory.slice(0, MAX_CLIPBOARD_HISTORY)
  }
  await saveClipboardHistoryToStorage()
  return true
}

document.addEventListener(
  'copy',
  async () => {
    if (!isContextValid()) return
    checkClipboardEnabled(async () => {
      try {
        let copiedText = window.getSelection()?.toString().trim() || ''
        if (!copiedText && lastSelection) copiedText = lastSelection
        if (copiedText) {
          await saveClipboardText(copiedText)
          lastSelection = ''
        }
      } catch (err) {
        console.error('伴影：保存剪贴板记录失败', err)
      }
    })
  },
  true
)

document.addEventListener(
  'paste',
  async (e: ClipboardEvent) => {
    if (!isContextValid()) return
    checkClipboardEnabled(async () => {
      try {
        lastPasteTime = Date.now()
        if (e.clipboardData) {
          const pastedText = e.clipboardData.getData('text/plain')
          if (pastedText?.trim()) await saveClipboardText(pastedText)
        } else {
          try {
            if (navigator.clipboard?.readText) {
              const clipboardText = await navigator.clipboard.readText()
              if (clipboardText?.trim()) await saveClipboardText(clipboardText)
            }
          } catch {}
        }
      } catch (err) {
        console.error('伴影：处理粘贴事件失败', err)
      }
    })
  },
  true
)

document.addEventListener(
  'input',
  async (e: Event) => {
    if (!isContextValid()) return
    checkClipboardEnabled(async () => {
      try {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | (HTMLElement & { isContentEditable?: boolean; innerText?: string }) | null
        if (!target) return
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !(target as HTMLElement & { isContentEditable?: boolean }).isContentEditable) return
        if ((target as HTMLInputElement).type === 'password' || (target as HTMLInputElement).type === 'file' || (target as HTMLInputElement).type === 'hidden') return
        const currentValue = (target as HTMLInputElement).value ?? (target as HTMLElement & { innerText?: string }).innerText ?? ''
        const previousValue = inputValueCache.get(target as HTMLElement) ?? ''
        if (
          currentValue !== previousValue &&
          Date.now() - lastPasteTime < 2000 &&
          currentValue.length > previousValue.length + 10
        ) {
          try {
            if (navigator.clipboard?.readText) {
              const clipboardText = await navigator.clipboard.readText()
              if (clipboardText?.trim() && currentValue.includes(clipboardText.trim())) {
                await saveClipboardText(clipboardText)
              }
            }
          } catch {}
        }
        inputValueCache.set(target as HTMLElement, currentValue)
      } catch {}
    })
  },
  true
)

async function checkClipboardContent() {
  if (!isContextValid()) return
  try {
    if (navigator.clipboard?.readText) {
      const clipboardText = await navigator.clipboard.readText()
      if (clipboardText?.trim()) await saveClipboardText(clipboardText)
    }
  } catch {}
}

window.addEventListener('focus', () => {
  if (!isContextValid()) return
  checkClipboardEnabled(() => setTimeout(checkClipboardContent, 500))
})

document.addEventListener('visibilitychange', () => {
  if (!isContextValid() || document.visibilityState !== 'visible') return
  const activeElement = document.activeElement as HTMLElement & { isContentEditable?: boolean } | null
  if (
    activeElement &&
    (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable) &&
    (activeElement as HTMLInputElement).type !== 'password' &&
    (activeElement as HTMLInputElement).type !== 'file' &&
    (activeElement as HTMLInputElement).type !== 'hidden'
  ) {
    currentFocusedInput = activeElement
    currentClipboardIndex = -1
    hasFilledFromClipboardThisFocus = false
  }
})

function createPreviewTooltip(): HTMLDivElement {
  if (previewTooltip) return previewTooltip
  previewTooltip = document.createElement('div')
  previewTooltip.id = 'shadow-mate-clipboard-preview'
  previewTooltip.style.cssText = `
    position: fixed; background: rgba(0,0,0,0.85); color: white; padding: 8px 12px;
    border-radius: 6px; font-size: 12px; max-width: 300px; z-index: 100000;
    pointer-events: none; opacity: 0; transition: opacity 0.2s ease; word-break: break-word;
    line-height: 1.4; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `
  document.body.appendChild(previewTooltip)
  return previewTooltip
}

function showPreview(text: string, inputElement: HTMLElement) {
  if (!text || !inputElement) {
    hidePreview()
    return
  }
  const tooltip = createPreviewTooltip()
  tooltip.textContent = text.length > 50 ? text.slice(0, 50) + '...' : text
  const rect = inputElement.getBoundingClientRect()
  tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px'
  tooltip.style.left = rect.left + 'px'
  tooltip.style.opacity = '1'
}

function hidePreview() {
  if (previewTooltip) previewTooltip.style.opacity = '0'
}

function insertTextAtCursor(element: HTMLElement, text: string) {
  const selection = window.getSelection()!
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const textNode = document.createTextNode(text)
    range.insertNode(textNode)
    range.setStartAfter(textNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  } else {
    const textNode = document.createTextNode(text)
    element.appendChild(textNode)
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

function fillInput(inputElement: HTMLElement | null, text: string, append = false) {
  if (!inputElement || !text) return
  try {
    const ce = inputElement as HTMLElement & { isContentEditable?: boolean; innerText?: string; value?: string }
    if (ce.isContentEditable) {
      const currentContent = (ce.innerText ?? ce.textContent ?? '') as string
      if (append && currentContent.trim().length > 0) {
        try {
          insertTextAtCursor(inputElement, text)
        } catch {
          ce.innerText = (ce.innerText ?? ce.textContent ?? '') + text
        }
      } else {
        ce.innerText = text
      }
      inputElement.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      const input = inputElement as HTMLInputElement | HTMLTextAreaElement
      if (append && (input.value ?? '').trim().length > 0) {
        input.value = input.value + text
      } else {
        input.value = text
      }
      inputElement.dispatchEvent(new Event('input', { bubbles: true }))
    }
    showPreview(text, inputElement)
    setTimeout(hidePreview, 2000)
  } catch (e) {
    console.error('伴影：填充输入框失败', e)
  }
}

document.addEventListener(
  'focusin',
  async (e: FocusEvent) => {
    if (!isContextValid()) return
    checkEnabled(async () => {
      const target = e.target as HTMLElement & { isContentEditable?: boolean; innerText?: string; value?: string; type?: string }
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) return
      if (target.type === 'password' || target.type === 'file' || target.type === 'hidden') return
      const currentValue = target.value ?? target.innerText ?? ''
      if (currentValue?.trim().length > 0) {
        currentFocusedInput = target
        currentClipboardIndex = -1
        hasFilledFromClipboardThisFocus = false
        return
      }
      currentFocusedInput = target
      currentClipboardIndex = -1
      hasFilledFromClipboardThisFocus = false
      checkClipboardEnabled(async () => {
        try {
          if (navigator.clipboard?.readText) {
            const clipboardText = await navigator.clipboard.readText()
            if (clipboardText?.trim()) await saveClipboardText(clipboardText)
          }
        } catch {}
        await loadClipboardHistoryFromStorage()
      })
    })
  },
  true
)

document.addEventListener('focusout', (e: FocusEvent) => {
  if (currentFocusedInput === e.target) {
    currentFocusedInput = null
    currentClipboardIndex = -1
    hasFilledFromClipboardThisFocus = false
    hidePreview()
  }
})

document.addEventListener(
  'keydown',
  async (e: KeyboardEvent) => {
    if (!isContextValid() || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    if (window.location.href.includes('feishu.cn')) return
    const activeElement = document.activeElement as HTMLElement & { isContentEditable?: boolean; innerText?: string; type?: string } | null
    if (!activeElement) return
    const isInput =
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    if (!isInput) return
    if (activeElement.type === 'password' || activeElement.type === 'file' || activeElement.type === 'hidden') return
    if (window.getSelection()?.toString().length) return
    if (activeElement.isContentEditable) {
      const content = (activeElement.innerText ?? activeElement.textContent ?? '').trim()
      if (content.length > 5000) return
    }
    currentFocusedInput = activeElement
    checkClipboardEnabled(async () => {
      await loadClipboardHistoryFromStorage()
      if (clipboardHistory.length === 0) {
        currentClipboardIndex = -1
        return
      }
      e.preventDefault()
      e.stopPropagation()
      const isFirstPress = !hasFilledFromClipboardThisFocus
      if (e.key === 'ArrowUp') {
        currentClipboardIndex = currentClipboardIndex === -1 ? 0 : currentClipboardIndex < clipboardHistory.length - 1 ? currentClipboardIndex + 1 : 0
      } else {
        currentClipboardIndex = currentClipboardIndex === -1 ? 0 : currentClipboardIndex > 0 ? currentClipboardIndex - 1 : clipboardHistory.length - 1
      }
      if (currentClipboardIndex >= 0 && currentClipboardIndex < clipboardHistory.length) {
        fillInput(currentFocusedInput, clipboardHistory[currentClipboardIndex].text, isFirstPress)
        if (isFirstPress) hasFilledFromClipboardThisFocus = true
      }
    })
  },
  true
)

loadClipboardHistoryFromStorage()

if (isContextValid()) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.clipboardHistory) loadClipboardHistoryFromStorage()
  })
}

function checkEnabled(callback: () => void) {
  if (!isContextValid()) return
  try {
    chrome.storage.local.get({ isEnabled: true }, (res) => {
      if (chrome.runtime.lastError) return
      if (res?.isEnabled && callback) callback()
    })
  } catch {}
}

function checkClipboardEnabled(callback: () => void) {
  if (!isContextValid()) return
  try {
    chrome.storage.local.get({ clipboardEnabled: true, isEnabled: true }, (res) => {
      if (chrome.runtime.lastError) return
      if (res?.isEnabled && res.clipboardEnabled !== false && callback) callback()
    })
  } catch {}
}

function extractKeywords(): string[] {
  const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content')
  const h1Text = document.querySelector('h1')?.innerText
  const title = document.title
  try {
    const url = new URL(window.location.href)
    if (url.hostname.includes('google') || url.hostname.includes('baidu') || url.hostname.includes('bing')) {
      const q = url.searchParams.get('q') ?? url.searchParams.get('wd')
      if (q) stats.searchQuery = q
    }
  } catch {}
  const keywords: string[] = []
  if (title) keywords.push(...cleanText(title))
  if (h1Text) keywords.push(...cleanText(h1Text))
  if (metaKeywords) keywords.push(...metaKeywords.split(/[,，]/).map((s) => s.trim()))
  return [...new Set(keywords)].filter((k) => k.length > 1 && k.length < 20).slice(0, 10)
}

function cleanText(text: string): string[] {
  return text.split(/[_\-|—]/).map((s) => s.trim()).filter((s) => s.length > 1)
}

function safeSendMessage(message: { type: string; data?: PageStats }, callback: (response: unknown) => void) {
  if (!isContextValid()) return
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError || !callback) return
      callback(response)
    })
  } catch {}
}

const syncInterval = setInterval(() => {
  if (!isContextValid()) {
    clearInterval(syncInterval)
    return
  }
  checkEnabled(() => {
    if (stats.clicks > 0 || stats.scrollDistance > 0 || stats.charsTyped > 0 || stats.activeDuration > 0) {
      stats.keywords = extractKeywords()
      safeSendMessage({ type: 'UPDATE_STATS', data: stats }, () => {})
      stats.clicks = 0
      stats.scrollDistance = 0
      stats.charsTyped = 0
      stats.activeDuration = 0
    }
  })
}, 5000)

async function updateGoldenHourEffect() {
  if (!isContextValid()) return
  try {
    const res = await chrome.storage.local.get({
      sunsetTime: '18:00',
      lastRitualDate: '',
      isGhostClosedToday: '',
      isHintClosedToday: ''
    })
    const now = new Date()
    const today = now.toDateString()
    const isGhostClosed = res.isGhostClosedToday === today
    const isHintClosed = res.isHintClosedToday === today
    const [sh, sm] = (res.sunsetTime as string).split(':').map(Number)
    const totalMins = now.getHours() * 60 + now.getMinutes()
    const sunsetMins = sh * 60 + sm
    const startMins = sunsetMins - 30
    let overlay = document.getElementById('shadow-mate-sunset-overlay')
    if (totalMins >= sunsetMins) {
      if (isGhostClosed) {
        document.querySelectorAll('.shadow-mate-ghost, .shadow-mate-card').forEach((el) => el.remove())
        document.getElementById('shadow-mate-sunset-overlay')?.remove()
        return
      }
      if (overlay) overlay.style.background = 'rgba(255, 140, 0, 0.05)'
      const ghost = document.querySelector('.shadow-mate-ghost')
      const isCandle = isCandleGhost(ghost)
      if (!isRitualShown || isCandle) showSunsetRitual(true)
      return
    }
    if (totalMins >= startMins && totalMins < sunsetMins) {
      if (isHintClosed) {
        document.querySelectorAll('.shadow-mate-ghost').forEach((el) => {
          if (isCandleGhost(el)) el.remove()
        })
        document.getElementById('shadow-mate-sunset-overlay')?.remove()
        return
      }
      if (!overlay) {
        overlay = document.createElement('div')
        overlay.id = 'shadow-mate-sunset-overlay'
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999; transition: background 2s ease; mix-blend-mode: multiply;'
        document.body.appendChild(overlay)
      }
      const progress = (totalMins - startMins) / (sunsetMins - startMins)
      overlay.style.background = `rgba(255, 140, 0, ${progress * 0.05})`
      if (!document.querySelector('.shadow-mate-ghost')) {
        injectStyles()
        createGhostUI(null).catch(() => {})
      }
      const ghost = document.querySelector('.shadow-mate-ghost')
      if (ghost) {
        ghost.classList.add('active')
        const span = ghost.querySelector('span')
        if (span) {
          span.textContent = ''
          const img = document.createElement('img')
          img.src = lazhuIconUrl
          img.className = 'shadow-mate-ghost-candle-icon'
          img.alt = ''
          span.appendChild(img)
          ghost.dataset.candle = 'true'
        }
      }
    } else if (overlay) {
      overlay.remove()
    }
  } catch {}
}

setInterval(() => {
  if (isContextValid() && document.visibilityState === 'visible') updateGoldenHourEffect()
}, 10000)
if (document.visibilityState === 'visible') updateGoldenHourEffect()
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isContextValid()) updateGoldenHourEffect()
})

if (isContextValid()) {
  chrome.runtime.onMessage.addListener((message: { type: string; isEnabled?: boolean; clipboardEnabled?: boolean }) => {
    if (message.type === 'TRIGGER_SUNSET') {
      isRitualShown = false
      localGhostClosed = false
      chrome.storage.local.set(
        { isGhostClosedToday: '', isHintClosedToday: '', lastRitualDate: '' },
        () => {
          checkEnabled(() => showSunsetRitual(true))
        }
      )
    } else if (message.type === 'CHECK_SUNSET') {
      checkTimeAndShow()
    } else if (message.type === 'STATE_CHANGED') {
      if (message.isEnabled === false) {
        document.getElementById('shadow-mate-sunset-overlay')?.remove()
        document.querySelectorAll('.shadow-mate-ghost, .shadow-mate-card').forEach((el) => el.remove())
      } else {
        updateGoldenHourEffect()
        checkTimeAndShow()
      }
    } else if (message.type === 'CLIPBOARD_STATE_CHANGED') {
      if (message.clipboardEnabled === false) {
        currentFocusedInput = null
        currentClipboardIndex = -1
        hasFilledFromClipboardThisFocus = false
        hidePreview()
      }
    }
  })
}

async function checkTimeAndShow() {
  if (!isContextValid()) return
  try {
    const res = await chrome.storage.local.get({ isEnabled: true, sunsetTime: '18:00' })
    if (!res.isEnabled) return
    const [sh, sm] = (res.sunsetTime as string).split(':').map(Number)
    const now = new Date()
    if (now.getHours() * 60 + now.getMinutes() >= sh * 60 + sm) {
      showSunsetRitual()
    } else {
      updateGoldenHourEffect()
    }
    safeSendMessage({ type: 'GET_PAGE_MEMORY' }, (memory: { visitTime?: number; charsTyped?: number } | null) => {
      if (memory && (Date.now() - (memory.visitTime ?? 0) > 12 * 60 * 60 * 1000)) showMemoryGhost(memory)
    })
  } catch {}
}

async function showMemoryGhost(memory: { visitTime?: number; charsTyped?: number }) {
  if (!isContextValid()) return
  if (await checkGhostClosed()) return
  const locale = await getEffectiveLocale()
  const messages = getMessages(locale)
  const dateStr = new Date(memory.visitTime!).toLocaleDateString()
  const count = memory.charsTyped ?? 0
  const bubbleText = msg(messages, locale, 'content.timeCapsule', { date: dateStr, count })
  const goodbyeTitle = msg(messages, locale, 'content.goodbye')
  injectStyles()
  const ghost = document.createElement('div')
  ghost.className = 'shadow-mate-ghost active'
  ghost.style.bottom = '120px'
  ghost.innerHTML = `<div class="shadow-mate-ghost-close" title="${goodbyeTitle}">×</div><div class="shadow-mate-bubble" style="opacity:1; transform:translateY(0) scale(1);">${bubbleText}</div><span class="shadow-mate-ghost-icon-wrap"><img src="${ghostGifUrl}" class="shadow-mate-ghost-icon" alt=""></span>`
  document.body.appendChild(ghost)
  ghost.addEventListener('click', (e: Event) => {
    if ((e.target as HTMLElement).classList.contains('shadow-mate-ghost-close')) {
      localGhostClosed = true
      chrome.storage.local.set({ isGhostClosedToday: new Date().toDateString() })
      ghost.remove()
    }
  })
}

checkTimeAndShow()

interface TodaySummary {
  totalClicks: number
  totalScroll: number
  totalChars: number
  totalDuration: number
  sites: number
  peakHour: number
  keywords: string[]
  timeline: { morning: string[]; afternoon: string[]; evening: string[] }
  mainCategory: string
  topSiteTitle: string
}

async function showSunsetRitual(force = false) {
  if (!isContextValid()) return
  const today = new Date().toDateString()
  if (await checkGhostClosed()) return
  const res = await chrome.storage.local.get({ lastRitualDate: '' })
  if (res.lastRitualDate === today && !force) return
  const existingGhost = document.querySelector('.shadow-mate-ghost')
  if (existingGhost && !isCandleGhost(existingGhost) && isRitualShown) return
  if (isRitualShown && !force) return
  const fn = showSunsetRitual as typeof showSunsetRitual & { isFetching?: boolean }
  if (fn.isFetching) return
  fn.isFetching = true
  safeSendMessage({ type: 'GET_TODAY_SUMMARY' }, async (summary: TodaySummary | null) => {
    fn.isFetching = false
    if (!summary || !isContextValid()) return
    if (!force) chrome.storage.local.set({ lastRitualDate: new Date().toDateString() })
    isRitualShown = true
    injectStyles()
    document.querySelectorAll('.shadow-mate-ghost').forEach((el) => el.remove())
    const todayStr = new Date().toDateString()
    const toneIndex = getDailyToneIndex(todayStr, 3)
    const tones: NarrativeTone[] = ['warm', 'poetic', 'cute']
    const tone = tones[toneIndex]
    await createGhostUI(summary, tone)
    const ghost = document.querySelector('.shadow-mate-ghost')
    if (ghost) {
      ghost.setAttribute('data-ritual', 'true')
      ghost.classList.add('active')
    }
  })
}

function injectStyles() {
  if (document.getElementById('shadow-mate-styles')) return
  const style = document.createElement('style')
  style.id = 'shadow-mate-styles'
  style.textContent = `
    .shadow-mate-ghost { position: fixed; right: -100px; bottom: 50px; width: 60px; height: 60px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10000; transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.3); animation: shadow-float 3s ease-in-out infinite; opacity: 0; pointer-events: none; }
    .shadow-mate-ghost.active { right: 30px; opacity: 1; pointer-events: auto; }
    @keyframes shadow-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .shadow-mate-ghost span { font-size: 28px; animation: shadow-breath 2s ease-in-out infinite; }
    .shadow-mate-ghost-icon-wrap { display: flex; align-items: center; justify-content: center; }
    .shadow-mate-ghost-icon { width: 28px; height: 28px; object-fit: contain; animation: shadow-breath 2s ease-in-out infinite; }
    .shadow-mate-ghost-candle-icon { width: 28px; height: 28px; object-fit: contain; animation: shadow-breath 2s ease-in-out infinite; }
    @keyframes shadow-breath { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
    .shadow-mate-ghost-close { position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; background: #ff5f56; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; cursor: pointer; opacity: 0; transition: 0.3s; border: 1.5px solid white; z-index: 10005; box-shadow: 0 2px 5px rgba(0,0,0,0.2); padding-bottom: 2px; }
    .shadow-mate-ghost:hover .shadow-mate-ghost-close { opacity: 1; }
    .shadow-mate-bubble { position: absolute; right: 75px; bottom: 10px; background: rgba(255, 255, 255, 0.95); padding: 12px 18px; border-radius: 20px 20px 0 20px; white-space: nowrap; box-shadow: 0 8px 25px rgba(0,0,0,0.1); opacity: 0; transform: translateY(20px) scale(0.8); transition: all 0.4s ease; pointer-events: none; color: #444; font-size: 14px; font-weight: 500; border: 1px solid rgba(0,0,0,0.05); }
    .shadow-mate-ghost.active .shadow-mate-bubble { opacity: 1; transform: translateY(0) scale(1); }
    .shadow-mate-card { position: fixed; right: 30px; bottom: 120px; width: 340px; max-height: 600px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); border-radius: 24px; padding: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); z-index: 10001; display: none; border: 1px solid rgba(255,255,255,0.5); color: #333; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow-y: auto; }
    .shadow-mate-card.show { display: block; animation: fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .shadow-mate-card-close { position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; background: rgba(0,0,0,0.05); color: #888; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; cursor: pointer; transition: 0.3s; z-index: 10010; pointer-events: auto !important; user-select: none; line-height: 1; padding-bottom: 4px; }
    .shadow-mate-card-close:hover { background: #ff5f56; color: white; transform: rotate(90deg); padding-bottom: 4px; }
    .shadow-mate-narrative { line-height: 1.6; color: #555; font-size: 15px; margin-bottom: 20px; font-style: italic; padding-left: 15px; border-left: 3px solid #f39c12; }
    .shadow-mate-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .shadow-mate-stat-box { background: rgba(0,0,0,0.03); padding: 10px; border-radius: 12px; font-size: 12px; }
    .shadow-mate-stat-label { color: #888; margin-bottom: 4px; display: block; }
    .shadow-mate-stat-value { font-weight: bold; color: #333; font-size: 14px; }
    .shadow-mate-timeline { margin-top: 20px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 15px; }
    .shadow-mate-timeline-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
    .shadow-mate-timeline-time { font-size: 11px; color: #999; width: 45px; flex-shrink: 0; }
    .shadow-mate-timeline-content { flex-grow: 1; padding-left: 10px; border-left: 2px solid #eee; position: relative; }
    .shadow-mate-timeline-content::after { content: ''; position: absolute; left: -5px; top: 5px; width: 8px; height: 8px; border-radius: 50%; background: #ddd; }
    .shadow-mate-timeline-item.active .shadow-mate-timeline-content { border-left-color: #f39c12; }
    .shadow-mate-timeline-item.active .shadow-mate-timeline-content::after { background: #f39c12; }
    .shadow-mate-timeline-tags { font-size: 10px; color: #777; margin-top: 2px; }
    .shadow-mate-keywords { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 15px; }
    .shadow-mate-keyword { background: rgba(243, 156, 18, 0.1); color: #d35400; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .shadow-mate-card::-webkit-scrollbar { width: 6px; }
    .shadow-mate-card::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 3px; }
    .shadow-mate-card::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
    .shadow-mate-card::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
  `
  document.head.appendChild(style)
}

function getWarmGreeting(summary: TodaySummary | null, messages: Record<string, unknown>, locale: Locale): string {
  if (!summary) return msg(messages, locale, 'content.goldenHour.noSummary')
  const content = messages.content as Record<string, unknown>
  const goldenHour = content?.goldenHour as { lines?: string[] } | undefined
  const pool = goldenHour?.lines ?? []
  if (pool.length === 0) return msg(messages, locale, 'content.goldenHour.noSummary')
  const raw = pool[Math.floor(Math.random() * pool.length)]
  return raw.replace(/\{chars\}/g, String(summary.totalChars))
}

type NarrativeTone = 'warm' | 'poetic' | 'cute'

function getDailyToneIndex(seed: string, length: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % length
}

function generateShadowNarrative(summary: TodaySummary, tone: NarrativeTone, messages: Record<string, unknown>, locale: Locale): string {
  const { mainCategory, topSiteTitle, totalDuration, totalChars, totalClicks, totalScroll, peakHour } = summary
  const hours = Math.round((totalDuration / 3600) * 10) / 10
  const scrollMeters = Math.round(totalScroll / 1000)
  const content = messages.content as Record<string, unknown>
  const categoryNames = (content?.categoryNames as Record<string, string>) ?? {}
  const categoryCute = (content?.categoryCute as Record<string, string>) ?? {}
  const cat = categoryNames[mainCategory] ?? (content?.categoryDefault as string) ?? ''
  const catCute = categoryCute[mainCategory] ?? (content?.categoryCuteDefault as string) ?? ''
  const placeholders = {
    category: cat,
    categoryCute: catCute,
    site: topSiteTitle,
    chars: totalChars,
    clicks: totalClicks,
    scroll: scrollMeters,
    peakHour,
    hours
  }
  if (tone === 'poetic') return msg(messages, locale, 'content.narrativePoetic', placeholders)
  if (tone === 'cute') return msg(messages, locale, 'content.narrativeCute', placeholders)
  return msg(messages, locale, 'content.narrativeWarm', placeholders)
}

async function createGhostUI(summary: TodaySummary | null, tone: NarrativeTone = 'warm') {
  if (!isContextValid()) return
  const locale = await getEffectiveLocale()
  const messages = getMessages(locale)
  const greeting = getWarmGreeting(summary, messages, locale)
  const ghost = document.createElement('div')
  ghost.className = 'shadow-mate-ghost'
  ghost.innerHTML = `<div class="shadow-mate-ghost-close">×</div><div class="shadow-mate-bubble">${greeting}</div><span class="shadow-mate-ghost-icon-wrap"><img src="${ghostGifUrl}" class="shadow-mate-ghost-icon" alt=""></span>`
  document.body.appendChild(ghost)
  const ghostClose = ghost.querySelector('.shadow-mate-ghost-close')
  ghostClose?.addEventListener('click', (e: Event) => {
    e.stopPropagation()
    const isHint = isCandleGhost(ghost)
    const today = new Date().toDateString()
    if (isHint) chrome.storage.local.set({ isHintClosedToday: today })
    else {
      localGhostClosed = true
      chrome.storage.local.set({ isGhostClosedToday: today })
    }
    ghost.remove()
    document.querySelector('.shadow-mate-card')?.remove()
    document.getElementById('shadow-mate-sunset-overlay')?.remove()
  })
  if (summary) {
    const narrative = generateShadowNarrative(summary, tone, messages, locale)
    const cardTitle = msg(messages, locale, 'content.cardTitle')
    const statActive = msg(messages, locale, 'content.statActiveTime')
    const statClicks = msg(messages, locale, 'content.statClicks')
    const statScroll = msg(messages, locale, 'content.statScroll')
    const statChars = msg(messages, locale, 'content.statChars')
    const minutes = msg(messages, locale, 'content.minutes')
    const times = msg(messages, locale, 'content.times')
    const meters = msg(messages, locale, 'content.meters')
    const timelineLabel = msg(messages, locale, 'content.timelineLabel')
    const periodMorning = msg(messages, locale, 'content.periodMorning')
    const periodAfternoon = msg(messages, locale, 'content.periodAfternoon')
    const periodEvening = msg(messages, locale, 'content.periodEvening')
    const timelineEmpty = msg(messages, locale, 'content.timelineEmpty')
    const keywordsLabel = msg(messages, locale, 'content.keywordsLabel')
    const cardFooter = msg(messages, locale, 'content.cardFooter')
    const periodNames: Record<string, string> = { morning: periodMorning, afternoon: periodAfternoon, evening: periodEvening }
    const card = document.createElement('div')
    card.className = 'shadow-mate-card'
    card.innerHTML = `
      <div class="shadow-mate-card-close">×</div>
      <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #f39c12;">${cardTitle}</h3>
      <div class="shadow-mate-narrative">"${narrative}"</div>
      <div class="shadow-mate-stats-grid">
        <div class="shadow-mate-stat-box"><span class="shadow-mate-stat-label">${statActive}</span><span class="shadow-mate-stat-value">${Math.round(summary.totalDuration / 60)}${minutes}</span></div>
        <div class="shadow-mate-stat-box"><span class="shadow-mate-stat-label">${statClicks}</span><span class="shadow-mate-stat-value">${summary.totalClicks}${times}</span></div>
        <div class="shadow-mate-stat-box"><span class="shadow-mate-stat-label">${statScroll}</span><span class="shadow-mate-stat-value">${Math.round(summary.totalScroll / 1000)}${meters}</span></div>
        <div class="shadow-mate-stat-box"><span class="shadow-mate-stat-label">${statChars}</span><span class="shadow-mate-stat-value">${summary.totalChars}</span></div>
      </div>
      <div class="shadow-mate-timeline">
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #666;">${timelineLabel}</div>
        ${['morning', 'afternoon', 'evening'].map((period) => {
          const tags = summary.timeline[period as keyof typeof summary.timeline]
          const periodName = periodNames[period]
          return `
            <div class="shadow-mate-timeline-item ${tags.length > 0 ? 'active' : ''}">
              <div class="shadow-mate-timeline-time">${periodName}</div>
              <div class="shadow-mate-timeline-content">
                <div class="shadow-mate-timeline-tags">${tags.length > 0 ? tags.join(' · ') : timelineEmpty}</div>
              </div>
            </div>
          `
        }).join('')}
      </div>
      <div style="font-size: 12px; font-weight: bold; margin-top: 20px; color: #666;">${keywordsLabel}</div>
      <div class="shadow-mate-keywords">
        ${summary.keywords.map((k) => `<span class="shadow-mate-keyword">${k}</span>`).join('')}
      </div>
      <div style="margin-top:25px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 15px;">
        ${cardFooter}
      </div>
    `
    document.body.appendChild(card)
    const closeBtn = card.querySelector('.shadow-mate-card-close')
    closeBtn?.addEventListener('click', (e: Event) => {
      e.stopPropagation()
      card.classList.remove('show')
    })
    ghost.onclick = () => card.classList.toggle('show')
  }
}
