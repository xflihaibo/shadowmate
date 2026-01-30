<template>
  <div class="app">
    <header class="header">
      <div class="header-row">
        <h1 class="daily-motto">{{ dailyMotto }}</h1>
        <label class="switch">
          <input type="checkbox" v-model="isEnabled" @change="onMasterSwitchChange" />
          <span class="slider round"></span>
        </label>
      </div>
      <div class="header-sub">
        <div class="milestone-inline">
          <span class="milestone-inline-days">{{ companionDays }} 天</span>
          <template v-if="currentMilestone">
            <span class="milestone-inline-badge" :title="currentMilestone.label">
              <span class="milestone-inline-icon" aria-hidden="true">
                <svg v-if="currentMilestone.icon === 'sparkle'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><path d="M5.64 5.64l2.83 2.83M15.53 15.53l2.83 2.83M5.64 18.36l2.83-2.83M15.53 8.47l2.83-2.83"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" opacity="0.9"/></svg>
                <svg v-else-if="currentMilestone.icon === 'flower'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="7" r="1.5"/><circle cx="16.5" cy="9.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/><circle cx="12" cy="17" r="1.5"/><circle cx="7.5" cy="14.5" r="1.5"/><circle cx="7.5" cy="9.5" r="1.5"/></svg>
                <svg v-else-if="currentMilestone.icon === 'leaf'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4-4-8-10-8-14a8 8 0 0116 0c0 4-4 10-8 14z"/><path d="M12 8v14"/></svg>
                <svg v-else-if="currentMilestone.icon === 'cup'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8z"/><path d="M6 10V6c0-1.1.9-2 2-2h2"/><path d="M18 10V6c0-1.1-.9-2-2-2h-2"/><path d="M4 12h16"/></svg>
                <svg v-else-if="currentMilestone.icon === 'heart'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                <svg v-else-if="currentMilestone.icon === 'star'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9 17 14 18 22 12 18 6 22 7 14 2 9 9 9 12 2"/></svg>
              </span>
              <span class="milestone-inline-label">{{ currentMilestone.label }}</span>
            </span>
          </template>
        </div>
        <p class="daily-quote clickable-title" @click="onSubtitleClick" title="点击找到伴影">{{ dailyQuote }}</p>
      </div>
    </header>

    <!-- 悬浮：找到伴影触发（默认隐藏，点击副标题有动画出现） -->
    <Transition name="ghost-appear">
      <button
        v-if="showFloatingFindMe"
        type="button"
        class="floating-find-me"
        @click="onFloatingFindMeClick"
        aria-label="找到伴影"
        title="找到伴影"
      >
        <template v-if="!useGhostEmojiFallback">
          <img class="floating-find-me-icon floating-find-me-icon-img" :src="floatingGhostUrl" alt="" @error="useGhostEmojiFallback = true" />
        </template>
        <span v-else class="floating-find-me-icon floating-find-me-icon-emoji">👻</span>
      </button>
    </Transition>

    <Transition name="ghost-float">
      <div v-if="showMorningGreeting" class="morning-greeting-float">
        <div class="morning-greeting-bubble">
          {{ morningGreetingText }}
        </div>
        <div class="morning-greeting-ghost">
          <button type="button" class="morning-greeting-close" aria-label="关闭" @click="dismissMorningGreeting">×</button>
          <template v-if="!useGhostEmojiFallback">
            <img class="morning-greeting-icon morning-greeting-icon-img" :src="floatingGhostUrl" alt="" @error="useGhostEmojiFallback = true" />
          </template>
          <span v-else class="morning-greeting-icon morning-greeting-icon-emoji">👻</span>
        </div>
      </div>
    </Transition>

    <div class="stats-container">
      <div class="stat-card" title="活跃时长">
        <span class="stat-icon">⏱️</span>
        <span class="stat-value">{{ todayDuration }}</span>
        <span class="stat-label">活跃时长</span>
      </div>
      <div class="stat-card" title="累计点击">
        <span class="stat-icon">🖱️</span>
        <span class="stat-value">{{ todayClicks }}</span>
        <span class="stat-label">累计点击</span>
      </div>
      <div class="stat-card" title="滚动距离">
        <span class="stat-icon">📏</span>
        <span class="stat-value">{{ todayScroll }}</span>
        <span class="stat-label">滚动距离</span>
      </div>
      <div class="stat-card" title="敲击字数">
        <span class="stat-icon">⌨️</span>
        <span class="stat-value">{{ todayChars }}</span>
        <span class="stat-label">敲击字数</span>
      </div>
    </div>

    <section class="clipboard-section">
      <div class="clipboard-title">
        <div class="clipboard-title-left">
          <span>复制历史</span>
          <span class="clipboard-title-info">({{ clipboardCount }}/10)</span>
          <button
            v-show="clipboardHistory.length > 0"
            class="clipboard-clear-all"
            @click="clearAllClipboard"
          >
            清空
          </button>
        </div>
        <label class="switch clipboard-switch">
          <input type="checkbox" v-model="clipboardEnabled" @change="onClipboardSwitchChange" />
          <span class="slider round"></span>
        </label>
      </div>
      <div class="clipboard-list">
        <div v-if="!clipboardEnabled" class="clipboard-empty">剪贴板功能已关闭</div>
        <div v-else-if="clipboardHistory.length === 0" class="clipboard-empty">暂无复制记录</div>
        <div
          v-else
          v-for="(item, index) in clipboardHistory"
          :key="index"
          class="clipboard-item"
        >
          <div class="clipboard-content" :title="item.text">{{ item.text }}</div>
          <div class="clipboard-actions">
            <button
              class="clipboard-copy"
              title="复制"
              @click="copyClipboardItem(item.text, $event)"
            >
              {{ copyBtnState === index ? '✓' : '⎘' }}
            </button>
            <button class="clipboard-delete" title="删除" @click="deleteClipboardItem(index)">
              ×
            </button>
          </div>
        </div>
      </div>
      <div v-if="clipboardEnabled && clipboardHistory.length > 0" class="clipboard-hint">
        💡 提示：在输入框中按 <kbd class="clipboard-hint-key">↑</kbd> 或
        <kbd class="clipboard-hint-key">↓</kbd> 键可切换复制历史
      </div>
    </section>

    <section class="history-section">
      <div class="section-title">
        <div class="section-title-left">
          <span>今日足迹 <small class="sites-count">({{ todaySitesCount }}个站点)</small></span>
        </div>
        <span class="section-badge">24h 滚动清理</span>
      </div>

      <div class="settings-block">
        <div class="settings-row">
          <span>🌅 你的“归航时刻”</span>
          <input
            type="time"
            v-model="sunsetTime"
            @change="onSunsetTimeChange"
            class="sunset-time-input"
          />
        </div>
        <p class="settings-hint">设置后，余晖模式将在该时间前 30 分钟开启</p>
      </div>

      <div class="history-list">
        <div v-if="loading" class="empty-state loading-state">
          <span class="empty-icon">⏳</span>
          加载中...
        </div>
        <div v-else-if="loadError" class="empty-state error-state">
          <span class="empty-icon">⚠️</span>
          {{ loadError }}
        </div>
        <div v-else-if="todayData.length === 0" class="empty-state">
          <span class="empty-icon">⏳</span>
          正在捕捉你的轨迹...
        </div>
        <div v-else-if="sortedHistory.length === 0" class="empty-state">
          今天还没留下足迹呢 👻
        </div>
        <div
          v-else
          v-for="item in sortedHistory"
          :key="item.url + item.visitTime"
          class="history-item"
          :title="`跳转至: ${item.url}`"
          @click="openTab(item.url)"
        >
          <img
            class="site-icon"
            :src="item.icon || defaultIcon"
            @error="($event.target as HTMLImageElement).src = defaultIcon"
          />
          <div class="site-info">
            <div class="site-title">{{ item.title || getDomain(item.url) }}</div>
            <div class="site-meta">
              <span class="site-time">{{ formatVisitTime(item.visitTime) }}</span>
              <span>🕒 {{ formatDuration(item.activeDuration || 0) }}</span>
              <span>🖱️ {{ item.clicks || 0 }}</span>
              <span>📏 {{ Math.round((item.scrollDistance || 0) / 1000) }}m</span>
              <span v-if="item.charsTyped">✍️ {{ item.charsTyped }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="debug-actions">
        <button class="btn-reset" @click="resetRitual">{{ resetBtnText }}</button>
      </div>
      数据仅保存在本地 · 伴影静默守护中
    </footer>

    <Transition name="companion-pop">
      <div v-if="showInteractionBubble" class="interaction-bubble-wrap">
        <div class="interaction-bubble">
          <span class="interaction-bubble-text">{{ interactionMessage }}</span>
          <button type="button" class="interaction-bubble-close" aria-label="关闭" @click="closeInteractionBubble">×</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getInteractionContent, getOverLimitMessage } from './interactionLibrary'

