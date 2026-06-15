import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

const CDN          = 'https://cdn.xindeler.greenmountain.dev/sounds/common/2026-06-13';
const MASTER_VOL   = 0.15;
const FADE_S       = 2;
const ROT_FADE_S   = 2;
const SCENE_MIN_MS = 60  * 1000;
const SCENE_MAX_MS = 150 * 1000;

const SCENES = [
  { name: 'Dark',      emoji: '🌑', src: `${CDN}/Dark.mp3`      },
  { name: 'Mystical',  emoji: '✨', src: `${CDN}/Mystical.mp3`  },
  { name: 'Adventure', emoji: '⚔️', src: `${CDN}/Adventure.mp3` },
  { name: 'Divine',    emoji: '☀️', src: `${CDN}/Divine.mp3`    },
  { name: 'Nature',    emoji: '🌿', src: `${CDN}/Nature.mp3`    },
];

const SCENE_VIB = [
  { fx: 0.70, fy: 0.50, fs: 0.40, ax: 1.2, ay: 0.7, as_: 0.020 },
  { fx: 0.35, fy: 0.28, fs: 0.22, ax: 0.5, ay: 0.3, as_: 0.007 },
  { fx: 1.60, fy: 1.10, fs: 0.85, ax: 1.5, ay: 0.9, as_: 0.028 },
  { fx: 0.22, fy: 0.18, fs: 0.14, ax: 0.3, ay: 0.2, as_: 0.004 },
  { fx: 0.85, fy: 0.60, fs: 0.48, ax: 1.0, ay: 0.6, as_: 0.015 },
];

