import { motion } from 'framer-motion';
import { MessageCircle, BookOpen, FileText, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GitHubIcon from './GitHubIcon';

const LINK_DEFS = [
  {
    key: 'github',
    icon: GitHubIcon,
    href: 'https://github.com/Matute289/xindeler',
    color: 'text-white',
    bg: 'from-gray-800/50 to-gray-900/30',
    border: 'border-gray-600/30',
    hoverBorder: 'hover:border-white/30',
  },
  {
    key: 'discord',
    icon: MessageCircle,
    href: 'https://discord.gg/Jpg9scQE',
    color: 'text-indigo-400',
    bg: 'from-indigo-900/40 to-indigo-950/20',
    border: 'border-indigo-700/30',
    hoverBorder: 'hover:border-indigo-500/50',
  },
  {
    key: 'wiki',
    icon: BookOpen,
    href: 'https://wiki.xindeler.com',
    color: 'text-emerald-400',
    bg: 'from-emerald-900/40 to-emerald-950/20',
    border: 'border-emerald-700/30',
    hoverBorder: 'hover:border-emerald-500/50',
  },
  {
    key: 'docs',
    icon: FileText,
    href: 'https://docs.xindeler.com',
    color: 'text-blue-400',
    bg: 'from-blue-900/40 to-blue-950/20',
    border: 'border-blue-700/30',
    hoverBorder: 'hover:border-blue-500/50',
  },
  {
    key: 'downloads',
    icon: Download,
    href: '#download',
    color: 'text-x-gold',
    bg: 'from-amber-900/40 to-amber-950/20',
    border: 'border-amber-700/30',
    hoverBorder: 'hover:border-x-gold/50',
  },
];

export default function CommunitySection() {
  const { t } = useTranslation();

  return (
    <section id="community" className="py-28 bg-x-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,_rgba(212,160,23,0.06)_0%,_transparent_65%)] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-eyebrow">{t('community.eyebrow')}</p>
          <h2 className="section-title">{t('community.title')}</h2>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-5 text-sm max-w-md mx-auto">
            {t('community.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LINK_DEFS.map((link, i) => (
            <motion.a
              key={link.key}
              href={link.href}
              target={link.href.startsWith('#') ? undefined : '_blank'}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className={`group flex flex-col p-7 rounded-2xl bg-gradient-to-br ${link.bg} border ${link.border} ${link.hoverBorder} hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`p-3 rounded-xl bg-black/30 ${link.color}`}>
                  <link.icon size={24} strokeWidth={1.8} />
                </div>
                {link.hasBadge && (
                  <span className="text-xs px-2 py-0.5 rounded border border-gray-700/50 text-gray-500 bg-gray-800/40 font-cinzel">
                    {t(`community.${link.key}.badge`)}
                  </span>
                )}
              </div>

              <h3 className={`font-cinzel text-lg text-white mb-2 group-hover:${link.color} transition-colors`}>
                {t(`community.${link.key}.title`)}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">
                {t(`community.${link.key}.desc`)}
              </p>

              <div className={`flex items-center gap-1.5 font-cinzel text-xs tracking-wider ${link.color} group-hover:gap-3 transition-all duration-300`}>
                <span>{t(`community.${link.key}.btn`)}</span>
                <span>→</span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