const MOTTOS = [
  'Shadow Mate · 始终守护', 'Shadow Mate · 温柔陪伴', 'Shadow Mate · 静默记录',
  'Shadow Mate · 数字归航', 'Shadow Mate · 时光见证', 'Shadow Mate · 温暖如初',
  'Shadow Mate · 默默守护', 'Shadow Mate · 记录美好', 'Shadow Mate · 陪伴每一天',
  'Shadow Mate · 温柔以待', 'Shadow Mate · 静候归航', 'Shadow Mate · 时光印记',
  'Shadow Mate · 温暖守护', 'Shadow Mate · 记录足迹', 'Shadow Mate · 温柔如影',
  'Shadow Mate · 静默陪伴', 'Shadow Mate · 数字记忆', 'Shadow Mate · 温暖如光',
  'Shadow Mate · 默默记录', 'Shadow Mate · 温柔守护', 'Shadow Mate · 时光见证者',
  'Shadow Mate · 温暖陪伴', 'Shadow Mate · 静候归来', 'Shadow Mate · 记录时光',
  'Shadow Mate · 温柔如你', 'Shadow Mate · 默默陪伴', 'Shadow Mate · 数字守护',
  'Shadow Mate · 温暖如影', 'Shadow Mate · 静默见证', 'Shadow Mate · 温柔记录'
]