export default function AmbientSound() {
  const [playing,    setPlayingState] = useState(false);
  const [loading,    setLoading]      = useState(false);
  const [sceneLabel, setSceneLabel]   = useState(null);

  const ctxRef        = useRef(null);  // AudioContext
  const masterRef     = useRef(null);  // GainNode (master)
  const buffersRef    = useRef([]);    // AudioBuffer[] — decoded
  const fetchesRef    = useRef(null);  // Promise<ArrayBuffer>[] — pre-fetches
  const activeRef     = useRef(null);  // { source: AudioBufferSourceNode, gain: GainNode }
  const activeIdx     = useRef(-1);
  const playingRef    = useRef(false);
  const initRef       = useRef(false);
  const rotTimerRef   = useRef(null);
  const labelTimer    = useRef(null);
  const pendingSuspend = useRef(null);
  const vibrateRef    = useRef(null);
  const vibRafRef     = useRef(null);

  const setPlaying = (v) => { playingRef.current = v; setPlayingState(v); };

  const showLabel = (idx) => {
    clearTimeout(labelTimer.current);
    setSceneLabel(SCENES[idx]);
    labelTimer.current = setTimeout(() => setSceneLabel(null), 3500);
  };

  const nextIdx = () => {
    let n;
    do { n = Math.floor(Math.random() * SCENES.length); } while (n === activeIdx.current);
    return n;
  };

  const playScene = useCallback((idx, fadeS) => {
    const ctx    = ctxRef.current;
    const master = masterRef.current;
    const buf    = buffersRef.current[idx];
    if (!ctx || !master || !buf) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(MASTER_VOL, ctx.currentTime + fadeS);
    gain.connect(master);

    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop   = true;
    source.connect(gain);
    source.start();

    activeRef.current = { source, gain };
    activeIdx.current = idx;
    showLabel(idx);
  }, []);

  const scheduleRotation = useCallback(() => {
    clearTimeout(rotTimerRef.current);
    const delay = SCENE_MIN_MS + Math.random() * (SCENE_MAX_MS - SCENE_MIN_MS);
    rotTimerRef.current = setTimeout(() => {
      if (!playingRef.current) return;
      const newIdx = nextIdx();
      const old    = activeRef.current;
      const ctx    = ctxRef.current;

      // Crossfade: start new scene (fades in) while old scene fades out simultaneously
      playScene(newIdx, ROT_FADE_S);

      if (old && ctx) {
        const { source: oldSrc, gain: oldGain } = old;
        oldGain.gain.setValueAtTime(oldGain.gain.value, ctx.currentTime);
        oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + ROT_FADE_S);
        setTimeout(() => {
          try { oldSrc.stop(); oldGain.disconnect(); } catch {}
        }, ROT_FADE_S * 1000 + 100);
      }

      scheduleRotation();
    }, delay);
  }, [playScene]);

  // RAF vibration
  useEffect(() => {
    const el = vibrateRef.current;
    if (!el) return;

    if (!playing) {
      cancelAnimationFrame(vibRafRef.current);
      el.style.transition = 'transform 0.5s ease-out';
      el.style.transform  = 'translate(0px,0px) scale(1)';
      return;
    }

    el.style.transition = 'none';
    const tick = (ts) => {
      const t   = ts / 1000;
      const idx = Math.min(Math.max(activeIdx.current, 0), SCENE_VIB.length - 1);
      const v   = SCENE_VIB[idx];
      const x = (Math.sin(t * v.fx * Math.PI * 2) + Math.sin(t * v.fx * 2.71 * Math.PI) * 0.4) * v.ax;
      const y = (Math.sin(t * v.fy * Math.PI * 2) + Math.cos(t * v.fy * 1.83 * Math.PI) * 0.3) * v.ay;
      const s = 1
        + Math.sin(t * v.fs * Math.PI * 2) * v.as_
        + Math.sin(t * v.fs * 3.31 * Math.PI) * v.as_ * 0.5;
      el.style.transform = `translate(${x}px,${y}px) scale(${s})`;
      vibRafRef.current  = requestAnimationFrame(tick);
    };
    vibRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(vibRafRef.current);
  }, [playing]);

  // Pre-fetch audio data on mount (no AudioContext needed — works without user gesture)
  useEffect(() => {
    fetchesRef.current = SCENES.map(s => fetch(s.src).then(r => r.arrayBuffer()));
    return () => {
      clearTimeout(rotTimerRef.current);
      clearTimeout(labelTimer.current);
      clearTimeout(pendingSuspend.current);
      cancelAnimationFrame(vibRafRef.current);
      if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
    };
  }, []);

  const toggle = async () => {
    // First click: create AudioContext, decode buffers, start playback
    if (!initRef.current) {
      initRef.current = true;
      setLoading(true);
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        await ctx.resume();
        ctxRef.current = ctx;

        const master = ctx.createGain();
        master.gain.value = 1;
        master.connect(ctx.destination);
        masterRef.current = master;

        const arrayBuffers = await Promise.all(fetchesRef.current);
        buffersRef.current = await Promise.all(
          arrayBuffers.map(ab => ctx.decodeAudioData(ab))
        );

        const startIdx = Math.floor(Math.random() * SCENES.length);
        playScene(startIdx, FADE_S);
        setPlaying(true);
        scheduleRotation();
      } catch {
        initRef.current = false;
      } finally {
        setLoading(false);
      }
      return;
    }

    const ctx = ctxRef.current;
    if (!ctx) return;

    if (playingRef.current) {
      // Pause: fade out gain then suspend AudioContext
      const active = activeRef.current;
      if (active) {
        active.gain.gain.setValueAtTime(active.gain.gain.value, ctx.currentTime);
        active.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_S);
      }
      clearTimeout(rotTimerRef.current);
      clearTimeout(pendingSuspend.current);
      pendingSuspend.current = setTimeout(() => ctx.suspend(), FADE_S * 1000);
      setPlaying(false);
    } else {
      // Resume: cancel pending suspend, resume context, fade gain back in
      clearTimeout(pendingSuspend.current);
      await ctx.resume();
      const active = activeRef.current;
      if (active) {
        active.gain.gain.cancelScheduledValues(ctx.currentTime);
        active.gain.gain.setValueAtTime(0, ctx.currentTime);
        active.gain.gain.linearRampToValueAtTime(MASTER_VOL, ctx.currentTime + FADE_S);
      }
      setPlaying(true);
      scheduleRotation();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {sceneLabel && (
          <motion.div
            key={sceneLabel.name}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-x-dark/90 backdrop-blur-sm text-xs font-cinzel text-gray-400 shadow-lg pointer-events-none"
          >
            <span>{sceneLabel.emoji}</span>
            <span>{sceneLabel.name}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={vibrateRef} style={{ willChange: 'transform' }}>
        <motion.button
          onClick={toggle}
          disabled={loading}
          className={`relative w-11 h-11 rounded-full border backdrop-blur-sm flex items-center justify-center transition-all duration-300 shadow-lg shadow-black/40 ${
            loading
              ? 'border-white/10 bg-x-dark/80 text-gray-600 cursor-wait'
              : playing
                ? 'border-x-gold/50 bg-x-dark/90 text-x-gold'
                : 'border-white/12 bg-x-dark/80 text-gray-500 hover:text-gray-300 hover:border-white/25'
          }`}
          whileHover={loading ? {} : { scale: 1.08 }}
          whileTap={loading ? {} : { scale: 0.92 }}
          aria-label={loading ? 'Loading…' : playing ? 'Mute music' : 'Play music'}
          title={loading ? 'Loading…' : playing ? 'Mute music' : 'Play music'}
        >
          <AnimatePresence>
            {playing && !loading && (
              <motion.span
                key="ring"
                className="absolute inset-0 rounded-full border border-x-gold/30"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.7, opacity: [0, 0.5, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'linear',
                  opacity: { times: [0, 0.25, 1], ease: 'linear' },
                }}
              />
            )}
          </AnimatePresence>
          {playing && !loading ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </motion.button>
      </div>
    </div>
  );
}
