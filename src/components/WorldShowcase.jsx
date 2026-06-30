import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CDN = 'https://cdn.xindeler.com/images/common/2026-06-12';

const SCENE_DEFS = [
  { key: 'mistyMountains', icon: '⛰️', span: 'col-span-2 row-span-2', img: `${CDN}/misty-mountains-img.webp`,    gradient: 'from-slate-700 via-slate-600 to-blue-900'      },
  { key: 'ancientForest',  icon: '🌲', span: '',                       img: `${CDN}/ancient-forest-img.webp`,     gradient: 'from-emerald-900 via-green-800 to-teal-900'    },
  { key: 'willowdale',     icon: '🏘️',span: '',                       img: `${CDN}/village-of-willowdale-img.webp`,gradient:'from-amber-900 via-orange-800 to-amber-900'    },
  { key: 'stonehaven',     icon: '🏰', span: 'col-span-2',             img: `${CDN}/stonehaven-castle-img.webp`,  gradient: 'from-gray-900 via-gray-700 to-slate-800'       },
  { key: 'crystalRiver',   icon: '🌊', span: '',                       img: `${CDN}/crystal-river-img.webp`,      gradient: 'from-cyan-900 via-blue-800 to-teal-900'        },
  { key: 'darkfire',       icon: '🔥', span: '',                       img: `${CDN}/darkfire-dungeon-img.webp`,   gradient: 'from-red-950 via-red-900 to-orange-950'        },
  { key: 'arcane',         icon: '✨', span: '',                       img: `${CDN}/arcane-sanctum-img.webp`,     gradient: 'from-violet-900 via-purple-800 to-indigo-900'  },
  { key: 'guild',          icon: '⚔️', span: '',                       img: `${CDN}/adventurers-guild-img.webp`,  gradient: 'from-yellow-900 via-amber-800 to-yellow-950'   },
];

function SceneCard({ scene, name, desc, onClick, delay = 0 }) {
  return (
    <motion.div
      className={`relative group cursor-pointer rounded-xl overflow-hidden ${scene.span}`}
      style={{ minHeight: scene.span.includes('row-span-2') ? 280 : 140 }}
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onClick={() => onClick(scene)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${scene.gradient}`} />
      {scene.img && (
        <img
          src={scene.img}
          alt={name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex justify-between items-start">
          <span className="text-3xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>{scene.icon}</span>
          <Maximize2 size={16} className="text-white/0 group-hover:text-white/70 transition-all duration-300" />
        </div>
        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-cinzel text-white text-sm md:text-base font-semibold mb-1"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{name}</h3>
          <p className="text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-tight">{desc}</p>
        </div>
      </div>
      <div className="absolute inset-0 rounded-xl border border-white/0 group-hover:border-white/20 transition-colors duration-300" />
    </motion.div>
  );
}

function Modal({ scenes, activeIndex, names, descs, onClose, onPrev, onNext }) {
  const scene = scenes[activeIndex];
  if (!scene) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
        <motion.div
          className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`relative h-72 md:h-96 bg-gradient-to-br ${scene.gradient} overflow-hidden`}>
            {scene.img && (
              <img src={scene.img} alt={names[activeIndex]} className="absolute inset-0 w-full h-full object-cover"
                   onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-4 right-4">
              <span className="text-5xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}>{scene.icon}</span>
            </div>
          </div>
          <div className="bg-x-navy p-5 border-t border-white/10">
            <h3 className="font-cinzel text-xl text-white mb-1">{names[activeIndex]}</h3>
            <p className="text-gray-400 text-sm">{descs[activeIndex]}</p>
          </div>
          <button onClick={onPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={onNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"><ChevronRight size={20} /></button>
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"><X size={18} /></button>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
            {scenes.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-x-gold' : 'bg-white/30'}`} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function WorldShowcase() {
  const { t } = useTranslation();
  const [modalIndex, setModalIndex] = useState(null);

  const names = SCENE_DEFS.map(s => t(`showcase.${s.key}.name`));
  const descs = SCENE_DEFS.map(s => t(`showcase.${s.key}.desc`));

  return (
    <section id="showcase" className="py-28 bg-x-navy relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,_rgba(124,58,237,0.08)_0%,_transparent_60%)] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-eyebrow">{t('showcase.eyebrow')}</p>
          <h2 className="section-title">{t('showcase.title')}</h2>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-5 text-sm max-w-lg mx-auto">{t('showcase.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[140px]">
          {SCENE_DEFS.map((scene, i) => (
            <SceneCard
              key={scene.key}
              scene={scene}
              name={names[i]}
              desc={descs[i]}
              onClick={() => setModalIndex(i)}
              delay={i * 0.07}
            />
          ))}
        </div>
      </div>

      {modalIndex !== null && (
        <Modal
          scenes={SCENE_DEFS}
          activeIndex={modalIndex}
          names={names}
          descs={descs}
          onClose={() => setModalIndex(null)}
          onPrev={(e) => { e.stopPropagation(); setModalIndex(i => (i - 1 + SCENE_DEFS.length) % SCENE_DEFS.length); }}
          onNext={(e) => { e.stopPropagation(); setModalIndex(i => (i + 1) % SCENE_DEFS.length); }}
        />
      )}
    </section>
  );
}
