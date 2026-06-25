import { motion } from 'framer-motion';
import { Check, Zap, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PHASES = [
  { number: 1, status: 'completed'   },
  { number: 2, status: 'in-progress' },
  { number: 3, status: 'upcoming'    },
  { number: 4, status: 'in-progress' },
  { number: 5, status: 'upcoming'    },
  { number: 6, status: 'upcoming'    },
  { number: 7, status: 'upcoming'    },
  { number: 8, status: 'upcoming'    },
  { number: 9, status: 'upcoming'    },
];

const STATUS_CONFIG = {
  completed: {
    labelKey: 'roadmap.completed',
    icon: Check,
    dotClass: 'bg-emerald-500 border-emerald-400',
    dotGlow: '0 0 12px rgba(52,211,153,0.8)',
    cardBorder: 'border-emerald-700/25',
    cardBg: 'bg-emerald-950/10',
    badge: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
    titleColor: 'text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  'in-progress': {
    labelKey: 'roadmap.inProgress',
    icon: Zap,
    dotClass: 'bg-x-gold border-x-gold-2 timeline-active',
    dotGlow: '0 0 12px rgba(212,160,23,0.9)',
    cardBorder: 'border-x-gold/30',
    cardBg: 'bg-amber-950/15',
    badge: 'bg-amber-900/40 text-x-gold border-x-gold/40',
    titleColor: 'text-x-gold-2',
    dotColor: 'bg-x-gold',
  },
  upcoming: {
    labelKey: 'roadmap.upcoming',
    icon: Clock,
    dotClass: 'bg-gray-700 border-gray-600',
    dotGlow: 'none',
    cardBorder: 'border-white/8',
    cardBg: 'bg-white/2',
    badge: 'bg-gray-800/60 text-gray-500 border-gray-700/40',
    titleColor: 'text-white',
    dotColor: 'bg-gray-600',
  },
};

export default function Roadmap() {
  const { t } = useTranslation();

  return (
    <section id="roadmap" className="py-28 bg-x-navy relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(124,58,237,0.08)_0%,_transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-eyebrow">{t('roadmap.eyebrow')}</p>
          <h2 className="section-title">{t('roadmap.title')}</h2>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-5 text-sm max-w-lg mx-auto">
            {t('roadmap.subtitle')}
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent md:left-1/2" />

          <div className="space-y-8">
            {PHASES.map((phase, i) => {
              const cfg = STATUS_CONFIG[phase.status];
              const StatusIcon = cfg.icon;
              const isRight = i % 2 === 0;
              const items = t(`roadmap.phase${phase.number}.items`, { returnObjects: true });

              return (
                <motion.div
                  key={phase.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className={`relative flex gap-6 md:gap-0 ${isRight ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`flex-1 md:w-[calc(50%-2rem)] ${isRight ? 'md:pr-10' : 'md:pl-10'}`}>
                    <div
                      className={`p-6 rounded-2xl border ${cfg.cardBorder} ${cfg.cardBg} hover:scale-[1.01] transition-transform duration-300`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-cinzel text-xs px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                          <StatusIcon size={10} className="inline mr-1" />
                          {t(cfg.labelKey)}
                        </span>
                        <span className="font-cinzel-dec text-3xl font-black text-white/8">
                          0{phase.number}
                        </span>
                      </div>

                      <h3 className={`font-cinzel text-base ${cfg.titleColor} mb-2`}>
                        Phase {phase.number}: {t(`roadmap.phase${phase.number}.title`)}
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed mb-4">
                        {t(`roadmap.phase${phase.number}.desc`)}
                      </p>

                      <ul className="grid grid-cols-2 gap-1">
                        {Array.isArray(items) && items.map((item) => (
                          <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className={`w-1 h-1 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="absolute left-6 top-6 md:left-1/2 md:-translate-x-1/2 flex-shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${cfg.dotClass}`}
                      style={{ boxShadow: cfg.dotGlow }}
                    >
                      <StatusIcon size={11} className="text-white" />
                    </div>
                  </div>

                  <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
