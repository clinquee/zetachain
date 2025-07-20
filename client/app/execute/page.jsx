"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { ArrowLeft, CheckCircle, Zap, Play, Pause, RotateCcw, Wallet, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { executeActionsWithWagmi } from "../../utils/web3";
import GridBackgroundDemo from "../../components/ui/grid-background-demo";
import {
    ReactFlow,
    MiniMap,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const initialNodes = [
    {
        id: "1",
        type: "input",
        data: {
            label: (
                <div className="flex items-center space-x-2 px-4 py-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-white">
                        Start Execution
                    </span>
                </div>
            ),
        },
        position: { x: 0, y: 100 },
        style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        },
    },
    {
        id: "2",
        data: {
            label: (
                <div className="px-4 py-3">
                    <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div className="font-semibold text-white">
                            Transfer 0.15 ETH
                        </div>
                    </div>
                    <div className="text-xs text-blue-300 ml-4">
                        Sepolia → Polygon
                    </div>
                </div>
            ),
        },
        position: { x: 280, y: 100 },
        style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            minWidth: "200px",
        },
    },
    {
        id: "3",
        data: {
            label: (
                <div className="px-4 py-3">
                    <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <div className="font-semibold text-white">
                            Stake 0.2 ETH
                        </div>
                    </div>
                    <div className="text-xs text-purple-300 ml-4">
                        Lido Protocol
                    </div>
                </div>
            ),
        },
        position: { x: 560, y: 100 },
        style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            minWidth: "200px",
        },
    },
    {
        id: "4",
        data: {
            label: (
                <div className="px-4 py-3">
                    <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <div className="font-semibold text-white">
                            Mint Naruto NFT
                        </div>
                    </div>
                    <div className="text-xs text-orange-300 ml-4">
                        Polygon Network
                    </div>
                </div>
            ),
        },
        position: { x: 840, y: 100 },
        style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            minWidth: "200px",
        },
    },
    {
        id: "5",
        type: "output",
        data: {
            label: (
                <div className="flex items-center space-x-2 px-4 py-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-white">
                        Execution Complete
                    </span>
                </div>
            ),
        },
        position: { x: 1120, y: 100 },
        style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        },
    },
];

const initialEdges = [
    {
        id: "e1-2",
        source: "1",
        target: "2",
        animated: true,
        style: { stroke: "#667eea", strokeWidth: 3 },
        markerEnd: { type: "arrowclosed", color: "#667eea" },
    },
    {
        id: "e2-3",
        source: "2",
        target: "3",
        animated: true,
        style: { stroke: "#667eea", strokeWidth: 3 },
        markerEnd: { type: "arrowclosed", color: "#667eea" },
    },
    {
        id: "e3-4",
        source: "3",
        target: "4",
        animated: true,
        style: { stroke: "#667eea", strokeWidth: 3 },
        markerEnd: { type: "arrowclosed", color: "#667eea" },
    },
    {
        id: "e4-5",
        source: "4",
        target: "5",
        animated: true,
        style: { stroke: "#667eea", strokeWidth: 3 },
        markerEnd: { type: "arrowclosed", color: "#667eea" },
    },
];