const QUOTES = [
  '每一天的努力，都是未来的自己', '温柔对待自己，也温柔对待世界',
  '小小的坚持，会带来大大的改变', '今天的你，比昨天更好了',
  '累了就休息，但不要放弃', '每一个瞬间，都值得被记录',
  '慢慢来，比较快', '你值得被温柔对待', '生活很累，但也很美',
  '今天的你，辛苦了', '做自己的光，照亮前路', '时间会见证你的成长',
  '每一步都算数', '保持热爱，奔赴山海', '简单生活，温柔待人',
  '今天的努力，是明天的底气', '累了就停一停，但别忘记前行',
  '你比自己想象的更强大', '每一个今天，都是新的开始', '慢慢来，一切都会好的',
  '生活不易，但你很勇敢', '今天的你，值得被表扬', '保持初心，继续前行',
  '每一天都是新的机会', '温柔的力量，最强大', '你正在成为更好的自己',
  '累了就休息，但别停下', '今天的努力，不会白费', '保持微笑，继续前行',
  '你值得拥有美好的一切', '慢慢来，时间会给你答案', '今天的你，很棒',
  '保持热爱，保持前行', '每一个努力，都有意义', '生活很苦，但你很甜',
  '今天的你，比昨天更优秀', '保持初心，温柔前行', '每一天都是新的起点',
  '你正在闪闪发光', '今天的坚持，是明天的收获', '保持微笑，生活会更美好',
  '你值得被爱，也值得被珍惜', '慢慢来，一切都会如你所愿',
  '今天的你，辛苦了，但很值得', '保持热爱，生活会给你惊喜',
  '每一个瞬间，都是珍贵的', '你比自己想象的更优秀', '今天的努力，会开出花来',
  '保持初心，温柔对待自己'
]

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

interface ClipboardItem {
  text: string
  timestamp?: number
  url?: string
}

function getDailyIndex(seed: string, arrayLength: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % arrayLength
}

const dailyMotto = ref('Shadow Mate · 始终守护')
const dailyQuote = ref('伴影 · Shadow Mate')
const isEnabled = ref(true)
const clipboardEnabled = ref(true)
const sunsetTime = ref('18:00')
const todayData = ref<BrowsingRecord[]>([])
const clipboardHistory = ref<ClipboardItem[]>([])
const copyBtnState = ref<number | null>(null)
const resetBtnText = ref('重置今日提示状态')
const defaultIcon = chrome.runtime.getURL('icons/logo.png')
const floatingGhostUrl = chrome.runtime.getURL('icons/ghost.gif')
const ghostIconUrl = chrome.runtime.getURL('icons/ghost.png')
const useGhostEmojiFallback = ref(false)
const loading = ref(true)
const loadError = ref('')
const showMorningGreeting = ref(false)
const morningGreetingText = ref('早，今天也一起吧 ✨')
const showFloatingFindMe = ref(false)
const showInteractionBubble = ref(false)
const interactionMessage = ref('')
let interactionBubbleTimer: ReturnType<typeof setTimeout> | null = null

