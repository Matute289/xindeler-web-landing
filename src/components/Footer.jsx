import { BookOpen, FileText, Download, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GitHubIcon from './GitHubIcon';

const LINKS_COMMUNITY = [
  { key: 'github',  href: 'https://github.com/Matute289/xindeler',          icon: GitHubIcon    },
  { key: 'discord', href: '#',                                               icon: MessageCircle },
  { key: 'wiki',    href: 'https://wiki.xindeler.greenmountain.dev',         icon: BookOpen      },
];

const LINKS_RESOURCES = [
  { key: 'docs',      href: 'https://docs.xindeler.greenmountain.dev',            icon: FileText },
  { key: 'downloads', href: 'https://downloads.xindeler.greenmountain.dev',       icon: Download },
  { key: 'license',   href: 'https://github.com/Matute289/xindeler/blob/main/LICENSE', icon: FileText, labelOverride: 'License (GPL)' },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-x-dark border-t border-white/5">
      <div className="container mx-auto px-4 max-w-6xl py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <h2 className="font-cinzel-dec text-2xl text-white mb-3"
                style={{ textShadow: '0 0 20px rgba(212,160,23,0.3)' }}>
              XINDELER
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              {t('footer.desc')}
            </p>
            <div className="flex gap-3">
              {LINKS_COMMUNITY.slice(0, 2).map(({ href, icon: Icon, key }) => (
                <a
                  key={key}
                  href={href}
                  target={href !== '#' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  aria-label={t(`community.${key}.title`)}
                  className="p-2 rounded-lg border border-white/8 text-gray-500 hover:text-white hover:border-white/20 transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-cinzel text-sm text-white tracking-widest uppercase mb-5">{t('footer.community')}</h3>
            <ul className="space-y-3">
              {LINKS_COMMUNITY.map(({ key, href, icon: Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target={href !== '#' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-500 hover:text-x-gold text-sm transition-colors duration-200 group"
                  >
                    <Icon size={14} className="group-hover:text-x-gold transition-colors" />
                    {t(`community.${key}.title`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-cinzel text-sm text-white tracking-widest uppercase mb-5">{t('footer.resources')}</h3>
            <ul className="space-y-3">
              {LINKS_RESOURCES.map(({ key, href, icon: Icon, labelOverride }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-500 hover:text-x-gold text-sm transition-colors duration-200 group"
                  >
                    <Icon size={14} className="group-hover:text-x-gold transition-colors" />
                    {labelOverride ?? t(`community.${key}.title`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs font-cinzel tracking-wide text-center">
            {t('footer.copyright')}
          </p>
          <p className="text-gray-700 text-xs text-center">
            {t('footer.forkedFrom')}{' '}
            <a
              href="https://veloren.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              Veloren
            </a>
            {' '}{t('footer.license')}
          </p>
        </div>
      </div>
    </footer>
  );
}
