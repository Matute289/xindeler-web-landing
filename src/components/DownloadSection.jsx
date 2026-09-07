import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Monitor, Terminal, Apple, Info, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WEB_API = '/api';

const OS_DEFS = [
  {
    icon: Monitor,
    nameKey: 'download.windows',
    subKey: 'download.windowsSub',
    // No ARM64 build offered: a dependency's own support statement flags
    // Windows ARM64 as too easy to break right now (per Mati, 2026-09-07) --
    // not a temporary gap, an intentional exclusion.
    archs: [
      { arch: 'x86_64', os: 'windows' },
    ],
  },
  {
    icon: Terminal,
    nameKey: 'download.linux',
    subKey: 'download.linuxSub',
    archs: [
      { arch: 'x86_64', os: 'linux' },
      { arch: 'ARM64',  os: 'linux' },
    ],
  },
  {
    icon: Apple,
    nameKey: 'download.macos',
    subKey: 'download.macosSub',
    archs: [
      { arch: 'x86_64',    os: 'macos' },
      { arch: 'ARM64 (M)', os: 'macos' },
    ],
  },
];

// The manifest's arch values are lowercase ("x86_64"/"arm64"); the button
// labels above keep the display forms ("ARM64", "ARM64 (M)") for readability.
function toManifestArch(label) {
  return label.toLowerCase().startsWith('arm64') ? 'arm64' : 'x86_64';
}

function navigateTo(url) {
  window.location.href = url;
}

async function resolveDownload(params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  try {
    const res = await fetch(`${WEB_API}/download${query}`);
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export default function DownloadSection() {
  const { t } = useTranslation();
  const [autoState, setAutoState] = useState('idle'); // idle | loading | failed
  const [manualFailed, setManualFailed] = useState(null); // null | `${os}-${arch}`
  const [manualPending, setManualPending] = useState(() => new Set()); // Set of `${os}-${arch}` keys, one per in-flight request
  const manualListRef = useRef(null);

  const handleAutoDownload = async () => {
    setAutoState('loading');
    setManualFailed(null);
    const result = await resolveDownload();
    if (result.ok) {
      navigateTo(result.download_url);
      setAutoState('idle');
      return;
    }
    setAutoState('failed');
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    manualListRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    manualListRef.current?.focus();
  };

  const handleManualDownload = async (os, arch) => {
    const key = `${os}-${arch}`;
    setManualFailed(null);
    setManualPending((prev) => new Set(prev).add(key));
    if (autoState === 'failed') setAutoState('idle');
    try {
      const result = await resolveDownload({ os, arch });
      if (result.ok) {
        navigateTo(result.download_url);
        return;
      }
      setManualFailed(key);
    } finally {
      setManualPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <section
      id="download"
      className="relative py-32 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #06060f 0%, #0d0420 50%, #06060f 100%)' }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,160,23,0.4) 50%, transparent 100%)' }} />

      <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Download size={40} className="text-x-gold mx-auto mb-6 opacity-80" strokeWidth={1.5} />
          <p className="section-eyebrow">{t('download.eyebrow')}</p>
          <h2
            className="font-cinzel text-4xl md:text-6xl text-white mb-6 leading-tight"
            style={{ textShadow: '0 0 40px rgba(212,160,23,0.25)' }}
          >
            {t('download.title')}
          </h2>
          <div className="gold-divider mb-8" />
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-12 leading-relaxed">
            {t('download.description')}
          </p>
        </motion.div>

        <motion.button
          type="button"
          onClick={handleAutoDownload}
          disabled={autoState === 'loading'}
          className="inline-flex items-center gap-2 px-8 py-3.5 mb-3 font-cinzel text-sm tracking-wider text-black bg-x-gold rounded-full hover:bg-x-gold/90 disabled:opacity-60 transition-colors"
          style={{ boxShadow: '0 2px 16px rgba(212,160,23,0.4)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {autoState === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {t('download.autoDetectBtn')}
        </motion.button>

        <p role="status" className={`text-xs text-x-gold-2 ${autoState === 'failed' ? 'mb-6' : ''}`}>
          {autoState === 'failed' ? t('download.autoDetectFailed') : ''}
        </p>

        <p className="text-gray-500 text-xs font-cinzel tracking-widest uppercase mb-4 mt-6">
          {t('download.manualSectionLabel')}
        </p>

        {/* OS cards */}
        <motion.div
          ref={manualListRef}
          tabIndex={-1}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {OS_DEFS.map(({ icon: Icon, nameKey, subKey, archs }) => (
            <div
              key={nameKey}
              className="group/card flex flex-col p-5 rounded-2xl border border-white/10 bg-white/3 hover:border-x-gold/35 hover:bg-x-gold/5 transition-all duration-300"
            >
              {/* OS header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-white/8 group-hover/card:bg-x-gold/15 transition-colors duration-300">
                  <Icon size={20} strokeWidth={1.6} className="text-gray-300 group-hover/card:text-x-gold transition-colors duration-300" />
                </div>
                <div className="text-left">
                  <p className="font-cinzel text-sm text-white group-hover/card:text-x-gold-2 transition-colors duration-300">
                    {t(nameKey)}
                  </p>
                  <p className="text-gray-500 text-xs">{t(subKey)}</p>
                </div>
              </div>

              {/* Arch buttons */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                {archs.map(({ arch, os }) => {
                  const manifestArch = toManifestArch(arch);
                  const key = `${os}-${manifestArch}`;
                  const isPending = manualPending.has(key);
                  // A lone button (Windows, no ARM64) spans both grid tracks
                  // and centers itself at half that width instead of
                  // sticking to the first column's left edge.
                  const isOnly = archs.length === 1;
                  return (
                    <div key={arch} className={`flex flex-col items-center ${isOnly ? 'col-span-2' : ''}`}>
                      <button
                        type="button"
                        onClick={() => handleManualDownload(os, manifestArch)}
                        disabled={isPending}
                        className={`flex flex-col items-center gap-1 py-3 px-2 ${isOnly ? 'w-1/2' : 'w-full'} rounded-xl border border-white/10 text-gray-400 text-xs font-cinzel tracking-wide transition-all duration-200 group hover:border-x-gold/60 hover:text-x-gold-2 hover:bg-x-gold/12 disabled:opacity-60`}
                      >
                        {isPending ? (
                          <Loader2 size={13} strokeWidth={1.8} className="animate-spin opacity-70" />
                        ) : (
                          <Download size={13} strokeWidth={1.8} className="opacity-70 group-hover:opacity-100" />
                        )}
                        {arch}
                      </button>
                      <p role="status" className={`text-[10px] text-x-gold-2 ${manualFailed === key ? 'mt-1' : ''}`}>
                        {manualFailed === key ? t('download.manualRetry') : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="flex items-center justify-center gap-2 text-gray-600 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Info size={14} />
          <span>{t('download.launcherNote')}</span>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap gap-4 justify-center text-xs text-gray-600 font-cinzel tracking-widest uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <span>{t('download.openSource')}</span>
          <span className="text-gray-700">•</span>
          <span>{t('download.gpl')}</span>
          <span className="text-gray-700">•</span>
          <span>{t('download.communityDriven')}</span>
          <span className="text-gray-700">•</span>
          <span>{t('download.free')}</span>
        </motion.div>
      </div>
    </section>
  );
}
