import { motion } from 'framer-motion';
import { Globe, TrendingUp, Users, Brain, Zap, Sparkles, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VISION_DEFS = [
  { key: 'persistentWorld',   icon: Globe       },
  { key: 'dynamicEconomy',    icon: TrendingUp  },
  { key: 'playerCommunities', icon: Users       },
  { key: 'aiStorytelling',    icon: Brain       },
  { key: 'emergentGameplay',  icon: Zap         },
  { key: 'magicSystem',       icon: Sparkles    },
  { key: 'factionWarfare',    icon: Shield      },
];

export default function MMORPGVision() {
  const { t } = useTranslation();

  return (
    <section id="vision" className="py-28 bg-x-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,_rgba(212,160,23,0.05)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px opacity-30"
           style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }} />

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-cinzel text-x-gold text-xs tracking-[0.35em] uppercase mb-4">
              {t('vision.eyebrow')}
            </p>
            <h2 className="font-cinzel text-4xl md:text-5xl text-white mb-6 leading-tight">
              {t('vision.title')}<br />
              <span className="shimmer-text">{t('vision.titleHighlight')}</span>
            </h2>
            <div className="w-16 h-px bg-x-gold mb-6" />
            <p className="text-gray-400 leading-relaxed mb-6">{t('vision.desc1')}</p>
            <p className="text-gray-400 leading-relaxed">{t('vision.desc2')}</p>
          </motion.div>

          <div className="space-y-3">
            {VISION_DEFS.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:border-x-gold/25 bg-white/2 hover:bg-white/4 transition-all duration-300"
              >
                <div className="flex-shrink-0 p-2.5 rounded-lg bg-x-gold/10 group-hover:bg-x-gold/20 transition-colors">
                  <item.icon size={18} className="text-x-gold" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-cinzel text-sm text-white mb-1 group-hover:text-x-gold-2 transition-colors">
                    {t(`vision.${item.key}.title`)}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {t(`vision.${item.key}.desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