export default function ExecutePage() {
    const [userPrompt, setUserPrompt] = useState("");
    const [parsedActions, setParsedActions] = useState([]); // Always initialize as array
    const [executionStatus, setExecutionStatus] = useState("idle");
    const [isPaused, setIsPaused] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [txHash, setTxHash] = useState("");
    const [error, setError] = useState("");
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    
    // Wagmi hooks
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    useEffect(() => {
        const prompt = localStorage.getItem("zetavault_prompt");
        const actions = localStorage.getItem("zetavault_actions");
        
        console.log("📥 Loading from localStorage:");
        console.log("Prompt:", prompt);
        console.log("Actions:", actions);
        
        if (prompt) {
            setUserPrompt(prompt);
        }
        
        if (actions) {
            try {
                const parsedActionsData = JSON.parse(actions);
                console.log("📊 Parsed actions data:", parsedActionsData);
                
                // Ensure it's always an array and not undefined
                if (Array.isArray(parsedActionsData)) {
                    console.log(`✅ Setting ${parsedActionsData.length} actions`);
                    setParsedActions(parsedActionsData);
                } else if (parsedActionsData && typeof parsedActionsData === 'object') {
                    // If it's a single object, wrap in array
                    console.log("🔧 Converting single action to array");
                    setParsedActions([parsedActionsData]);
                } else {
                    console.warn("⚠️ Invalid parsed actions format:", parsedActionsData);
                    setParsedActions([]);
                }
            } catch (e) {
                console.error("❌ Error parsing stored actions:", e);
                setParsedActions([]);
                setError("Failed to load stored actions. Please go back and submit a new prompt.");
            }
        } else {
            console.log("📝 No actions found in localStorage");
            setParsedActions([]);
        }
    }, []);

    const executeActions = async () => {
        try {
            console.log("🚀 Starting execution...");
            console.log("Connected:", isConnected);
            console.log("Parsed actions:", parsedActions);
            console.log("Actions length:", parsedActions?.length);

            if (!isConnected) {
                setError("Please connect your wallet first");
                return;
            }

            // CRITICAL: Validate parsedActions before proceeding
            if (!parsedActions || !Array.isArray(parsedActions) || parsedActions.length === 0) {
                console.error("❌ Invalid parsedActions:", parsedActions);
                setError("No valid actions to execute. Please go back and submit a prompt.");
                return;
            }

            console.log(`✅ About to execute ${parsedActions.length} actions`);

            setExecutionStatus("executing");
            setError("");

            // For demo, we'll execute on ZetaChain Athens (7001)
            const targetChainId = 7001;
            
            // Check if we need to switch chains
            if (chainId !== targetChainId) {
                console.log(`🔄 Switching from chain ${chainId} to ${targetChainId}`);
                setExecutionStatus("switching_chain");
                await switchChain({ chainId: targetChainId });
                // Wait a bit for chain switch
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            setExecutionStatus("executing");
            
            // Execute the actions with additional validation
            console.log("📋 Final actions check before execution:", parsedActions);
            
            const result = await executeActionsWithWagmi(parsedActions, targetChainId);
            
            setTxHash(result.hash);
            setExecutionStatus("completed");
            
            console.log("✅ Transaction successful:", result);
            
        } catch (err) {
            console.error("❌ Execution error:", err);
            setError(err.message || "Transaction failed");
            setExecutionStatus("error");
        }
    };

    const resetExecution = () => {
        setExecutionStatus("idle");
        setCurrentStep(0);
        setIsPaused(false);
        setTxHash("");
        setError("");
    };

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
        [setEdges]
    );

    // Safe getter for actions count to prevent undefined errors
    const getActionsCount = () => {
        return parsedActions && Array.isArray(parsedActions) ? parsedActions.length : 0;
    };

    // Safe getter for target chains count
    const getTargetChainsCount = () => {
        if (!parsedActions || !Array.isArray(parsedActions)) return 0;
        try {
            return new Set(parsedActions.map(a => a?.targetChainId).filter(id => id !== undefined)).size;
        } catch (error) {
            console.warn("Error counting target chains:", error);
            return 0;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Grid Background */}
            <div className="fixed inset-0 z-0">
                <GridBackgroundDemo />
            </div>

            {/* Header */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-2">
                <div className="flex items-center justify-between">
                    <Link href="/" className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all duration-300">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Back to Home</span>
                    </Link>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-300 via-white to-gray-300 bg-clip-text text-transparent">
                            Execute Cross-Chain Actions
                        </h1>
                        <p className="text-gray-400 mt-1">ZetaChain powered execution</p>
                    </div>
                </div>
            </div>

            {/* Main Content - Stacked Layout */}
            <style jsx global>{`
              .bento-section {
                --glow-x: 50%;
                --glow-y: 50%;
                --glow-intensity: 0;
                --glow-radius: 200px;
                --glow-color: 132, 0, 255;
                --border-color: #392e4e;
                --background-dark: #060010;
                --white: hsl(0, 0%, 100%);
                --purple-primary: rgba(132, 0, 255, 1);
                --purple-glow: rgba(132, 0, 255, 0.2);
                --purple-border: rgba(132, 0, 255, 0.8);
              }
              .card--border-glow::after {
                content: '';
                position: absolute;
                inset: 0;
                padding: 6px;
                background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
                    rgba(132,0,255, calc(var(--glow-intensity) * 0.8)) 0%,
                    rgba(132,0,255, calc(var(--glow-intensity) * 0.4)) 30%,
                    transparent 60%);
                border-radius: inherit;
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask-composite: subtract;
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 1;
              }
              .card--border-glow:hover::after {
                opacity: 1;
              }

              .particle::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: rgba(132,0,255, 0.2);
                border-radius: 50%;
                z-index: -1;
              }
              .particle-container:hover {
                box-shadow: 0 4px 20px rgba(46, 24, 78, 0.2), 0 0 30px rgba(132,0,255, 0.2);
              }
              .text-clamp-1 {
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 1;
                line-clamp: 1;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .text-clamp-2 {
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            `}</style>
            <div className="relative z-10 max-w-7xl mx-auto px-6 pb-8 flex flex-col">
                {/* Top Row: Workflow Visualization (left) and Wallet Status (right) */}
                <div className="bento-section flex flex-col md:flex-row mb-8">
                    {/* Workflow Visualization */}
                    <div className="flex-1">
                        <div className="card card--border-glow relative bg-gradient-to-br from-black/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-[350px] flex-1 flex flex-col">
                            <div className="absolute top-4 left-6 z-10">
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    Workflow Visualization
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Interactive execution flow
                                </p>
                            </div>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                fitView
                                className="rounded-2xl"
                                style={{ background: "transparent" }}
                            >
                                <Controls
                                    style={{
                                        background: "rgba(0, 0, 0, 0.8)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        borderRadius: "8px",
                                    }}
                                />
                            </ReactFlow>
                        </div>
                    </div>
                    {/* Wallet Status and Execution Controls */}
                    <div className="md:w-80 md:max-w-xs md:ml-6 mt-8 md:mt-0 flex flex-col">
                        {/* Wallet Status */}
                        <div className="card card--border-glow bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col justify-center h-full">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Wallet className="w-6 h-6 text-blue-400" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Wallet Status</h3>
                                        {isConnected ? (
                                            <p className="text-green-400">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                                        ) : (
                                            <p className="text-red-400">Not connected</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Current Chain</p>
                                    <p className="text-white font-medium">Chain ID: {chainId}</p>
                                </div>
                            </div>
                        </div>
                        {/* Execution Controls */}
                        <div className="card card--border-glow mt-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Execution Controls</h2>
                                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
                                    executionStatus === 'completed' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                                    executionStatus === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                                    executionStatus === 'executing' || executionStatus === 'switching_chain' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                                    'bg-gray-500/20 border-gray-500/30 text-gray-400'
                                }`}>
                                    {executionStatus === 'executing' || executionStatus === 'switching_chain' ? (
                                        <Zap className="w-5 h-5 animate-pulse" />
                                    ) : executionStatus === 'completed' ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : executionStatus === 'error' ? (
                                        <AlertTriangle className="w-5 h-5" />
                                    ) : (
                                        <Play className="w-5 h-5" />
                                    )}
                                    <span className="font-semibold capitalize">
                                        {executionStatus === 'switching_chain' ? 'Switching Chain' : executionStatus}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={executeActions}
                                    disabled={!isConnected || getActionsCount() === 0 || executionStatus === 'executing' || executionStatus === 'switching_chain'}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-gray-600 via-white to-gray-600 text-black px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play className="w-4 h-4" />
                                    <span className="font-medium">Execute</span>
                                </button>
                                <button
                                    onClick={resetExecution}
                                    className="flex items-center space-x-2 bg-gray-500/20 border border-gray-500/30 px-6 py-3 rounded-xl hover:bg-gray-500/30 transition-all duration-300"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span className="font-medium">Reset</span>
                                </button>
                            </div>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                                    <p className="text-red-400">{error}</p>
                                </div>
                            )}
                            {txHash && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                                    <p className="text-green-400 font-medium">Transaction Hash:</p>
                                    <p className="text-green-300 font-mono text-sm break-all">{txHash}</p>
                                    <a 
                                        href={`https://zetachain-athens.blockscout.com/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 underline text-sm"
                                    >
                                        View on Explorer →
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Prompt & Actions */}
                <div className="mb-8">
                    {userPrompt ? (
                        <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col">
                            <h2 className="text-lg font-semibold text-white mb-3">Your Request</h2>
                            <p className="text-gray-300 italic text-lg mb-4 break-all">"{userPrompt}"</p>
                            {getActionsCount() > 0 && (
                                <div>
                                    <h3 className="text-md font-semibold text-white mb-3">Parsed Actions:</h3>
                                    <div className="space-y-2">
                                        {parsedActions.map((action, index) => (
                                            <div key={index} className="bg-black/20 rounded-lg p-3 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white font-medium break-all">{action?.actionType || 'unknown'}</span>
                                                    <span className="text-gray-400 break-all">Chain: {action?.targetChainId || 'unknown'}</span>
                                                </div>
                                                <div className="text-gray-300 mt-1 break-all">
                                                    Amount: {action?.amount || '0'} wei → {action?.recipient?.slice(0, 6) || 'unknown'}...
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {getActionsCount() === 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                    <p className="text-yellow-400">No actions parsed. Please go back and submit a prompt.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 flex flex-col justify-center">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-blue-400 mb-2">No Request Found</h2>
                                <p className="text-blue-300 mb-4">Please go back to the home page and submit a prompt first.</p>
                                <Link 
                                    href="/" 
                                    className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all duration-300"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Go Back Home</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Summary */}
                {executionStatus === "completed" && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-white/10 via-gray-500/10 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 flex-1 flex flex-col justify-center">
                                                                <div className="flex items-center space-x-4 mb-6">
                                        <CheckCircle className="w-12 h-12 text-white" />
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">Execution Successful!</h2>
                                            <p className="text-gray-300">Your cross-chain actions have been executed</p>
                                        </div>
                                    </div>
                            <div className="grid md:grid-cols-3 gap-6 text-sm">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-gray-400 mb-1">Actions Executed</p>
                                    <p className="text-white font-bold text-2xl">{getActionsCount()}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-gray-400 mb-1">Target Chains</p>
                                    <p className="text-white font-bold text-2xl">
                                        {getTargetChainsCount()}
                                    </p>
                                </div>
                                                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <p className="text-gray-400 mb-1">Status</p>
                                        <p className="text-white font-bold text-2xl">Success</p>
                                    </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