/** 根据文案长度决定气泡自动关闭时间（短句 8s，长句最多 14s，避免还没看完就消失） */
function getInteractionBubbleDuration(text: string): number {
  const len = text.length
  if (len <= 20) return 8000
  if (len <= 40) return 10000
  if (len <= 60) return 12000
  return 14000
}

function onSubtitleClick() {
  showFloatingFindMe.value = true
  onFindMeClick()
}

function onFloatingFindMeClick() {
  onFindMeClick()
}

const todayDuration = computed(() => formatSimpleDuration(
  todayData.value.reduce((s, r) => s + (r.activeDuration || 0), 0)
))
const todayClicks = computed(() =>
  todayData.value.reduce((s, r) => s + (r.clicks || 0), 0)
)
const todayScroll = computed(() =>
  Math.round(todayData.value.reduce((s, r) => s + (r.scrollDistance || 0), 0) / 1000) + 'm'
)
const todayChars = computed(() =>
  todayData.value.reduce((s, r) => s + (r.charsTyped || 0), 0)
)
const todaySitesCount = computed(() => {
  const set = new Set(todayData.value.map((r) => {
    try {
      return new URL(r.url).hostname
    } catch {
      return r.url
    }
  }))
  return set.size
})
const clipboardCount = computed(() => clipboardHistory.value.length)
const sortedHistory = computed(() =>
  [...todayData.value].sort((a, b) => b.visitTime - a.visitTime)
)

const companionDays = ref(0)
const currentMilestone = ref<{ label: string; icon: string } | null>(null)

const MILESTONE_LEVELS: { minDays: number; maxDays: number; label: string; icon: string }[] = [
  { minDays: 7, maxDays: 13, label: '初识', icon: 'sparkle' },
  { minDays: 14, maxDays: 29, label: '相知', icon: 'flower' },
  { minDays: 30, maxDays: 59, label: '相伴', icon: 'leaf' },
  { minDays: 60, maxDays: 99, label: '老友', icon: 'cup' },
  { minDays: 100, maxDays: 364, label: '挚友', icon: 'heart' },
  { minDays: 365, maxDays: 99999, label: '一年之约', icon: 'star' }
]

function getMilestoneForDays(days: number): { label: string; icon: string } | null {
  for (const m of MILESTONE_LEVELS) {
    if (days >= m.minDays && days <= m.maxDays) return { label: m.label, icon: m.icon }
  }
  return null
}

async function loadCompanionMilestone() {
  const res = await chrome.storage.local.get({ companionActiveDays: [] as string[] })
  const days = (res.companionActiveDays || []).length
  companionDays.value = days
  currentMilestone.value = getMilestoneForDays(days)
}

function formatSimpleDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h${remainingMins}m`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

function formatVisitTime(timestamp: number): string {
  const d = new Date(timestamp)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function getDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname
  } catch {
    return urlStr
  }
}

function openTab(url: string) {
  chrome.tabs.create({ url })
}

async function loadDashboard() {
  const result = await chrome.storage.local.get({ browsingData: [] as BrowsingRecord[] })
  const today = new Date().toDateString()
  todayData.value = (result.browsingData || []).filter(
    (r: BrowsingRecord) => new Date(r.visitTime).toDateString() === today
  )
}

async function loadSettings() {
  const settings = await chrome.storage.local.get({
    sunsetTime: '18:00',
    isEnabled: true,
    clipboardEnabled: true
  })
  sunsetTime.value = settings.sunsetTime
  isEnabled.value = settings.isEnabled
  clipboardEnabled.value = settings.clipboardEnabled !== false
}

async function loadClipboard() {
  const result = await chrome.storage.local.get({
    clipboardHistory: [] as ClipboardItem[],
    clipboardEnabled: true
  })
  if (result.clipboardEnabled === false) {
    clipboardHistory.value = []
    return
  }
  clipboardHistory.value = result.clipboardHistory || []
}

function updateDailyMotto() {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  dailyMotto.value = MOTTOS[getDailyIndex(dateStr, MOTTOS.length)]
}

function updateDailyQuote() {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-quote`
  dailyQuote.value = QUOTES[getDailyIndex(dateStr, QUOTES.length)]
}

