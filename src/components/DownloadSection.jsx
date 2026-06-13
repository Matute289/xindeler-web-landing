import { motion } from 'framer-motion';
import { Download, Monitor, Terminal, Apple, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OS_DEFS = [
  {
    icon: Monitor,
    nameKey: 'download.windows',
    subKey: 'download.windowsSub',
    archs: [
      { arch: 'x86_64', href: 'https://downloads.xindeler.greenmountain.dev' },
      { arch: 'ARM64',  href: 'https://downloads.xindeler.greenmountain.dev' },
    ],
  },
  {
    icon: Terminal,
    nameKey: 'download.linux',
    subKey: 'download.linuxSub',
    archs: [
      { arch: 'x86_64', href: 'https://downloads.xindeler.greenmountain.dev' },
      { arch: 'ARM64',  href: 'https://downloads.xindeler.greenmountain.dev' },
    ],
  },
  {
    icon: Apple,
    nameKey: 'download.macos',
    subKey: 'download.macosSub',
    archs: [
      { arch: 'x86_64',    href: 'https://downloads.xindeler.greenmountain.dev' },
      { arch: 'ARM64 (M)', href: 'https://downloads.xindeler.greenmountain.dev' },
    ],
  },
];

export default function DownloadSection() {
  const { t } = useTranslation();

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

        {/* OS cards */}
        <motion.div
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
                {archs.map(({ arch, href }) => (
                  <a
                    key={arch}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-white/10 text-gray-400 text-xs font-cinzel tracking-wide transition-all duration-200 group hover:border-x-gold/60 hover:text-x-gold-2 hover:bg-x-gold/12"
                  >
                    <Download size={13} strokeWidth={1.8} className="opacity-70 group-hover:opacity-100" />
                    {arch}
                  </a>
                ))}
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
