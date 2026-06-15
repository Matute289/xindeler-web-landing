import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇺🇸' },
  { code: 'es', label: 'Español',  flag: '🇦🇷' },
  // Add more languages here in the future
];

export default function LanguageSwitcher({ align = 'right' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];

  const select = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 hover:border-white/25 text-gray-400 hover:text-white transition-all duration-200"
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="font-cinzel text-xs tracking-wider">{currentLang.code.toUpperCase()}</span>
        <span className={`text-[10px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2 z-50 min-w-[140px] rounded-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60`}
             style={{ background: 'rgba(13,13,30,0.97)', backdropFilter: 'blur(16px)' }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/5 ${
                lang.code === i18n.resolvedLanguage
                  ? 'text-x-gold font-cinzel'
                  : 'text-gray-300 font-inter'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === i18n.resolvedLanguage && (
                <span className="ml-auto" style={{ fontSize: '0.7rem' }}>🧉</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
