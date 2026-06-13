import { motion } from 'framer-motion';
import { Compass, Sword, Hammer, Sparkles, Globe, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FEATURE_DEFS = [
  { key: 'exploration', icon: Compass,   gradient: 'from-blue-900/35 to-blue-950/10',   iconBg: 'bg-blue-900/40',   iconColor: 'text-blue-400',   hoverBorder: 'hover:border-blue-500/40'   },
  { key: 'combat',      icon: Sword,     gradient: 'from-red-900/35 to-red-950/10',     iconBg: 'bg-red-900/40',    iconColor: 'text-red-400',    hoverBorder: 'hover:border-red-500/40'    },
  { key: 'crafting',    icon: Hammer,    gradient: 'from-amber-900/35 to-amber-950/10', iconBg: 'bg-amber-900/40',  iconColor: 'text-amber-400',  hoverBorder: 'hover:border-amber-500/40'  },
  { key: 'magic',       icon: Sparkles,  gradient: 'from-purple-900/35 to-purple-950/10',iconBg: 'bg-purple-900/40',iconColor: 'text-purple-400', hoverBorder: 'hover:border-purple-500/40' },
  { key: 'livingWorld', icon: Globe,     gradient: 'from-green-900/35 to-green-950/10', iconBg: 'bg-green-900/40',  iconColor: 'text-green-400',  hoverBorder: 'hover:border-green-500/40'  },
  { key: 'aiNpcs',      icon: Bot,       gradient: 'from-cyan-900/35 to-cyan-950/10',   iconBg: 'bg-cyan-900/40',   iconColor: 'text-cyan-400',   hoverBorder: 'hover:border-cyan-500/40'   },
];

export default function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-28 bg-x-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(124,58,237,0.12)_0%,_transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-eyebrow">{t('features.eyebrow')}</p>
          <h2 className="section-title">{t('features.title')}</h2>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-5 max-w-xl mx-auto text-sm leading-relaxed">
            {t('features.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURE_DEFS.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`group relative p-7 rounded-2xl bg-gradient-to-br ${f.gradient} border border-white/5 ${f.hoverBorder} hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-default`}
            >
              <div className={`mb-5 inline-flex p-3 rounded-xl ${f.iconBg} ${f.iconColor}`}>
                <f.icon size={26} strokeWidth={1.8} />
              </div>
              <h3 className={`font-cinzel text-lg text-white mb-3 group-hover:${f.iconColor} transition-colors`}>
                {t(`features.${f.key}.title`)}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t(`features.${f.key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
