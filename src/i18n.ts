/**
 * 伴影 i18n：语言解析与文案替换
 * 当前语言 = storage.languageOverride ?? 浏览器语言，仅扩展内 UI 使用。
 */

export type Locale = 'zh' | 'en'

const STORAGE_KEY = 'languageOverride'

function parseBrowserLocale(): Locale {
  const lang = (typeof navigator !== 'undefined' && navigator.language) || ''
  const code = lang.slice(0, 2).toLowerCase()
  return code === 'zh' ? 'zh' : 'en'
}

/**
 * 获取当前有效语言：先读用户覆盖，无则按浏览器语言，无效值视为未设置。
 */
export async function getEffectiveLocale(): Promise<Locale> {
  try {
    const raw = await new Promise<unknown>((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local?.get) {
        chrome.storage.local.get(STORAGE_KEY, (r) => resolve(r[STORAGE_KEY]))
      } else {
        resolve(undefined)
      }
    })
    if (raw === 'zh' || raw === 'en') return raw
  } catch {}
  const locale = parseBrowserLocale()
  return locale
}

/**
 * 同步获取当前语言（仅当已从 storage 读过后可用）；否则用浏览器语言。
 * 用于 popup 首屏或 content 在无 async 时的占位。
 */
export function getLocaleSync(): Locale {
  return parseBrowserLocale()
}

/**
 * 写入用户语言覆盖。传 null 或 '' 表示跟随系统。
 */
export function setLanguageOverride(locale: Locale | null): void {
  if (typeof chrome === 'undefined' || !chrome.storage?.local?.set) return
  if (locale === null || locale === '') {
    chrome.storage.local.remove(STORAGE_KEY)
  } else {
    chrome.storage.local.set({ [STORAGE_KEY]: locale })
  }
}

/** 从嵌套对象按 key 路径取值，如 "popup.stats.activeTime" */
export function getNested(obj: unknown, key: string): unknown {
  if (obj == null) return undefined
  const parts = key.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

/**
 * 占位符替换：把 "今日你 {category}，在 {site} 停泊" 中的 {category}、{site} 替换。
 */
export function replacePlaceholders(
  template: string,
  placeholders: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const v = placeholders[name]
    return v !== undefined ? String(v) : `{${name}}`
  })
}

/**
 * 取翻译文案：从 messages 中按 key 取，若缺失则从 fallbackMessages 取，再缺失则返回 key 或占位提示。
 */
export function t(
  messages: Record<string, unknown>,
  key: string,
  options?: {
    placeholders?: Record<string, string | number>
    fallbackMessages?: Record<string, unknown>
  }
): string {
  let raw: unknown = getNested(messages, key)
  if (raw === undefined && options?.fallbackMessages) {
    raw = getNested(options.fallbackMessages, key)
  }
  const str = typeof raw === 'string' ? raw : undefined
  const out = str ?? `[missing: ${key}]`
  if (options?.placeholders && Object.keys(options.placeholders).length > 0) {
    return replacePlaceholders(out, options.placeholders)
  }
  return out
}
