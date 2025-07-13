import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import Background from './components/Background';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <Background />
      
      <div className="relative z-10">
        <Navigation />
        <HeroSection />
        <FeaturesSection />
      </div>
    </div>
  );
}
