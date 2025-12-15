import no from './no.json'

type LocaleMap = Record<string, Record<string, string>>

const locales: LocaleMap = {
  no,
}

let locale = 'no'

export function setLocale(l: string) {
  if (!locales[l]) throw new Error(`Locale ${l} not found`)
  locale = l
}

export function t(key: string, fallback?: string) {
  return locales[locale]?.[key] ?? fallback ?? key
}

export default { t, setLocale }
