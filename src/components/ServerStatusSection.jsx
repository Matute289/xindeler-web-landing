import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, RefreshCw } from 'lucide-react';

const API     = 'https://xindeler.com/api/status';
const POLL_MS = 60_000;

function formatChecked(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function ServerStatusSection() {
  const [online,     setOnline]     = useState(false);
  const [checkedAt,  setCheckedAt]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchKey,   setFetchKey]   = useState(0);

  // Increment fetchKey every POLL_MS — triggers the fetch effect
  useEffect(() => {
    const id = setInterval(() => setFetchKey(k => k + 1), POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Re-run whenever fetchKey changes (initial mount + polling + manual refresh)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(API);
        const data = await res.json();
        if (cancelled) return;
        setOnline(!!data.online);
        setCheckedAt(data.checked_at ?? null);
      } catch {
        if (!cancelled) setOnline(false);
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setFetchKey(k => k + 1);
  };

  return (
    <section id="server-status" className="py-20 bg-x-navy relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,_rgba(124,58,237,0.05)_0%,_transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-xl">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-eyebrow">Infraestructura</p>
          <h2 className="section-title">Estado del Servidor</h2>
          <div className="gold-divider" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl border border-white/8 bg-white/2 backdrop-blur-sm px-8 py-8"
        >
          {loading ? (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              {/* Status indicator */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                  online
                    ? 'border-emerald-700/40 bg-emerald-900/20'
                    : 'border-white/10 bg-white/3'
                }`}>
                  <Server size={18} className={online ? 'text-emerald-400' : 'text-gray-600'} />
                </div>
                {online && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-cinzel text-sm font-semibold ${online ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {online ? 'En línea' : 'Fuera de línea'}
                </p>
                <p className="text-gray-600 text-xs mt-0.5 font-cinzel">
                  Servidor Xindeler Alpha
                </p>
              </div>

              {/* Checked at + refresh */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {checkedAt && (
                  <p className="text-gray-600 text-xs font-cinzel">
                    {formatChecked(checkedAt)}
                  </p>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-gray-600 hover:text-gray-400 transition-colors duration-200 disabled:opacity-40"
                  title="Actualizar"
                >
                  <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          )}

          <p className="text-gray-700 text-xs font-cinzel mt-5 text-center">
            Se actualiza automáticamente cada 60 segundos
          </p>
        </motion.div>
      </div>
    </section>
  );
}