const MORNING_GREETINGS = [
  '早，今天也一起吧 ✨',
  '早安，伴影在呢 ✨',
  '早上好，今天也一起 ✨',
  '早呀，新的一天开始了 ✨',
  '早，今天也要温柔对待自己 ✨',
  '早安，今天也一起走吧 ✨',
  '早上好，伴影陪你 ✨',
  '早呀，今天也一起吧 ✨',
]
const NOON_GREETINGS = [
  '午安，今天也一起吧 ✨',
  '午安，伴影在呢 ✨',
  '中午好，歇一歇再继续 ✨',
  '午安呀，今天也一起 ✨',
  '中午好，伴影陪你 ✨',
  '午安，下午也一起走吧 ✨',
  '午安呀，今天也要温柔对待自己 ✨',
  '中午好，今天也一起吧 ✨',
]
const EVENING_GREETINGS = [
  '傍晚好，今天也一起吧 ✨',
  '傍晚好，伴影在呢 ✨',
  '傍晚呀，离归航不远了 ✨',
  '傍晚好，今天也一起 ✨',
  '傍晚呀，伴影陪你 ✨',
  '傍晚好，今天辛苦了 ✨',
  '傍晚呀，今天也一起走吧 ✨',
  '傍晚好，温柔对待自己 ✨',
]
const NIGHT_GREETINGS = [
  '夜深了，今天也一起吧 ✨',
  '夜深了，伴影在呢 ✨',
  '还没休息呀，今天也一起 ✨',
  '夜深了，早点休息 ✨',
  '夜深呀，伴影陪你 ✨',
  '夜深了，今天辛苦了 ✨',
  '还没睡呀，今天也一起吧 ✨',
  '夜深了，温柔对待自己 ✨',
]

function getMorningGreetingByHour(): string {
  const now = new Date()
  const h = now.getHours()
  const dateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  let pool: string[]
  let seed: string
  if (h >= 5 && h < 12) {
    pool = MORNING_GREETINGS
    seed = `${dateStr}-morning`
  } else if (h >= 12 && h < 18) {
    pool = NOON_GREETINGS
    seed = `${dateStr}-noon`
  } else if (h >= 18 && h < 22) {
    pool = EVENING_GREETINGS
    seed = `${dateStr}-evening`
  } else {
    pool = NIGHT_GREETINGS
    seed = `${dateStr}-night`
  }
  return pool[getDailyIndex(seed, pool.length)]
}

async function checkAndShowMorningGreeting() {
  const today = new Date().toDateString()
  const res = await chrome.storage.local.get({ lastGreetingDate: '' })
  if (res.lastGreetingDate === today) return
  morningGreetingText.value = getMorningGreetingByHour()
  showMorningGreeting.value = true
  await chrome.storage.local.set({ lastGreetingDate: today })
  setTimeout(() => {
    showMorningGreeting.value = false
  }, 10000)
}

function dismissMorningGreeting() {
  showMorningGreeting.value = false
}

async function onFindMeClick() {
  const today = new Date().toDateString()
  const res = await chrome.storage.local.get({
    interactionCountToday: 0,
    lastInteractionDate: ''
  })
  let count = res.interactionCountToday ?? 0
  const lastDate = res.lastInteractionDate ?? ''
  if (lastDate !== today) {
    count = 0
    await chrome.storage.local.set({ lastInteractionDate: today, interactionCountToday: 0 })
  }
  if (count >= 10) {
    interactionMessage.value = getOverLimitMessage(today)
    showInteractionBubble.value = true
    if (interactionBubbleTimer) clearTimeout(interactionBubbleTimer)
    const duration = getInteractionBubbleDuration(interactionMessage.value)
    interactionBubbleTimer = setTimeout(closeInteractionBubble, duration)
    return
  }
  count += 1
  await chrome.storage.local.set({ interactionCountToday: count })
  const seed = `${today}-${count}`
  const { text } = getInteractionContent(seed)
  interactionMessage.value = text
  showInteractionBubble.value = true
  if (interactionBubbleTimer) clearTimeout(interactionBubbleTimer)
  const duration = getInteractionBubbleDuration(text)
  interactionBubbleTimer = setTimeout(closeInteractionBubble, duration)
}

