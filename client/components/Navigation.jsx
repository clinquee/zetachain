'use client';

import { useState, useEffect } from 'react';
import { Zap, Menu, X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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
            {/* <a href="#features" className="text-gray-200 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-200 hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#demo" className="text-gray-200 hover:text-white transition-colors">
              Demo
            </a> */}
            
            {/* RainbowKit Connect Button */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button 
                            onClick={openConnectModal} 
                            className="relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
                          >
                            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-medium text-white backdrop-blur-3xl">
                              Connect Wallet
                            </span>
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button 
                            onClick={openChainModal} 
                            className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={openChainModal}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2"
                          >
                            {chain.hasIcon && (
                              <div className="w-4 h-4">
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    className="w-4 h-4"
                                  />
                                )}
                              </div>
                            )}
                            <span>{chain.name}</span>
                          </button>

                          <button 
                            onClick={openAccountModal} 
                            className="relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
                          >
                            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-medium text-white backdrop-blur-3xl">
                              {account.displayName}
                              {account.displayBalance
                                ? ` (${account.displayBalance})`
                                : ''}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
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
              
              {/* Mobile Connect Button */}
              <div className="px-6">
                <ConnectButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}