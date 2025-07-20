"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Play, Sparkles, Zap, Globe, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { chatAPI } from "../utils/api";

export default function HeroSection() {
    const [prompt, setPrompt] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typedText, setTypedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [serverStatus, setServerStatus] = useState("unknown");
    const router = useRouter();

    const examplePrompts = [
        "Transfer 5 TestToken to 0x71AfE44200A819171a0687b1026E8d4424472Ff8",
        "Mint a ZetaNFT with metadata URI https://example.com/metadata.json",
        "Bridge 1000 TestToken from Ethereum to Polygon",
        "Create a portfolio: 50% ETH, 30% TestToken, 20% ZetaNFT",
    ];

    useEffect(() => {
        let currentIndex = 0;
        let currentChar = 0;
        let isDeleting = false;

        const typeText = () => {
            const currentPrompt = examplePrompts[currentIndex];

            if (isDeleting) {
                setTypedText(currentPrompt.substring(0, currentChar - 1));
                currentChar--;
            } else {
                setTypedText(currentPrompt.substring(0, currentChar + 1));
                currentChar++;
            }

            if (!isDeleting && currentChar === currentPrompt.length) {
                setTimeout(() => {
                    isDeleting = true;
                }, 2000);
            } else if (isDeleting && currentChar === 0) {
                isDeleting = false;
                currentIndex = (currentIndex + 1) % examplePrompts.length;
            }

            const speed = isDeleting ? 50 : 100;
            setTimeout(typeText, speed);
        };

        typeText();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Trim whitespace and check if prompt is not empty
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt) {
            setError("Please enter a prompt");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            console.log("Submitting prompt:", trimmedPrompt);
            const result = await chatAPI.parsePrompt(trimmedPrompt);
            console.log("Parsed result:", result);

            if (result.success && result.actions) {
                // Store the parsed actions and original prompt
                localStorage.setItem(
                    "zetavault_actions",
                    JSON.stringify(result.actions)
                );
                localStorage.setItem("zetavault_prompt", trimmedPrompt);

                // Navigate to execution page
                router.push("/execute");
            } else {
                setError("Failed to parse your request. Please try again.");
            }
        } catch (err) {
            console.error("Error:", err);
            setError(
                err.message || "Failed to parse your request. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 pt-20">
            <div className="relative z-10 max-w-6xl mx-auto text-center">
                {/* Badge
                <div className="inline-flex items-center space-x-2 text-white/80 mb-8">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">
                        AI-Powered Cross-Chain Execution
                    </span>
                </div> */}

                {/* Main Heading */}
                <h1 className="text-5xl lg:text-8xl font-bold mb-8 leading-tight">
                    <span className="bg-gradient-to-r from-gray-300 via-white to-gray-300 bg-clip-text text-transparent">
                        The Future of
                    </span>
                    <br />
                    <span className="text-white">DeFi is Here</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                    Transform natural language into executable cross-chain
                    actions. From simple transfers to complex DeFi strategies -
                    just describe what you want.
                </p>

                {/* Interactive Prompt Input */}
                <div className="max-w-3xl mx-auto mb-12">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={typedText || "Enter your request..."}
                            disabled={
                                isLoading || serverStatus === "disconnected"
                            }
                            className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-lg disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={
                                isLoading ||
                                !prompt.trim() ||
                                serverStatus === "disconnected"
                            }
                            className="absolute right-2 top-2 bg-gradient-to-r from-gray-600 via-white to-gray-600 text-black p-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            {error}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <button
                        onClick={() =>
                            setPrompt(
                                "Transfer 5 TestToken to 0x71AfE44200A819171a0687b1026E8d4424472Ff8"
                            )
                        }
                        disabled={serverStatus === "disconnected"}
                        className="bg-gradient-to-r from-gray-600 via-white to-gray-600 text-black px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center space-x-2">
                            <Zap className="w-5 h-5" />
                            <span className="text-lg font-semibold">
                                Try Example
                            </span>
                        </div>
                    </button>

                    <button className="flex items-center space-x-2 text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-300">
                        <Play className="w-5 h-5" />
                        <span className="text-lg font-semibold">
                            Watch Demo
                        </span>
                    </button>
                </div>

                {/* Debug Info (remove in production)
                {process.env.NODE_ENV === "development" && (
                    <div className="mt-8 text-xs text-gray-500">
                        <p>Prompt: {prompt}</p>
                        <p>Loading: {isLoading.toString()}</p>
                        <p>Error: {error}</p>
                        <p>Server Status: {serverStatus}</p>
                    </div>
                )} */}
            </div>
        </div>
    );
}
