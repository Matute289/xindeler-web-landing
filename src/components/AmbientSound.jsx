import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

const CDN          = 'https://cdn.xindeler.greenmountain.dev/sounds/common/2026-06-13';
const MASTER_VOL   = 0.15;
const FADE_MS      = 2000;   // play/pause fade
const LOOP_HALF_MS = 1250;   // same-track: 1.25s fade out + 1.25s fade in = 2.5s total
const ROT_HALF_MS  = 2000;   // rotation:   2s fade out   + 2s fade in   = 4s total
const SCENE_MIN_MS = 60  * 1000;
const SCENE_MAX_MS = 150 * 1000;

const SCENES = [
  { name: 'Dark',      emoji: '🌑', src: `${CDN}/Dark.mp3`      },
  { name: 'Mystical',  emoji: '✨', src: `${CDN}/Mystical.mp3`  },
  { name: 'Adventure', emoji: '⚔️', src: `${CDN}/Adventure.mp3` },
  { name: 'Divine',    emoji: '☀️', src: `${CDN}/Divine.mp3`    },
  { name: 'Nature',    emoji: '🌿', src: `${CDN}/Nature.mp3`    },
];

// Per-scene vibration params: fx/fy/fs = frequency (Hz), ax/ay/as_ = amplitude (px / scale units)
const SCENE_VIB = [
  { fx: 0.70, fy: 0.50, fs: 0.40, ax: 1.2, ay: 0.7, as_: 0.020 }, // Dark      — lento, pesado
  { fx: 0.35, fy: 0.28, fs: 0.22, ax: 0.5, ay: 0.3, as_: 0.007 }, // Mystical  — suave, etéreo
  { fx: 1.60, fy: 1.10, fs: 0.85, ax: 1.5, ay: 0.9, as_: 0.028 }, // Adventure — enérgico
  { fx: 0.22, fy: 0.18, fs: 0.14, ax: 0.3, ay: 0.2, as_: 0.004 }, // Divine    — casi imperceptible
  { fx: 0.85, fy: 0.60, fs: 0.48, ax: 1.0, ay: 0.6, as_: 0.015 }, // Nature    — orgánico
];

const clamp = (v) => Math.min(1, Math.max(0, v));

function fadeVol(el, from, to, ms, onDone) {
  const steps    = Math.max(1, Math.round(ms / 50));
  const interval = ms / steps;
  let   step     = 0;
  el.volume = clamp(from);
  const id = setInterval(() => {
    step++;
    el.volume = clamp(from + (to - from) * (step / steps));
    if (step >= steps) { clearInterval(id); el.volume = clamp(to); onDone?.(); }
  }, interval);
  return id;
}

