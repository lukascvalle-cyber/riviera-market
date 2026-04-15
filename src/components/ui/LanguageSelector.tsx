import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
]

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const resolved = i18n.resolvedLanguage ?? i18n.language

  function isActive(code: string) {
    return resolved === code || resolved.startsWith(code + '-')
  }

  return (
    <div className="flex items-center gap-0.5">
      {LANGS.map((lang, idx) => (
        <span key={lang.code} className="flex items-center">
          <button
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`text-xs font-semibold font-body px-1 py-0.5 rounded transition-colors ${
              isActive(lang.code)
                ? 'text-coral'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {lang.label}
          </button>
          {idx < LANGS.length - 1 && (
            <span className="text-gray-200 text-xs select-none">|</span>
          )}
        </span>
      ))}
    </div>
  )
}
