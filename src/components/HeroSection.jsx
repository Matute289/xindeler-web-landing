import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Download, BookOpen, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GitHubIcon from './GitHubIcon';

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();

    const particles = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.8 + 0.4,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: -(Math.random() * 0.45 + 0.08),
      opacity: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.65 ? '#d4a017' : Math.random() > 0.5 ? '#a855f7' : 'rgba(255,255,255,0.8)',
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < -4) { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
        if (p.x < -4) p.x = canvas.width + 4;
        if (p.x > canvas.width + 4) p.x = -4;
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { resize(); particles.forEach(p => { p.x = Math.random() * canvas.width; p.y = Math.random() * canvas.height; }); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true" />;
}

export default function HeroSection() {
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 700], [0, 140]);

  const BUTTONS = [
    { tKey: 'hero.btnDownload', icon: Download,   scroll: '#download',                                   primary: true  },
    { tKey: 'hero.btnDocs',     icon: BookOpen,   href: 'https://docs.xindeler.greenmountain.dev',       primary: false },
    { tKey: 'hero.btnWiki',     icon: Globe,      href: 'https://wiki.xindeler.greenmountain.dev',       primary: false },
    { tKey: 'hero.btnGitHub',   icon: GitHubIcon, href: 'https://github.com/Matute289/xindeler',         primary: false },
  ];

  return (
    <section id="home" className="relative h-screen min-h-[600px] overflow-hidden flex items-center justify-center">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <img
          src="https://cdn.xindeler.greenmountain.dev/images/common/2026-06-12/front-img.webp"
          alt="Xindeler world"
          className="w-full h-full object-cover scale-110"
          loading="eager"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-x-dark" />
        <div className="absolute inset-0 bg-gradient-to-r from-x-dark/70 via-transparent to-x-dark/70" />
      </motion.div>

      <ParticleCanvas />

      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          <p className="font-cinzel text-x-gold text-xs md:text-sm tracking-[0.4em] uppercase mb-5 opacity-90">
            {t('hero.eyebrow')}
          </p>
          <h1
            className="font-cinzel-dec font-black text-white leading-none mb-4"
            style={{ fontSize: 'clamp(4rem, 12vw, 9rem)', textShadow: '0 0 60px rgba(212,160,23,0.45), 0 4px 16px rgba(0,0,0,0.95)' }}
          >
            XINDELER
          </h1>
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-x-gold to-transparent mx-auto mb-5" />
          <p className="font-cinzel text-lg md:text-2xl text-x-gold-2 mb-4 tracking-wide">
            {t('hero.tagline')}
          </p>
          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('hero.description')}
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45 }}
        >
          {BUTTONS.map(({ tKey, icon: Icon, href, scroll, primary }) =>
            scroll ? (
              <button
                key={tKey}
                onClick={() => document.querySelector(scroll)?.scrollIntoView({ behavior: 'smooth' })}
                className={primary ? 'btn-primary' : 'btn-secondary'}
              >
                <Icon size={16} />
                {t(tKey)}
              </button>
            ) : (
              <a key={tKey} href={href} target="_blank" rel="noopener noreferrer"
                 className={primary ? 'btn-primary' : 'btn-secondary'}>
                <Icon size={16} />
                {t(tKey)}
              </a>
            )
          )}
        </motion.div>
      </div>

      <motion.button
        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/40 hover:text-x-gold transition-colors duration-300"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Scroll down"
      >
        <ChevronDown size={34} />
      </motion.button>
    </section>
  );
}
