'use client';

import { useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      // Store the prompt in localStorage for the execute page
      localStorage.setItem('zetavault_prompt', prompt);
      // Navigate directly to execute page
      router.push('/execute');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-32">
      <div className="text-center">
        <h1 className="text-5xl lg:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            AI-Powered
          </span>
          <br />
          <span className="text-white">Cross-Chain Agent</span>
        </h1>
        
        <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Transform natural language into executable cross-chain actions. 
          From simple transfers to complex DeFi strategies - just describe what you want.
        </p>

        {/* Interactive Prompt Input */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Try: 'Diversify 0.5 ETH: 30% to Polygon, 40% stake ETH, 30% mint Naruto NFT'"
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-2 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Demo Button */}
        <button className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all">
          <Play className="w-5 h-5" />
          <span>Watch Demo</span>
        </button>
      </div>
    </div>
  );
} 