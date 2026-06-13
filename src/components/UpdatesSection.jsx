import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const CATEGORY = {
  gameplay:        { label: 'Gameplay',        color: 'text-amber-400',   border: 'border-l-amber-500'   },
  lore:            { label: 'Lore',            color: 'text-violet-400',  border: 'border-l-violet-500'  },
  mundo:           { label: 'Mundo',           color: 'text-emerald-400', border: 'border-l-emerald-500' },
  motor:           { label: 'Motor',           color: 'text-blue-400',    border: 'border-l-blue-500'    },
  infraestructura: { label: 'Infra',           color: 'text-gray-400',    border: 'border-l-gray-500'    },
  proyecto:        { label: 'Iniciativa',      color: 'text-rose-400',    border: 'border-l-rose-500'    },
};

const TYPE = {
  added:   { label: 'Nuevo',       cls: 'text-emerald-400 border-emerald-700/40 bg-emerald-900/15' },
  updated: { label: 'Actualizado', cls: 'text-amber-400   border-amber-700/40   bg-amber-900/15'   },
  removed: { label: 'Revisado',    cls: 'text-gray-400    border-gray-700/40    bg-gray-800/15'    },
};

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function UpdatesSection() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/updates.json')
      .then(r => r.json())
      .then(data => setUpdates(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setUpdates([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="updates" className="py-28 bg-x-navy relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,_rgba(124,58,237,0.07)_0%,_transparent_65%)] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-eyebrow">Desarrollo Activo</p>
          <h2 className="section-title">Últimas Novedades</h2>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-5 text-sm max-w-md mx-auto">
            Actualizaciones periódicas sobre el progreso del desarrollo de Xindeler.
          </p>
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/3 animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && updates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-14 h-14 rounded-full border border-white/8 bg-white/3 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={22} className="text-x-gold/50" />
            </div>
            <p className="font-cinzel text-gray-500 text-sm">Las novedades llegarán pronto</p>
            <p className="text-gray-600 text-xs mt-2">El proyecto está en desarrollo activo</p>
          </motion.div>
        )}

        {/* Scrollable feed */}
        {!loading && updates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Scroll container */}
            <div
              className="overflow-y-auto space-y-3 pr-2"
              style={{ maxHeight: '420px' }}
            >
              {updates.map((u, i) => {
                const cat  = CATEGORY[u.category] ?? CATEGORY.motor;
                const type = TYPE[u.type]         ?? TYPE.updated;

                return (
                  <div
                    key={u.id}
                    className={`group flex gap-5 pl-5 pr-6 py-5 rounded-2xl border border-white/6 border-l-2 ${cat.border} bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all duration-300`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className={`font-cinzel text-xs ${cat.color}`}>{cat.label}</span>
                        <span className="text-white/15">·</span>
                        <span className={`inline-flex items-center font-cinzel text-xs px-2 py-0.5 rounded-full border ${type.cls}`}>
                          {type.label}
                        </span>
                        <span className="ml-auto font-cinzel text-gray-600 text-xs flex-shrink-0">
                          {formatDate(u.date)}
                        </span>
                      </div>
                      <h3 className="font-cinzel text-sm text-white/85 mb-1.5 group-hover:text-white transition-colors duration-200">
                        {u.title}
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {u.summary}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom fade — hints there's more to scroll */}
            <div className="absolute bottom-0 left-0 right-2 h-20 bg-gradient-to-t from-x-navy to-transparent pointer-events-none rounded-b-2xl" />
          </motion.div>
        )}
      </div>
    </section>
  );
}
