import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ'];

const MIN_DISPLAY_MS = 1800;

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const start = Date.now();

    const hide = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => setVisible(false), remaining);
    };

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide, { once: true });
      return () => window.removeEventListener('load', hide);
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#06060f' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)',
            }}
          />

          {/* Floating runes */}
          {RUNES.map((rune, i) => (
            <motion.span
              key={i}
              className="absolute font-cinzel text-purple-400/20 select-none pointer-events-none"
              style={{
                left: `${5 + (i / RUNES.length) * 90}%`,
                fontSize: `${12 + (i % 4) * 4}px`,
              }}
              animate={{ y: [80, -120], opacity: [0, 0.4, 0] }}
              transition={{
                duration: 4 + (i % 3),
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {rune}
            </motion.span>
          ))}

          {/* Logo */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="font-cinzel-dec font-black text-white"
              style={{
                fontSize: 'clamp(3rem, 10vw, 6rem)',
                textShadow: '0 0 60px rgba(212,160,23,0.5), 0 4px 16px rgba(0,0,0,0.9)',
              }}
              animate={{ textShadow: [
                '0 0 40px rgba(212,160,23,0.3)',
                '0 0 80px rgba(212,160,23,0.7)',
                '0 0 40px rgba(212,160,23,0.3)',
              ]}}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              XINDELER
            </motion.h1>

            <div className="w-48 h-px bg-gradient-to-r from-transparent via-x-gold to-transparent" />

            <p className="font-cinzel text-x-gold text-xs tracking-[0.4em] uppercase opacity-80">
              Open Source MMORPG
            </p>

            {/* Arcane spinner */}
            <div className="relative w-10 h-10 mt-2">
              <motion.div
                className="absolute inset-0 rounded-full border border-x-gold/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-1 rounded-full border border-x-purple/50"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-x-gold"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
