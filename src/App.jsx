import Navbar from './components/Navbar';
import ScrollProgress from './components/ScrollProgress';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import WorldShowcase from './components/WorldShowcase';
import MMORPGVision from './components/MMORPGVision';
import AIWorldSection from './components/AIWorldSection';
import Roadmap from './components/Roadmap';
import UpdatesSection from './components/UpdatesSection';
import CommunitySection from './components/CommunitySection';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import GitHubStats from './components/GitHubStats';
import EasterEgg from './components/EasterEgg';
import AmbientSound from './components/AmbientSound';
import Analytics from './components/Analytics';

export default function App() {
  return (
    <div className="min-h-screen bg-x-dark">
      <Analytics />
      <LoadingScreen />
      <EasterEgg />
      <AmbientSound />
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WorldShowcase />
        <MMORPGVision />
        <AIWorldSection />
        <Roadmap />
        <UpdatesSection />
        <CommunitySection />
        <GitHubStats />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
}
