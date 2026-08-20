import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollProgress from './components/ScrollProgress';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import WorldShowcase from './components/WorldShowcase';
import MMORPGVision from './components/MMORPGVision';
import AIWorldSection from './components/AIWorldSection';
import Roadmap from './components/Roadmap';
import UpdatesSection from './components/UpdatesSection';
import WaitlistSection from './components/WaitlistSection';
import ServerStatusSection from './components/ServerStatusSection';
import FAQSection from './components/FAQSection';
import CommunitySection from './components/CommunitySection';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import GitHubStats from './components/GitHubStats';
import EasterEgg from './components/EasterEgg';
import AmbientSound from './components/AmbientSound';
import Analytics from './components/Analytics';
import AuthModal from './components/AuthModal';
import CookieConsent from './components/CookieConsent';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccountPage from './pages/AccountPage';
import LegalPage from './pages/LegalPage';
import { useSession } from './hooks/useSession';
import { useCookieConsent } from './hooks/useCookieConsent';

function LandingHome() {
  const [authModal, setAuthModal] = useState(null); // null | 'register' | 'login'
  const { session, refreshSession } = useSession();
  const { consent, accept, decline, reset } = useCookieConsent();
  return (
    <div className="min-h-screen bg-x-dark">
      {consent === 'accepted' && <Analytics />}
      <LoadingScreen />
      <EasterEgg />
      <AmbientSound />
      <ScrollProgress />
      <Navbar onOpenAuth={setAuthModal} session={session} refreshSession={refreshSession} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WorldShowcase />
        <MMORPGVision />
        <AIWorldSection />
        <Roadmap />
        <UpdatesSection />
        <WaitlistSection />
        <ServerStatusSection />
        <FAQSection />
        <CommunitySection />
        <GitHubStats />
        <DownloadSection />
      </main>
      <Footer onOpenCookiePreferences={reset} />
      {authModal && (
        <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onLoggedIn={refreshSession} />
      )}
      <CookieConsent consent={consent} onAccept={accept} onDecline={decline} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingHome />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/privacy" element={<LegalPage docKey="privacy" />} />
      <Route path="/terms" element={<LegalPage docKey="terms" />} />
    </Routes>
  );
}