function closeInteractionBubble() {
  showInteractionBubble.value = false
  if (interactionBubbleTimer) {
    clearTimeout(interactionBubbleTimer)
    interactionBubbleTimer = null
  }
}

async function onMasterSwitchChange() {
  await chrome.storage.local.set({ isEnabled: isEnabled.value })
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'STATE_CHANGED', isEnabled: isEnabled.value }).catch(() => {})
    }
  }
}

async function onClipboardSwitchChange() {
  await chrome.storage.local.set({ clipboardEnabled: clipboardEnabled.value })
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'CLIPBOARD_STATE_CHANGED', clipboardEnabled: clipboardEnabled.value }).catch(() => {})
    }
  }
}

async function onSunsetTimeChange() {
  await chrome.storage.local.set({ sunsetTime: sunsetTime.value })
}

async function copyClipboardItem(text: string, e: Event) {
  e.stopPropagation()
  const idx = clipboardHistory.value.findIndex((i) => i.text === text)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copyBtnState.value = idx
    setTimeout(() => { copyBtnState.value = null }, 1000)
  } catch {
    alert('复制失败，请重试')
  }
}

async function deleteClipboardItem(index: number) {
  const list = [...clipboardHistory.value]
  list.splice(index, 1)
  await chrome.storage.local.set({ clipboardHistory: list })
  clipboardHistory.value = list
}

async function clearAllClipboard() {
  if (!confirm('确定要清空所有复制记录吗？此操作不可恢复。')) return
  await chrome.storage.local.set({ clipboardHistory: [] })
  clipboardHistory.value = []
}

async function resetRitual() {
  await chrome.storage.local.remove('lastShownDate')
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_SUNSET' }).catch(() => {
      alert('重置成功！请刷新页面以看到效果。')
    })
  }
  resetBtnText.value = '✅ 已重置并尝试触发'
  setTimeout(() => { resetBtnText.value = '重置今日提示状态' }, 2000)
}

onMounted(() => {
  updateDailyMotto()
  updateDailyQuote()
  loading.value = true
  loadError.value = ''
  Promise.all([loadSettings(), loadDashboard(), loadClipboard(), loadCompanionMilestone()])
    .catch((e) => {
      loadError.value = e?.message || '加载失败，请重试'
    })
    .finally(() => {
      loading.value = false
    })

  checkAndShowMorningGreeting()

  chrome.storage.onChanged.addListener((changes: Record<string, unknown>, areaName: string) => {
    if (areaName !== 'local') return
    if (changes.browsingData) loadDashboard()
    if (changes.clipboardHistory || changes.clipboardEnabled) loadClipboard()
    if (changes.companionActiveDays) loadCompanionMilestone()
  })
})
</script>

<style scoped>
.app {
  width: 360px;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: #f8f9fa;
  color: #333;
}

