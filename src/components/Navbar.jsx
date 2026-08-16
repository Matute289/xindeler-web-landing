import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Download, UserPlus, LogIn, User, ChevronDown, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const WEB_API = '/api';

export default function Navbar({ onOpenAuth, session, refreshSession }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
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

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onClickOutside = (e) => {
      if (!accountMenuRef.current?.contains(e.target)) setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [accountMenuOpen]);

  // 200 regardless of whether a session existed on the server side — see
  // xindeler-web-api's session::logout(). refreshSession() afterwards is
  // what actually corrects the UI either way, so no need to branch on the
  // fetch's own success here.
  const handleLogout = () => {
    fetch(`${WEB_API}/session/logout`, { method: 'POST' })
      .catch(() => {})
      .finally(() => {
        setAccountMenuOpen(false);
        setMobileOpen(false);
        refreshSession?.();
      });
  };

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
          {session ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setAccountMenuOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors duration-300"
              >
                <User size={13} />
                <span className="max-w-[120px] truncate">{session.username}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${accountMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-x-navy border border-white/10 rounded shadow-xl overflow-hidden"
                  >
                    <Link
                      to="/account"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 font-cinzel text-xs tracking-wider text-gray-300 hover:bg-white/5 hover:text-x-gold transition-colors"
                    >
                      <User size={13} />
                      {t('nav.myAccount')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 font-cinzel text-xs tracking-wider text-gray-300 hover:bg-white/5 hover:text-x-gold transition-colors"
                    >
                      <LogOut size={13} />
                      {t('nav.logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : onOpenAuth && (
            <button
              onClick={() => onOpenAuth('register')}
              className="flex items-center gap-2 px-4 py-2 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors duration-300"
            >
              <UserPlus size={13} />
              {t('nav.register')}
            </button>
          )}
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
              {session && (
                <>
                  <li>
                    <Link
                      to="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 font-cinzel text-sm tracking-widest uppercase text-gray-300 hover:text-x-gold transition-colors w-full text-left"
                    >
                      <User size={15} />
                      {t('nav.myAccount')}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 font-cinzel text-sm tracking-widest uppercase text-gray-300 hover:text-x-gold transition-colors w-full text-left"
                    >
                      <LogOut size={15} />
                      {t('nav.logout')}
                    </button>
                  </li>
                </>
              )}
              <li className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <LanguageSwitcher align="left" />
                {!session && onOpenAuth && (
                  <button
                    onClick={() => { setMobileOpen(false); onOpenAuth('login'); }}
                    className="flex items-center gap-1.5 px-3 py-2 font-cinzel text-xs tracking-wider text-x-gold border border-x-gold/40 rounded hover:bg-x-gold/10 transition-colors"
                  >
                    <LogIn size={13} />
                    {t('nav.login')}
                  </button>
                )}
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
