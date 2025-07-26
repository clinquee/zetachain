import Navigation from "../components/Navigation";
import HeroSection from "../components/HeroSection";
import GridBackgroundDemo from "../components/ui/grid-background-demo";

export default function Home() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            {/* Grid Background Demo */}
            <div className="fixed inset-0 z-0">
                <GridBackgroundDemo />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <Navigation />
                <HeroSection />
            </div>
        </div>
    );
}
