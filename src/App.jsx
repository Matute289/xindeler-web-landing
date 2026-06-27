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
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function LandingHome() {
  const [authModal, setAuthModal] = useState(null); // null | 'register' | 'login'
  return (
    <div className="min-h-screen bg-x-dark">
      <Analytics />
      <LoadingScreen />
      <EasterEgg />
      <AmbientSound />
      <ScrollProgress />
      <Navbar onOpenAuth={setAuthModal} />
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
      <Footer />
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
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
    </Routes>
  );
}
