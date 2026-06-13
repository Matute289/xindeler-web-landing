import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';

const API       = 'https://xindeler.greenmountain.dev/api/waitlist';
const COUNT_API = 'https://xindeler.greenmountain.dev/api/waitlist/count';
const MIN_COUNT = 5; // don't show badge until we have real traction

const PLATFORMS = [
  { value: 'windows', label: 'Windows' },
  { value: 'linux',   label: 'Linux'   },
  { value: 'macos',   label: 'macOS'   },
];

const SOURCES = [
  { value: 'github',  label: 'GitHub'         },
  { value: 'social',  label: 'Redes sociales' },
  { value: 'friend',  label: 'Un amigo'       },
  { value: 'search',  label: 'Búsqueda web'   },
  { value: 'other',   label: 'Otro'           },
];

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-xl text-sm font-cinzel border transition-all duration-200 ${
            value === opt.value
              ? 'border-x-gold/60 bg-x-gold/10 text-x-gold'
              : 'border-white/10 bg-white/3 text-gray-400 hover:border-white/20 hover:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function WaitlistSection() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [platform, setPlatform] = useState('');
  const [source,   setSource]   = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status,   setStatus]   = useState('idle'); // idle | loading | success | error
  const [errMsg,   setErrMsg]   = useState('');
  const [count,    setCount]    = useState(null);

  useEffect(() => {
    fetch(COUNT_API)
      .then(r => r.json())
      .then(d => { if (typeof d.count === 'number') setCount(d.count); })
      .catch(() => {});
  }, []);

  const canSubmit = name.trim() && email.trim() && platform && source && status !== 'loading';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('loading');
    setErrMsg('');

    try {
      const res = await fetch(API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), platform, source, honeypot }),
      });

      if (res.status === 429) {
        setErrMsg('Demasiados intentos. Esperá un rato e intentá de nuevo.');
        setStatus('error');
        return;
      }
      if (!res.ok) {
        setErrMsg('Algo salió mal. Intentá de nuevo en unos minutos.');
        setStatus('error');
        return;
      }

      setCount(c => (c !== null ? c + 1 : null));
      setStatus('success');
    } catch {
      setErrMsg('No pudimos conectar con el servidor. Revisá tu conexión.');
      setStatus('error');
    }
  };

  const showCount = count !== null && count >= MIN_COUNT;

  return (
    <section id="waitlist" className="py-28 bg-x-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,_rgba(212,160,23,0.06)_0%,_transparent_65%)] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-xl">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-eyebrow">Acceso Anticipado</p>
          <h2 className="section-title">Lista de Espera</h2>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-5 text-sm max-w-sm mx-auto">
            Sé de los primeros en probar Xindeler. Te avisamos cuando abramos el acceso.
          </p>

          <AnimatePresence>
            {showCount && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full border border-x-gold/20 bg-x-gold/5"
              >
                <Users size={13} className="text-x-gold" />
                <span className="font-cinzel text-xs text-x-gold">
                  {count.toLocaleString('es-AR')} personas ya se unieron
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl border border-white/8 bg-white/2 backdrop-blur-sm p-8"
        >
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-8 gap-4"
              >
                <div className="w-16 h-16 rounded-full border border-emerald-700/40 bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                </div>
                <h3 className="font-cinzel text-lg text-white">¡Estás dentro!</h3>
                <p className="text-gray-400 text-sm max-w-xs">
                  Anotamos tu lugar. Cuando abramos el acceso anticipado vas a ser de los primeros en enterarte.
                </p>
                {showCount && (
                  <p className="text-gray-600 text-xs font-cinzel">
                    Ya somos {count.toLocaleString('es-AR')} en la lista
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Honeypot — hidden from humans */}
                <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={e => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="font-cinzel text-xs text-gray-400 tracking-widest uppercase">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre"
                    maxLength={100}
                    required
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 font-cinzel focus:outline-none focus:border-x-gold/40 focus:bg-white/5 transition-all duration-200"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="font-cinzel text-xs text-gray-400 tracking-widest uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 font-cinzel focus:outline-none focus:border-x-gold/40 focus:bg-white/5 transition-all duration-200"
                  />
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <label className="font-cinzel text-xs text-gray-400 tracking-widest uppercase">
                    Plataforma
                  </label>
                  <ToggleGroup options={PLATFORMS} value={platform} onChange={setPlatform} />
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <label className="font-cinzel text-xs text-gray-400 tracking-widest uppercase">
                    ¿Cómo nos conociste?
                  </label>
                  <ToggleGroup options={SOURCES} value={source} onChange={setSource} />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {status === 'error' && errMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-rose-400 text-xs font-cinzel"
                    >
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {errMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-cinzel text-sm tracking-widest uppercase transition-all duration-300 ${
                    canSubmit
                      ? 'bg-x-gold text-x-dark hover:bg-x-gold/90 shadow-lg shadow-x-gold/20'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/8'
                  }`}
                >
                  {status === 'loading' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  {status === 'loading' ? 'Enviando…' : 'Unirme a la lista'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
