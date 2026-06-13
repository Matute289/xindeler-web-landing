import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Brain, ScrollText, Heart, Home, Sparkles,
  MapPin, Package, Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ── Arcane rune particles ─────────────────────────────── */
const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ'];

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  rune: RUNES[i % RUNES.length],
  left: `${5 + Math.random() * 90}%`,
  delay: `${Math.random() * 10}s`,
  duration: `${8 + Math.random() * 8}s`,
  size: `${10 + Math.random() * 8}px`,
}));

function ArcaneParticles() {
  const particles = PARTICLES;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 text-purple-400/20 font-cinzel select-none"
          style={{
            left: p.left,
            fontSize: p.size,
            animation: `arcane-drift ${p.duration} ${p.delay} linear infinite`,
          }}
        >
          {p.rune}
        </div>
      ))}
    </div>
  );
}

/* ── Feature defs ───────────────────────────────────────── */
const AI_FEATURE_DEFS = [
  { key: 'dynamicConversations', icon: MessageSquare, color: 'text-violet-400',  bg: 'bg-violet-900/30',  border: 'border-violet-700/30'  },
  { key: 'persistentMemory',     icon: Brain,         color: 'text-indigo-400',  bg: 'bg-indigo-900/30',  border: 'border-indigo-700/30'  },
  { key: 'dynamicQuests',        icon: ScrollText,    color: 'text-amber-400',   bg: 'bg-amber-900/30',   border: 'border-amber-700/30'   },
  { key: 'socialRelationships',  icon: Heart,         color: 'text-rose-400',    bg: 'bg-rose-900/30',    border: 'border-rose-700/30'    },
  { key: 'livingSettlements',    icon: Home,          color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-700/30' },
  { key: 'emergentStories',      icon: Sparkles,      color: 'text-cyan-400',    bg: 'bg-cyan-900/30',    border: 'border-cyan-700/30'    },
];

/* ── Typewriter hook ────────────────────────────────────── */
function useTypewriter(text, speed = 35, startDelay = 0) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let interval;
    const start = setTimeout(() => {
      setDisplayed('');
      setDone(false);
      let i = 0;
      interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayed(text.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => { clearTimeout(start); clearInterval(interval); };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

/* ── Memory color map ───────────────────────────────────── */
const MEMORY_COLORS = {
  positive: 'border-emerald-700/40 text-emerald-400',
  urgent:   'border-rose-700/40 text-rose-400',
  knowledge:'border-blue-700/40 text-blue-400',
};

/* ── NPC Showcase ───────────────────────────────────────── */
function NPCShowcase() {
  const { t } = useTranslation();

  const questText = t('aiWorld.npc.questText');
  const { displayed, done } = useTypewriter(questText, 28, 600);

  const memories = [
    { type: 'positive',  icon: '🌿', text: t('aiWorld.npc.memory1') },
    { type: 'urgent',    icon: '💔', text: t('aiWorld.npc.memory2') },
    { type: 'knowledge', icon: '📍', text: t('aiWorld.npc.memory3') },
  ];

  const details = [
    { icon: '🌿', labelKey: 'aiWorld.npc.detailTrigger',  valueKey: 'aiWorld.npc.detailTriggerVal'  },
    { icon: '🗺️', labelKey: 'aiWorld.npc.detailLocation', valueKey: 'aiWorld.npc.detailLocationVal' },
    { icon: '⏳', labelKey: 'aiWorld.npc.detailTime',     valueKey: 'aiWorld.npc.detailTimeVal'     },
    { icon: '🤝', labelKey: 'aiWorld.npc.detailDiff',     valueKey: 'aiWorld.npc.detailDiffVal'     },
  ];

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* NPC Card */}
      <div className="rounded-2xl border border-purple-700/30 overflow-hidden"
           style={{ background: 'rgba(91,33,182,0.10)', backdropFilter: 'blur(12px)' }}>
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-white/8">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 border-purple-500/50"
                 style={{ background: 'linear-gradient(135deg, #4c1d95, #1e1b4b)' }}>
              🌿
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-x-dark" />
          </div>
          <div>
            <h4 className="font-cinzel text-white text-base leading-tight">Elara</h4>
            <p className="text-purple-300 text-xs mt-0.5">{t('aiWorld.npc.role')}</p>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={11} className="text-gray-500" />
              <span className="text-gray-500 text-xs">{t('aiWorld.npc.location')}</span>
              <Star size={11} className="text-x-gold" />
              <span className="text-gray-500 text-xs">{t('aiWorld.npc.level')}</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-purple-400 font-cinzel">{t('aiWorld.npc.relationshipLabel')}</div>
            <div className="text-x-gold text-xs font-semibold">{t('aiWorld.npc.relationshipValue')}</div>
          </div>
        </div>

        {/* Memory System */}
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={13} className="text-purple-400" />
            <span className="font-cinzel text-purple-300 text-xs tracking-widest uppercase">
              {t('aiWorld.npc.memoryTitle')}
            </span>
          </div>
          <div className="space-y-2">
            {memories.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.12 }}
                className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border bg-black/20 ${MEMORY_COLORS[m.type]}`}
              >
                <span className="text-sm flex-shrink-0 mt-0.5">{m.icon}</span>
                <span className="text-gray-300 leading-relaxed">{m.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Generated Quest */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText size={13} className="text-x-gold" />
            <span className="font-cinzel text-x-gold text-xs tracking-widest uppercase">
              {t('aiWorld.npc.questTitle')}
            </span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-700/30 font-cinzel">
              {t('aiWorld.npc.questBadge')}
            </span>
          </div>
          <div className="rounded-xl border border-amber-700/25 p-4 bg-amber-950/20">
            <div className="flex items-center gap-2 mb-2">
              <ScrollText size={14} className="text-x-gold flex-shrink-0" />
              <span className="font-cinzel text-white text-sm">{t('aiWorld.npc.questName')}</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-3 min-h-[48px]">
              {displayed}
              {!done && <span className="text-purple-400 animate-pulse">▌</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-900/30 border border-emerald-700/30 text-emerald-400">
                <Package size={11} /> {t('aiWorld.npc.rewardPotions')}
              </span>
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-900/30 border border-blue-700/30 text-blue-400">
                <Star size={11} /> {t('aiWorld.npc.rewardRep')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quest detail row */}
      <div className="grid grid-cols-2 gap-3">
        {details.map((item) => (
          <div key={item.labelKey} className="rounded-lg border border-white/8 px-3 py-2.5 bg-white/2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">{item.icon}</span>
              <span className="font-cinzel text-gray-500 text-xs tracking-wider uppercase">{t(item.labelKey)}</span>
            </div>
            <span className="text-white text-xs font-medium">{t(item.valueKey)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Main Section ───────────────────────────────────────── */
export default function AIWorldSection() {
  const { t } = useTranslation();

  return (
    <section
      id="ai-world"
      className="py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #06060f 0%, #0a0618 40%, #080614 60%, #06060f 100%)' }}
    >
      <ArcaneParticles />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-8 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-6 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-700/40 bg-purple-900/20 mb-5">
            <Sparkles size={13} className="text-purple-400" />
            <span className="font-cinzel text-purple-300 text-xs tracking-widest uppercase">{t('aiWorld.badge')}</span>
          </div>
          <h2
            className="font-cinzel text-4xl md:text-5xl text-white mb-4"
            style={{ textShadow: '0 0 40px rgba(139,92,246,0.3)' }}
          >
            {t('aiWorld.title')}<br />
            <span className="shimmer-text">{t('aiWorld.titleHighlight')}</span>
          </h2>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-5 max-w-xl mx-auto text-sm leading-relaxed">
            {t('aiWorld.subtitle')}
          </p>
        </motion.div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: Feature mini-cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {AI_FEATURE_DEFS.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09 }}
                className={`group p-5 rounded-xl border ${f.border} ${f.bg} hover:scale-[1.02] transition-all duration-300 cursor-default`}
              >
                <div className={`mb-3 ${f.color}`}>
                  <f.icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className={`font-cinzel text-sm text-white mb-1.5 group-hover:${f.color} transition-colors`}>
                  {t(`aiWorld.${f.key}.title`)}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">{t(`aiWorld.${f.key}.desc`)}</p>
              </motion.div>
            ))}

            {/* Bottom disclaimer */}
            <div className="sm:col-span-2 mt-2 p-4 rounded-xl border border-white/5 bg-white/2">
              <p className="text-gray-500 text-xs leading-relaxed text-center">
                <span className="text-purple-400">⚠</span>{' '}
                {t('aiWorld.disclaimer')}
              </p>
            </div>
          </motion.div>

          {/* Right: NPC Showcase */}
          <NPCShowcase />
        </div>

        {/* Dialogue example */}
        <motion.div
          className="mt-14 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="text-center mb-6">
            <span className="font-cinzel text-gray-500 text-xs tracking-widest uppercase">
              {t('aiWorld.dialogue.sectionTitle')}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-xs px-4 py-3 rounded-2xl rounded-tr-sm bg-purple-700/30 border border-purple-600/30">
                <p className="text-xs text-gray-300 mb-1 font-cinzel text-purple-400">{t('aiWorld.dialogue.playerLabel')}</p>
                <p className="text-sm text-white">{t('aiWorld.dialogue.playerMsg')}</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-xs px-4 py-3 rounded-2xl rounded-tl-sm bg-x-navy/80 border border-white/8">
                <p className="text-xs text-gray-400 mb-1 font-cinzel text-emerald-400">{t('aiWorld.dialogue.npcLabel')}</p>
                <p className="text-sm text-white">{t('aiWorld.dialogue.npcMsg')}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-x-gold/30 bg-amber-950/30"
              >
                <ScrollText size={14} className="text-x-gold" />
                <span className="font-cinzel text-x-gold text-xs tracking-wider">{t('aiWorld.dialogue.questGenerated')}</span>
                <span className="text-gray-400 text-xs">{t('aiWorld.dialogue.questName')}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
