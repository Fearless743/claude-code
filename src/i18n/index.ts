import { getInitialSettings } from '../utils/settings/settings.js'
import { en } from './locales/en.js'
import { zhCN } from './locales/zh-CN.js'

export type AppLocale = 'en' | 'zh-CN'

type Messages = typeof en
type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`
type DotNestedKeys<T> = (
  T extends object
    ? {
        [K in Extract<keyof T, string>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}`
      }[Extract<keyof T, string>]
    : ''
) extends infer D
  ? Extract<D, string>
  : never

export type TranslationKey = DotNestedKeys<Messages>

const ZH_ALIASES = new Set([
  'zh',
  'zh-cn',
  'zh-hans',
  'chinese',
  'simplified chinese',
  'mandarin',
  '中文',
  '简体中文',
  '汉语',
  '普通话',
])

const TRANSLATIONS: Record<AppLocale, Messages> = {
  en,
  'zh-CN': zhCN,
}

export function normalizeAppLocale(language: string | undefined): AppLocale {
  const normalized = language?.trim().toLowerCase()
  if (!normalized) return 'en'
  if (ZH_ALIASES.has(normalized)) return 'zh-CN'
  if (normalized.startsWith('zh-')) return 'zh-CN'
  return 'en'
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => `${values[key] ?? ''}`)
}

function getMessage(messages: Messages, key: TranslationKey): string {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment]
    }
    return undefined
  }, messages) as string
}

function resolveLanguagePreference(language: string | undefined): string | undefined {
  return language ?? getInitialSettings().language ?? process.env.CLAUDE_CODE_LANGUAGE
}

export function translate(
  language: string | undefined,
  key: TranslationKey,
  values: Record<string, string | number> = {},
): string {
  const locale = normalizeAppLocale(resolveLanguagePreference(language))
  const template = getMessage(TRANSLATIONS[locale], key) ?? getMessage(en, key)
  return interpolate(template, values)
}
