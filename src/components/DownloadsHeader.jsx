import LanguageSwitcher from './LanguageSwitcher';

export default function DownloadsHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-x-dark/95 backdrop-blur-md border-b border-white/5">
      <nav className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16 md:h-20">
        <a
          href="https://xindeler.com"
          className="font-cinzel-dec text-xl md:text-2xl font-bold text-white hover:text-x-gold transition-colors duration-300"
          style={{ textShadow: '0 0 20px rgba(212,160,23,0.3)' }}
        >
          XINDELER
        </a>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