.header {
  background: linear-gradient(135deg, #ff8c00 0%, #ff0080 100%);
  padding: 20px;
  color: white;
  text-align: left;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  min-width: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
}

.header-sub .daily-quote {
  margin: 0;
  font-size: 12px;
  opacity: 0.95;
  flex: 1;
  min-width: 0;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.daily-quote.clickable-title {
  cursor: pointer;
  transition: opacity 0.2s;
}
.daily-quote.clickable-title:hover {
  opacity: 1;
  text-decoration: underline;
}

/* 悬浮：找到伴影触发（默认隐藏，点击副标题后出现） */
.floating-find-me {
  position: fixed;
  left: 20px;
  top: 160px;
  z-index: 99;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #fff;
  border: 1px solid rgba(255, 140, 0, 0.3);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: opacity 0.2s, box-shadow 0.2s;
}
.floating-find-me:hover {
  opacity: 0.95;
  box-shadow: 0 6px 16px rgba(255, 140, 0, 0.25);
}
.floating-find-me-icon {
  position: relative;
}
.floating-find-me-icon-img {
  width: 28px;
  height: 28px;
  display: block;
  object-fit: contain;
}
.floating-find-me-icon-emoji {
  font-size: 22px;
  line-height: 1;
}

/* 找到伴影图标：出现/消失动画（无上下浮动） */
.ghost-appear-enter-active {
  transition:
    opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.ghost-appear-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.ghost-appear-enter-to {
  opacity: 1;
  transform: scale(1);
}
.ghost-appear-leave-active {
  transition: opacity 0.25s ease-in, transform 0.25s ease-in;
}
.ghost-appear-leave-from {
  opacity: 1;
  transform: scale(1);
}
.ghost-appear-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

/* 晨间问候：悬浮幽灵 + 气泡并排 */
.morning-greeting-float {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 100;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
}

.morning-greeting-bubble {
  max-width: 220px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 14px 4px 14px 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  border: 1px solid rgba(255, 140, 0, 0.15);
}

.morning-greeting-ghost {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgba(255, 140, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: ghost-float 2.5s ease-in-out infinite;
}

.morning-greeting-icon {
  display: block;
}
.morning-greeting-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.morning-greeting-icon-emoji {
  font-size: 22px;
  line-height: 1;
}

.morning-greeting-close {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border: none;
  background: #ff5f56;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, background 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.morning-greeting-close:hover {
  background: #e74c3c;
  transform: scale(1.1);
}

@keyframes ghost-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* 进入：丝滑入场，柔和缓动 */
.ghost-float-enter-active {
  transition:
    opacity 0.8s cubic-bezier(0.33, 1, 0.68, 1),
    transform 0.9s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.ghost-float-enter-from {
  opacity: 0;
  transform: scale(0.6) translateX(50px) rotate(-6deg);
}
.ghost-float-enter-to {
  opacity: 1;
  transform: scale(1) translateX(0) rotate(0deg);
}

/* 离开：丝滑离场，先轻弹再滑出 */
.ghost-float-leave-active {
  animation: ghost-leave 0.9s cubic-bezier(0.33, 1, 0.68, 1) forwards;
}
.ghost-float-leave-from {
  opacity: 1;
  transform: scale(1) translateX(0) rotate(0deg);
}
.ghost-float-leave-to {
  opacity: 0;
  transform: scale(0.3) translateX(120px) rotate(15deg);
}
@keyframes ghost-leave {
  0% {
    opacity: 1;
    transform: scale(1) translateX(0) rotate(0deg);
  }
  25% {
    opacity: 1;
    transform: scale(1.06) translateX(4px) rotate(2deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.3) translateX(120px) rotate(15deg);
  }
}

/* 找到伴影气泡：出现/消失动画 */
.companion-pop-enter-active {
  transition:
    opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.companion-pop-enter-from {
  opacity: 0;
  transform: scale(0.88) translateY(12px);
}
.companion-pop-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}
.companion-pop-leave-active {
  transition:
    opacity 0.25s ease-in,
    transform 0.25s ease-in;
}
.companion-pop-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
.companion-pop-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(8px);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.milestone-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}
.milestone-inline-days {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
}
.milestone-inline-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.95);
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  font-weight: 500;
}
.milestone-inline-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.milestone-inline-icon svg {
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.95);
}
.milestone-inline-label {
  font-size: 10px;
  line-height: 1.2;
}

.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  transition: 0.4s;
  border-radius: 20px;
}

.slider::before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.switch input:checked + .slider {
  background-color: #2ecc71;
}

.switch input:checked + .slider::before {
  transform: translateX(16px);
}

.clipboard-switch {
  width: 32px;
  height: 18px;
  flex-shrink: 0;
}

.clipboard-switch .slider {
  background-color: #ddd;
  border-radius: 18px;
}

.clipboard-switch .slider::before {
  height: 12px;
  width: 12px;
  left: 3px;
  bottom: 3px;
}

.clipboard-switch input:checked + .slider::before {
  transform: translateX(14px);
}

.stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 6px;
  padding: 12px;
  background: white;
  margin-bottom: 10px;
}

