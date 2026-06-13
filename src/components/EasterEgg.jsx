import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ'];
const RUNE_COUNT = 16;
const RING_RADIUS = 110;
const BURST_RADIUS = 420;
const BURST_OFFSETS = Array.from({ length: RUNE_COUNT }, () => Math.random() * 80);
const AUTO_CLOSE_MS = 4200;
const LOCK_MS = 2200;

function RuneRing({ burst }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {Array.from({ length: RUNE_COUNT }).map((_, i) => {
        const angle = (i / RUNE_COUNT) * 2 * Math.PI - Math.PI / 2;
        const ringX = Math.cos(angle) * RING_RADIUS;
        const ringY = Math.sin(angle) * RING_RADIUS;
        const burstX = Math.cos(angle) * (BURST_RADIUS + BURST_OFFSETS[i]);
        const burstY = Math.sin(angle) * (BURST_RADIUS + BURST_OFFSETS[i]);

        return (
          <motion.span
            key={i}
            className="absolute font-cinzel text-x-gold select-none"
            style={{ fontSize: `${16 + (i % 4) * 6}px` }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
            animate={
              burst
                ? {
                    x: burstX,
                    y: burstY,
                    opacity: [1, 0.8, 0],
                    scale: [1.4, 1, 0.4],
                    rotate: angle * (180 / Math.PI) + 360,
                  }
                : {
                    x: ringX,
                    y: ringY,
                    opacity: [0, 1],
                    scale: [0, 1],
                    rotate: [0, 15, -15, 0],
                  }
            }
            transition={
              burst
                ? { duration: 1.2, delay: i * 0.03, ease: 'easeOut' }
                : { duration: 0.6, delay: i * 0.04, ease: 'backOut' }
            }
          >
            {RUNES[i % RUNES.length]}
          </motion.span>
        );
      })}
    </div>
  );
}

export default function EasterEgg() {
  const [active, setActive] = useState(false);
  const [burst, setBurst]   = useState(false);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    const timers = [];
    const trigger = () => {
      setActive(true);
      setBurst(false);
      setLocked(true);
      timers.push(setTimeout(() => setBurst(true), 900));
      timers.push(setTimeout(() => setLocked(false), LOCK_MS));
      timers.push(setTimeout(() => {
        setActive(false);
        setBurst(false);
        setLocked(true);
      }, AUTO_CLOSE_MS));
    };
    window.addEventListener('xindeler:easter-egg', trigger);
    return () => {
      window.removeEventListener('xindeler:easter-egg', trigger);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="easter-egg"
          className="fixed inset-0 z-[9990] flex items-center justify-center cursor-pointer overflow-hidden"
          style={{ background: 'rgba(6,6,15,0.92)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => { if (!locked) { setActive(false); setBurst(false); } }}
        >
          {/* Background glow orb */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.35) 0%, rgba(124,58,237,0.2) 40%, transparent 70%)' }}
            initial={{ width: 0, height: 0 }}
            animate={{ width: burst ? 900 : 300, height: burst ? 900 : 300 }}
            transition={{ duration: burst ? 0.8 : 0.6, ease: 'easeOut' }}
          />

          {/* Rune ring → burst */}
          <RuneRing burst={burst} />

          {/* Spinning outer ring */}
          <motion.div
            className="absolute rounded-full border border-x-gold/20 pointer-events-none"
            style={{ width: 260, height: 260 }}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: burst ? 0 : 0.6, rotate: 360 }}
            transition={{ opacity: { duration: 0.4 }, rotate: { duration: 6, repeat: Infinity, ease: 'linear' } }}
          />
          <motion.div
            className="absolute rounded-full border border-x-purple/30 pointer-events-none"
            style={{ width: 200, height: 200 }}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: burst ? 0 : 0.5, rotate: -360 }}
            transition={{ opacity: { duration: 0.4 }, rotate: { duration: 4, repeat: Infinity, ease: 'linear' } }}
          />

          {/* Central content */}
          <div className="relative z-10 text-center pointer-events-none select-none">
            <motion.h1
              className="font-cinzel-dec font-black text-white"
              style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: burst ? [1.1, 1.3, 1.0] : 1,
                textShadow: burst
                  ? ['0 0 40px rgba(212,160,23,0.6)', '0 0 120px rgba(212,160,23,1)', '0 0 60px rgba(212,160,23,0.8)']
                  : '0 0 40px rgba(212,160,23,0.5)',
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              XINDELER
            </motion.h1>

            <motion.div
              className="w-48 h-px bg-gradient-to-r from-transparent via-x-gold to-transparent mx-auto my-3"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            />

            <motion.p
              className="font-cinzel text-x-gold text-xs md:text-sm tracking-[0.4em] uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: burst ? 1 : 0, y: burst ? 0 : 10 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              ᚨ The ancient magic awakens ᚨ
            </motion.p>

            <motion.p
              className="text-gray-500 text-xs mt-3 font-cinzel tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: burst ? 0.6 : 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              [ click to dismiss ]
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
