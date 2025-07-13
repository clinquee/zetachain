'use client';

import { useState } from 'react';
import { Zap, Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between p-6 lg:p-8 relative z-50">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          ZetaVault
        </span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-6">
        <a href="#features" className="text-gray-300 hover:text-white transition-colors">
          Features
        </a>
        <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
          How it Works
        </a>
        <a href="#demo" className="text-gray-300 hover:text-white transition-colors">
          Demo
        </a>
        <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all">
          Connect Wallet
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-white"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/90 backdrop-blur-sm border-b border-white/10 md:hidden">
          <div className="flex flex-col p-4 space-y-4">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#demo" className="text-gray-300 hover:text-white transition-colors">
              Demo
            </a>
            <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all">
              Connect Wallet
            </button>
          </div>
        </div>
      )}
    </nav>
  );
} 