export default function AmbientSound() {
  const [playing,    setPlayingState] = useState(false);
  const [loading,    setLoading]      = useState(false);
  const [sceneLabel, setSceneLabel]   = useState(null);

  const elsRef         = useRef(null);   // Audio[]
  const activeIdx      = useRef(-1);
  const playingRef     = useRef(false);
  const initialised    = useRef(false);
  const rotTimerRef    = useRef(null);
  const labelTimer     = useRef(null);
  const fadeTimers     = useRef([]);
  const loopCleanup    = useRef(null);   // removes timeupdate/ended listeners from active track
  const loopFading     = useRef(false);  // true while a loop-fade is in progress
  const vibrateRef     = useRef(null);   // wrapper div that receives the vibration transform
  const vibRafRef      = useRef(null);

  const setPlaying = (v) => { playingRef.current = v; setPlayingState(v); };

  const clearFades = () => { fadeTimers.current.forEach(clearInterval); fadeTimers.current = []; };

  const showLabel = (idx) => {
    clearTimeout(labelTimer.current);
    setSceneLabel(SCENES[idx]);
    labelTimer.current = setTimeout(() => setSceneLabel(null), 3500);
  };

  const nextIdx = () => {
    const cur = activeIdx.current;
    let n;
    do { n = Math.floor(Math.random() * SCENES.length); } while (n === cur);
    return n;
  };

  // Attach loop-fade listeners to an audio element.
  // When the track is LOOP_HALF_MS away from ending: fade out.
  // When it ends: restart from 0 and fade in.
  const attachLoopFade = useCallback((el) => {
    loopCleanup.current?.();
    loopFading.current = false;

    const onTimeUpdate = () => {
      if (loopFading.current) return;
      if (!isFinite(el.duration)) return;
      if (!playingRef.current) return;
      const remaining = (el.duration - el.currentTime) * 1000;
      if (remaining <= LOOP_HALF_MS) {
        loopFading.current = true;
        clearFades();
        const t = fadeVol(el, MASTER_VOL, 0, remaining, () => {});
        fadeTimers.current.push(t);
      }
    };

    const onEnded = () => {
      loopFading.current = false;
      if (!playingRef.current) return;
      el.currentTime = 0;
      el.play().catch(() => {});
      clearFades();
      const t = fadeVol(el, 0, MASTER_VOL, LOOP_HALF_MS);
      fadeTimers.current.push(t);
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);

    loopCleanup.current = () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('ended', onEnded);
    };
  }, []);

  const scheduleRotation = useCallback(() => {
    clearTimeout(rotTimerRef.current);
    const delay = SCENE_MIN_MS + Math.random() * (SCENE_MAX_MS - SCENE_MIN_MS);
    rotTimerRef.current = setTimeout(() => rotateTo(nextIdx()), delay);
  }, []);

  const rotateTo = useCallback((newIdx) => {
    const els    = elsRef.current;
    const oldIdx = activeIdx.current;
    if (!els) return;

    const oldEl = oldIdx >= 0 ? els[oldIdx] : null;
    const newEl = els[newIdx];

    // Remove loop listeners from old track before fading
    loopCleanup.current?.();
    loopCleanup.current = null;
    loopFading.current  = false;

    clearFades();
    activeIdx.current = newIdx;
    showLabel(newIdx);
    scheduleRotation();

    if (!playingRef.current) {
      if (oldEl && oldIdx !== newIdx) { oldEl.volume = 0; oldEl.pause(); }
      return;
    }

    const startNew = () => {
      newEl.volume = 0;
      newEl.play().catch(() => {});
      const t = fadeVol(newEl, 0, MASTER_VOL, ROT_HALF_MS, () => {
        attachLoopFade(newEl);
      });
      fadeTimers.current.push(t);
    };

    if (oldEl && oldIdx !== newIdx) {
      const t = fadeVol(oldEl, MASTER_VOL, 0, ROT_HALF_MS, () => {
        oldEl.pause();
        startNew();
      });
      fadeTimers.current.push(t);
    } else {
      startNew();
    }
  }, [scheduleRotation, attachLoopFade]);

  // RAF vibration — drives the wrapper div transform based on active scene
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
      // Two sine waves per axis → organic, non-mechanical feel
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

  // Pre-create <audio> elements on mount — browser starts buffering in background
  useEffect(() => {
    const els = SCENES.map(({ src }) => {
      const el   = new Audio(src);
      el.loop    = false; // manual looping with fade
      el.volume  = 0;
      el.preload = 'auto';
      return el;
    });
    elsRef.current = els;

    return () => {
      clearTimeout(rotTimerRef.current);
      clearTimeout(labelTimer.current);
      cancelAnimationFrame(vibRafRef.current);
      clearFades();
      loopCleanup.current?.();
      els.forEach(el => { el.pause(); el.src = ''; });
    };
  }, []);

  const toggle = async () => {
    const els = elsRef.current;
    if (!els) return;

    if (!initialised.current) {
      initialised.current = true;
      const startIdx = Math.floor(Math.random() * SCENES.length);
      activeIdx.current = startIdx;
      showLabel(startIdx);
      setLoading(true);

      try {
        await els[startIdx].play();
      } catch (_) {
        initialised.current = false;
        setLoading(false);
        return;
      }

      clearFades();
      const t = fadeVol(els[startIdx], 0, MASTER_VOL, FADE_MS, () => {
        attachLoopFade(els[startIdx]);
      });
      fadeTimers.current.push(t);
      setLoading(false);
      setPlaying(true);
      scheduleRotation();
      return;
    }

    const el = els[activeIdx.current];
    clearFades();

    if (!playingRef.current) {
      el.play().catch(() => {});
      const t = fadeVol(el, el.volume, MASTER_VOL, FADE_MS, () => {
        attachLoopFade(el);
      });
      fadeTimers.current.push(t);
      setPlaying(true);
    } else {
      loopCleanup.current?.();
      loopCleanup.current = null;
      loopFading.current  = false;
      const t = fadeVol(el, MASTER_VOL, 0, FADE_MS, () => el.pause());
      fadeTimers.current.push(t);
      setPlaying(false);
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

      {/* Wrapper receives the RAF vibration transform; motion.button keeps hover/tap */}
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
