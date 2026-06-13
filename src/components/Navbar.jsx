import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const clickCount   = useRef(0);
  const clickTimer   = useRef(null);
  const eggCooldown  = useRef(false);

  const NAV_LINKS = [
    { key: 'features',  href: '#features'   },
    { key: 'world',     href: '#showcase'    },
    { key: 'vision',    href: '#vision'      },
    { key: 'aiWorld',   href: '#ai-world'    },
    { key: 'roadmap',   href: '#roadmap'     },
    { key: 'community', href: '#community'   },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (eggCooldown.current) return;
    scrollTo('#home');
    clickCount.current += 1;
    clearTimeout(clickTimer.current);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      eggCooldown.current = true;
      window.dispatchEvent(new CustomEvent('xindeler:easter-egg'));
      setTimeout(() => { eggCooldown.current = false; }, 3000);
    } else {
      clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 2000);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-x-dark/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/50'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <a
          href="#home"
          onClick={handleLogoClick}
          className="font-cinzel-dec text-xl md:text-2xl font-bold text-white hover:text-x-gold transition-colors duration-300"
          style={{ textShadow: '0 0 20px rgba(212,160,23,0.3)' }}
        >
          XINDELER
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ key, href }) => (
            <li key={key}>
              <button
                onClick={() => scrollTo(href)}
                className="font-cinzel text-xs tracking-widest uppercase text-gray-400 hover:text-x-gold transition-colors duration-300 relative group"
              >
                {t(`nav.${key}`)}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-x-gold group-hover:w-full transition-all duration-300" />
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => scrollTo('#download')}
            className="flex items-center gap-2 px-5 py-2 font-cinzel text-xs tracking-wider text-black bg-x-gold rounded hover:bg-x-gold-2 transition-colors duration-300"
            style={{ boxShadow: '0 2px 12px rgba(212,160,23,0.4)' }}
          >
            <Download size={14} />
            {t('nav.download')}
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white hover:text-x-gold transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-x-navy/98 backdrop-blur-md border-b border-white/5"
          >
            <ul className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {NAV_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <button
                    onClick={() => scrollTo(href)}
                    className="font-cinzel text-sm tracking-widest uppercase text-gray-300 hover:text-x-gold transition-colors w-full text-left"
                  >
                    {t(`nav.${key}`)}
                  </button>
                </li>
              ))}
              <li className="pt-2 border-t border-white/10 flex items-center justify-between">
                <LanguageSwitcher />
                <button
                  onClick={() => scrollTo('#download')}
                  className="btn-primary"
                >
                  <Download size={16} />
                  {t('nav.download')}
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
