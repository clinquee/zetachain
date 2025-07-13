import Navigation from "../components/Navigation";
import HeroSection from "../components/HeroSection";
import Aurora from "../components/Aurora";

export default function Home() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            {/* Aurora Background */}
            <div className="fixed inset-0 z-0">
                <Aurora
                    colorStops={["#1a1a2e", "#16213e", "#0f3460"]}
                    amplitude={0.8}
                    blend={0.3}
                    speed={0.5}
                />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <Navigation />
                <HeroSection />
            </div>
        </div>
    );
}
