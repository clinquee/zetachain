'use client';

import { useState, useEffect } from 'react';
import { Zap, Menu, X, Wallet } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-black/10 backdrop-blur-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ZetaVault
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#features" className="text-gray-200 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-200 hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#demo" className="text-gray-200 hover:text-white transition-colors">
              Demo
            </a>
            <button className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </div>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white hover:text-gray-300 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-black/20 backdrop-blur-sm">
            <div className="flex flex-col py-6 space-y-4">
              <a 
                href="#features" 
                className="text-gray-200 hover:text-white transition-colors px-6 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-gray-200 hover:text-white transition-colors px-6 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How it Works
              </a>
              <a 
                href="#demo" 
                className="text-gray-200 hover:text-white transition-colors px-6 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Demo
              </a>
              <button className="mx-6 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 