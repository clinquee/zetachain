'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, Zap, ExternalLink, Copy } from 'lucide-react';
import Link from 'next/link';

export default function ExecutePage() {
  const [executionStatus, setExecutionStatus] = useState('connecting');
  const [currentStep, setCurrentStep] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [userPrompt, setUserPrompt] = useState('');

  const steps = [
    {
      id: 1,
      type: "transfer",
      title: "Transfer 0.15 ETH to Polygon",
      status: "pending",
      txHash: null,
      chain: "Sepolia → Polygon"
    },
    {
      id: 2,
      type: "stake",
      title: "Stake 0.2 ETH on Lido",
      status: "pending",
      txHash: null,
      chain: "Sepolia"
    },
    {
      id: 3,
      type: "mintNFT",
      title: "Mint Naruto NFT",
      status: "pending",
      txHash: null,
      chain: "Polygon"
    }
  ];

  useEffect(() => {
    // Get the user prompt from localStorage
    const prompt = localStorage.getItem('zetavault_prompt');
    if (prompt) {
      setUserPrompt(prompt);
    }

    // Simulate execution process
    const executeSteps = async () => {
      setExecutionStatus('executing');
      
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        
        // Simulate transaction processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update step status
        const updatedSteps = [...steps];
        updatedSteps[i].status = 'completed';
        updatedSteps[i].txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        setTransactions(prev => [...prev, updatedSteps[i]]);
      }
      
      setExecutionStatus('completed');
    };

    executeSteps();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'executing':
        return <Clock className="w-6 h-6 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-bold">Executing Plan</h1>
            <p className="text-gray-400">Cross-chain execution in progress</p>
          </div>
        </div>

        {/* User Prompt Display */}
        {userPrompt && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-2">Your Request</h2>
            <p className="text-gray-300 italic">"{userPrompt}"</p>
          </div>
        )}

        {/* Execution Status */}
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Execution Status</h2>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500 font-semibold capitalize">{executionStatus}</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Step {currentStep + 1} of {steps.length} - {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
          </p>
        </div>

        {/* Steps Progress */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    {getStatusIcon(step.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-gray-400">{step.chain}</p>
                  </div>
                </div>
                <div className="text-right">
                  {step.txHash && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(step.txHash)}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${step.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {step.txHash && (
                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
                  <p className="text-sm font-mono text-purple-400 break-all">{step.txHash}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Results Summary */}
        {executionStatus === 'completed' && (
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h2 className="text-xl font-semibold text-green-400">Execution Completed!</h2>
            </div>
            <p className="text-gray-300 mb-4">
              All cross-chain actions have been successfully executed. Your assets are now distributed across multiple chains.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Total Transactions</p>
                <p className="text-white font-semibold">{transactions.length}</p>
              </div>
              <div>
                <p className="text-gray-400">Chains Used</p>
                <p className="text-white font-semibold">3</p>
              </div>
              <div>
                <p className="text-gray-400">Execution Time</p>
                <p className="text-white font-semibold">~9 seconds</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Link href="/" className="flex-1">
            <button className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all">
              Back to Home
            </button>
          </Link>
          {executionStatus === 'completed' && (
            <button className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all">
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 