.stat-card {
  background: #fff9f0;
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(243, 156, 18, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stat-icon {
  font-size: 16px;
  line-height: 1;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #e67e22;
  line-height: 1.2;
}

.stat-label {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  display: none;
}

.clipboard-section {
  background: white;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.clipboard-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.clipboard-title::before {
  content: '📋';
  font-size: 14px;
}

.clipboard-title-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.clipboard-title-info {
  font-size: 11px;
  color: #999;
  font-weight: 400;
}

.clipboard-clear-all {
  background: none;
  border: none;
  color: #999;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clipboard-clear-all:hover {
  background: rgba(255, 95, 86, 0.1);
  color: #ff5f56;
}

.clipboard-hint {
  font-size: 10px;
  color: #666;
  margin-top: 8px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 6px;
  line-height: 1.5;
}

.clipboard-hint-key {
  display: inline-block;
  background: white;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #bbb;
  font-family: monospace;
  font-size: 10px;
  margin: 0 2px;
  color: #555;
}

.clipboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.clipboard-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.clipboard-item:hover {
  background: #f0f0f0;
  border-color: rgba(243, 156, 18, 0.2);
}

.clipboard-content {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: #555;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.clipboard-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.clipboard-copy,
.clipboard-delete {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  line-height: 1;
}

.clipboard-copy {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.clipboard-copy:hover {
  background: #2ecc71;
  color: white;
  transform: scale(1.1);
}

.clipboard-delete {
  background: rgba(255, 95, 86, 0.1);
  color: #ff5f56;
}

.clipboard-delete:hover {
  background: #ff5f56;
  color: white;
  transform: scale(1.1);
}

.clipboard-empty {
  text-align: center;
  padding: 20px;
  color: #ccc;
  font-size: 12px;
}

.history-section {
  background: white;
  padding: 15px 20px;
  max-height: 380px;
  overflow-y: auto;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 15px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title::before {
  content: '🐾';
  margin-right: 8px;
  font-size: 14px;
}

.section-title-left {
  display: flex;
  align-items: center;
}

.sites-count {
  font-size: 10px;
  color: #aaa;
  margin-left: 5px;
  font-weight: 400;
}

.section-badge {
  font-size: 10px;
  font-weight: 400;
  color: #bbb;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.settings-block {
  margin-bottom: 15px;
  padding: 10px;
  background: #fff9f0;
  border-radius: 10px;
  border: 1px dashed rgba(243, 156, 18, 0.27);
}

.settings-row {
  font-size: 11px;
  color: #e67e22;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sunset-time-input {
  border: none;
  background: white;
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 11px;
  color: #f39c12;
  cursor: pointer;
}

.settings-hint {
  margin: 0;
  font-size: 9px;
  color: #aaa;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  cursor: pointer;
}

.history-item:hover {
  background: rgba(243, 156, 18, 0.02);
  padding-left: 5px;
  padding-right: 5px;
  margin-left: -5px;
  margin-right: -5px;
  border-radius: 8px;
}

.history-item:last-child {
  border-bottom: none;
}

.site-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f0f0f0;
  flex-shrink: 0;
}

.site-info {
  flex-grow: 1;
  overflow: hidden;
}

.site-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.site-meta {
  font-size: 11px;
  color: #888;
  display: flex;
  gap: 8px;
}

.site-time {
  color: #f39c12;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #ccc;
}

.empty-state.loading-state {
  color: #999;
}

.empty-state.error-state {
  color: #c0392b;
  font-size: 12px;
}

.empty-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 10px;
}

.footer {
  padding: 12px;
  text-align: center;
  font-size: 10px;
  color: #bbb;
  background: #f8f9fa;
}

.debug-actions {
  margin-bottom: 8px;
}

.btn-reset {
  background: none;
  border: 1px solid #ddd;
  color: #999;
  font-size: 9px;
  padding: 2px 5px;
  cursor: pointer;
  border-radius: 4px;
}

/* 互动气泡：与找到伴影图标并排显示（图标右侧） */
.interaction-bubble-wrap {
  position: fixed;
  left: 72px; /* 20px + 44px 图标宽 + 8px 间距 */
  top: 150px;
  z-index: 100;
  max-width: 240px;
  pointer-events: auto;
}

.interaction-bubble {
  position: relative;
  padding: 14px 36px 14px 16px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 14px 4px 14px 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 140, 0, 0.2);
}

.interaction-bubble-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  display: block;
}

.interaction-bubble-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: #888;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}

.interaction-bubble-close:hover {
  background: #ff5f56;
  color: white;
}

/* Custom Scrollbar */
:deep(::-webkit-scrollbar) {
  width: 6px;
}

:deep(::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(::-webkit-scrollbar-thumb) {
  background: #eee;
  border-radius: 3px;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: #ddd;
}
</style>
