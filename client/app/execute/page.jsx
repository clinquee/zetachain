'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, Zap, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import Aurora from '../components/Aurora';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background as FlowBackground,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { 
      label: (
        <div className="flex items-center space-x-2 px-4 py-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-white">Start Execution</span>
        </div>
      )
    },
    position: { x: 0, y: 100 },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }
  },
  {
    id: '2',
    data: { 
      label: (
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="font-semibold text-white">Transfer 0.15 ETH</div>
          </div>
          <div className="text-xs text-blue-300 ml-4">Sepolia → Polygon</div>
        </div>
      )
    },
    position: { x: 280, y: 100 },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minWidth: '200px',
    }
  },
  {
    id: '3',
    data: { 
      label: (
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <div className="font-semibold text-white">Stake 0.2 ETH</div>
          </div>
          <div className="text-xs text-purple-300 ml-4">Lido Protocol</div>
        </div>
      )
    },
    position: { x: 560, y: 100 },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minWidth: '200px',
    }
  },
  {
    id: '4',
    data: { 
      label: (
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <div className="font-semibold text-white">Mint Naruto NFT</div>
          </div>
          <div className="text-xs text-orange-300 ml-4">Polygon Network</div>
        </div>
      )
    },
    position: { x: 840, y: 100 },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minWidth: '200px',
    }
  },
  {
    id: '5',
    type: 'output',
    data: { 
      label: (
        <div className="flex items-center space-x-2 px-4 py-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="font-semibold text-white">Execution Complete</span>
        </div>
      )
    },
    position: { x: 1120, y: 100 },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }
  },
];

const initialEdges = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    animated: true,
    style: { stroke: '#667eea', strokeWidth: 3 },
    markerEnd: { type: 'arrowclosed', color: '#667eea' }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3', 
    animated: true,
    style: { stroke: '#667eea', strokeWidth: 3 },
    markerEnd: { type: 'arrowclosed', color: '#667eea' }
  },
  { 
    id: 'e3-4', 
    source: '3', 
    target: '4', 
    animated: true,
    style: { stroke: '#667eea', strokeWidth: 3 },
    markerEnd: { type: 'arrowclosed', color: '#667eea' }
  },
  { 
    id: 'e4-5', 
    source: '4', 
    target: '5', 
    animated: true,
    style: { stroke: '#667eea', strokeWidth: 3 },
    markerEnd: { type: 'arrowclosed', color: '#667eea' }
  },
];

export default function ExecutePage() {
  const [userPrompt, setUserPrompt] = useState('');
  const [executionStatus, setExecutionStatus] = useState('connecting');
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const prompt = localStorage.getItem('zetavault_prompt');
    if (prompt) setUserPrompt(prompt);
    // Simulate execution process
    const run = async () => {
      setExecutionStatus('executing');
      for (let i = 1; i < initialNodes.length - 1; i++) {
        if (isPaused) {
          await new Promise(resolve => {
            const checkPause = () => {
              if (!isPaused) resolve();
              else setTimeout(checkPause, 100);
            };
            checkPause();
          });
        }
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setExecutionStatus('completed');
    };
    run();
    // eslint-disable-next-line
  }, [isPaused]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const togglePause = () => setIsPaused((p) => !p);
  const resetExecution = () => {
    setExecutionStatus('connecting');
    setCurrentStep(0);
    setIsPaused(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <Aurora colorStops={["#5227FF", "#7cff67", "#5227FF"]} amplitude={1.2} blend={0.6} speed={0.8} />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all duration-300">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
              Node-Based Execution Flow
            </h1>
            <p className="text-gray-400 mt-1">Cross-chain workflow visualization</p>
          </div>
        </div>
        {/* User Prompt Display */}
        {userPrompt && (
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8 shadow-2xl">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h2 className="text-lg font-semibold text-white">Your Request</h2>
            </div>
            <p className="text-gray-300 italic text-lg leading-relaxed">"{userPrompt}"</p>
          </div>
        )}
        {/* Execution Controls */}
        <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-white">Execution Controls</h2>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 font-semibold capitalize">{executionStatus}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePause}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 px-6 py-3 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 shadow-lg"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span className="font-medium">{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={resetExecution}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 px-6 py-3 rounded-xl hover:from-gray-500/30 hover:to-gray-600/30 transition-all duration-300 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="font-medium">Reset</span>
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3 mt-6 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${((currentStep + 1) / (initialNodes.length - 1)) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-gray-400">
              Step {currentStep + 1} of {initialNodes.length - 1} - {Math.round(((currentStep + 1) / (initialNodes.length - 1)) * 100)}% complete
            </p>
            <div className="flex space-x-2">
              {Array.from({ length: initialNodes.length - 1 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= currentStep ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        {/* React Flow Node-Based Visualization */}
        <div className="relative bg-gradient-to-br from-black/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8" style={{ height: 500 }}>
          <div className="absolute top-4 left-6 z-10">
            <h3 className="text-lg font-semibold text-white mb-1">Workflow Visualization</h3>
            <p className="text-sm text-gray-400">Interactive execution flow</p>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="rounded-2xl"
            style={{ background: 'transparent' }}
          >
            <MiniMap 
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}
              nodeColor="#667eea"
              maskColor="rgba(0, 0, 0, 0.2)"
            />
            <Controls 
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}
            />
            {/* Removed <FlowBackground /> to disable the grid */}
          </ReactFlow>
        </div>
        {/* Results Summary */}
        {executionStatus === 'completed' && (
          <div className="bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8 mb-8 shadow-2xl animate-pulse">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-400">Workflow Completed!</h2>
                <p className="text-green-300">All operations executed successfully</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">
              All nodes in the workflow have been successfully executed. Your cross-chain operations are complete with full transparency and security.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-gray-400 mb-1">Total Nodes</p>
                <p className="text-white font-bold text-2xl">{initialNodes.length}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-gray-400 mb-1">Chains Used</p>
                <p className="text-white font-bold text-2xl">3</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-gray-400 mb-1">Execution Time</p>
                <p className="text-white font-bold text-2xl">~8s</p>
              </div>
            </div>
          </div>
        )}
        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Link href="/" className="flex-1">
            <button className="w-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl hover:from-white/20 hover:to-white/10 transition-all duration-300 font-medium shadow-lg">
              Back to Home
            </button>
          </Link>
          {executionStatus === 'completed' && (
            <button className="flex-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 text-white px-8 py-4 rounded-xl hover:from-purple-600 hover:via-blue-600 hover:to-green-600 transition-all duration-300 font-medium shadow-lg transform hover:scale-105">
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 