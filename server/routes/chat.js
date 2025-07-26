const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
// const OpenAI = require('openai');
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

// Initialize AI services
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// Contract addresses from environment variables
const CONTRACT_ADDRESSES = {
    ZETA_VAULT_EXECUTOR: process.env.ZETA_VAULT_EXECUTOR || "0xCA7c84C6Ca61f48fA04d7dBbA1649f269962997c",
    ZETA_NFT: process.env.ZETA_NFT || "0xAdB17C7D41c065C0c57D69c7B4BC97A6fcD4D117",
    GATEWAY: process.env.GATEWAY || "0x6c533f7fe93fae114d0954697069df33c9b74fd7",
    OWNER: process.env.OWNER || "0x71AfE44200A819171a0687b1026E8d4424472Ff8",
};

// ZRC20 Token addresses for proper token support
const ZRC20_TOKENS = {
    // ETH tokens for different chains
    ETH_SEPOLIA: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0', // sETH.SEPOLIA
    ETH_ARBITRUM: '0x1de70f3e971B62A0707dA18100392af14f7fB677', // ETH.ARBSEP
    ETH_BASE: '0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD', // ETH.BASESEPOLIA
    
    // USDC tokens for different chains
    USDC_SEPOLIA: '0xcC683A782f4B30c138787CB5576a86AF66fdc31d', // USDC.SEPOLIA
    USDC_ARBITRUM: '0x4bC32034caCcc9B7e02536945eDbC286bACbA073', // USDC.ARBSEP
    USDC_POLYGON: '0xe573a6e11f8506620F123DBF930222163D46BCB6', // USDC.AMOY
    USDC_BSC: '0x7c8dDa80bbBE1254a7aACf3219EBe1481c6E01d7', // USDC.BSC
    USDC_AVALANCHE: '0x8344d6f84d26f998fa070BbEA6D2E15E359e2641', // USDC.FUJI
    
    // Native gas tokens
    BNB_BSC: '0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891', // BNB.BSC
    AVAX_FUJI: '0xEe9CC614D03e7Dbe994b514079f4914a605B4719', // AVAX.FUJI
    POL_AMOY: '0x777915D031d1e8144c90D025C594b3b8Bf07a08d', // POL.AMOY
    
    // Default token (most supported)
    DEFAULT: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0', // sETH.SEPOLIA
};

// Chain ID to token mapping for fallback
const CHAIN_TO_TOKEN = {
    7001: ZRC20_TOKENS.ETH_SEPOLIA,     // ZetaChain Athens
    11155111: ZRC20_TOKENS.ETH_SEPOLIA, // Ethereum Sepolia
    421614: ZRC20_TOKENS.ETH_ARBITRUM,  // Arbitrum Sepolia
    84532: ZRC20_TOKENS.ETH_BASE,       // Base Sepolia
    80002: ZRC20_TOKENS.USDC_POLYGON,   // Polygon Amoy (use USDC)
    97: ZRC20_TOKENS.BNB_BSC,           // BSC Testnet
    43113: ZRC20_TOKENS.AVAX_FUJI,      // Avalanche Fuji
};

// Enhanced system prompt with correct ZRC20 token addresses
const SYSTEM_PROMPT = `
You are an expert blockchain transaction parser for ZetaChain. Convert natural language requests into structured JSON actions.

Supported action types:
- "transfer": Send tokens/ETH to an address (same chain)
- "bridge": Move tokens between chains (cross-chain) - USE THIS for diversification
- "crossChainTransfer": Alternative cross-chain transfer
- "mintNFT": Create NFTs
- "transferNFT": Transfer existing NFTs
- "approve": Approve token spending
- "deposit": Deposit tokens to vault
- "withdraw": Withdraw tokens from vault

Chain IDs (IMPORTANT - use these exact IDs):
- ZetaChain Athens: 7001 (PRIMARY CHAIN)
- Ethereum Sepolia: 11155111
- Polygon Amoy: 80002  
- Arbitrum Sepolia: 421614
- Base Sepolia: 84532
- Avalanche Fuji: 43113

Deployed Contract Addresses:
- ZetaVaultExecutor: "${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"
- ZetaNFT: "${CONTRACT_ADDRESSES.ZETA_NFT}"
- Gateway: "${CONTRACT_ADDRESSES.GATEWAY}"
- Default Recipient: "${CONTRACT_ADDRESSES.OWNER}"

ZRC20 Token Addresses (ZetaChain Testnet) - USE THESE ONLY:
- sETH.SEPOLIA: "${ZRC20_TOKENS.ETH_SEPOLIA}" (for ETH on Sepolia)
- ETH.ARBSEP: "${ZRC20_TOKENS.ETH_ARBITRUM}" (for ETH on Arbitrum)
- ETH.BASESEPOLIA: "${ZRC20_TOKENS.ETH_BASE}" (for ETH on Base)
- USDC.SEPOLIA: "${ZRC20_TOKENS.USDC_SEPOLIA}" (for USDC on Sepolia)
- USDC.ARBSEP: "${ZRC20_TOKENS.USDC_ARBITRUM}" (for USDC on Arbitrum)
- USDC.AMOY: "${ZRC20_TOKENS.USDC_POLYGON}" (for USDC on Polygon)
- BNB.BSC: "${ZRC20_TOKENS.BNB_BSC}" (for BNB on BSC)
- AVAX.FUJI: "${ZRC20_TOKENS.AVAX_FUJI}" (for AVAX on Avalanche)

CRITICAL RULES:
1. NEVER use "0x0000000000000000000000000000000000000000" - it will fail!
2. ALWAYS use proper ZRC20 token addresses from the list above
3. For ETH transfers to Sepolia: use "${ZRC20_TOKENS.ETH_SEPOLIA}"
4. For ETH transfers to Arbitrum: use "${ZRC20_TOKENS.ETH_ARBITRUM}"
5. For ETH transfers to Base: use "${ZRC20_TOKENS.ETH_BASE}"
6. ALL amounts must be in WEI (multiply by 10^18 for ETH amounts)
7. For cross-chain operations, use "bridge" or "crossChainTransfer" 
8. Default to ZetaChain (7001) if no target chain specified
9. For NFTs, use ZetaNFT contract address
10. ALWAYS include contractAddress field

Examples:

User: "transfer 0.001 ETH to owner"
Response: [{"actionType":"transfer","recipient":"${CONTRACT_ADDRESSES.OWNER}","amount":"1000000000000000","tokenAddress":"${ZRC20_TOKENS.ETH_SEPOLIA}","targetChainId":7001,"metadataURI":"","tokenId":0,"contractAddress":"${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"}]

User: "mint NFT with metadata https://example.com/1.json"
Response: [{"actionType":"mintNFT","recipient":"${CONTRACT_ADDRESSES.OWNER}","amount":"0","tokenAddress":"${CONTRACT_ADDRESSES.ZETA_NFT}","targetChainId":7001,"metadataURI":"https://example.com/1.json","tokenId":0,"contractAddress":"${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"}]

User: "bridge 0.05 ETH to polygon amoy"
Response: [{"actionType":"bridge","recipient":"${CONTRACT_ADDRESSES.OWNER}","amount":"50000000000000000","tokenAddress":"${ZRC20_TOKENS.ETH_SEPOLIA}","targetChainId":80002,"metadataURI":"","tokenId":0,"contractAddress":"${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"}]

User: "send 10 USDC to arbitrum"
Response: [{"actionType":"bridge","recipient":"${CONTRACT_ADDRESSES.OWNER}","amount":"10000000","tokenAddress":"${ZRC20_TOKENS.USDC_ARBITRUM}","targetChainId":421614,"metadataURI":"","tokenId":0,"contractAddress":"${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"}]

ALWAYS return valid JSON array format with proper ZRC20 token addresses.
`;

// Retry utility function
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            console.log(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Check if it's a retryable error
            if (error.message.includes('503') || 
                error.message.includes('overloaded') ||
                error.message.includes('Service Unavailable')) {
                
                const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Don't retry non-retryable errors
            }
        }
    }
};

// Helper function to get proper token address based on context
const getTokenAddress = (prompt, targetChainId) => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for specific token mentions
    if (lowerPrompt.includes('usdc')) {
        switch (targetChainId) {
            case 11155111: return ZRC20_TOKENS.USDC_SEPOLIA;
            case 421614: return ZRC20_TOKENS.USDC_ARBITRUM;
            case 80002: return ZRC20_TOKENS.USDC_POLYGON;
            case 97: return ZRC20_TOKENS.USDC_BSC;
            case 43113: return ZRC20_TOKENS.USDC_AVALANCHE;
            default: return ZRC20_TOKENS.USDC_SEPOLIA;
        }
    }
    
    if (lowerPrompt.includes('bnb')) {
        return ZRC20_TOKENS.BNB_BSC;
    }
    
    if (lowerPrompt.includes('avax')) {
        return ZRC20_TOKENS.AVAX_FUJI;
    }
    
    // Default to ETH tokens based on chain
    return CHAIN_TO_TOKEN[targetChainId] || ZRC20_TOKENS.DEFAULT;
};

// Helper function to detect target chain ID from prompt
const getTargetChainId = (prompt) => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('sepolia') || lowerPrompt.includes('ethereum')) {
        return 11155111;
    }
    if (lowerPrompt.includes('polygon') || lowerPrompt.includes('amoy')) {
        return 80002;
    }
    if (lowerPrompt.includes('arbitrum') || lowerPrompt.includes('arb')) {
        return 421614;
    }
    if (lowerPrompt.includes('base')) {
        return 84532;
    }
    if (lowerPrompt.includes('avalanche') || lowerPrompt.includes('fuji')) {
        return 43113;
    }
    if (lowerPrompt.includes('bsc') || lowerPrompt.includes('binance')) {
        return 97;
    }
    
    // Default to ZetaChain
    return 7001;
};

// Function to call Gemini AI
const callGeminiAI = async (prompt) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp", // Updated to Gemini 2.5 Pro
        generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        },
    });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: "${prompt}"\n\nPARSE THIS REQUEST AND RETURN A VALID JSON ARRAY:`;
    
    console.log("🤖 Trying Gemini 2.5 Pro...");
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return {
        text: response.text(),
        provider: 'gemini'
    };
};

// Function to call OpenAI as backup (COMMENTED OUT)
/*
const callOpenAI = async (prompt) => {
    console.log("🤖 Trying OpenAI as backup...");
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using GPT-4o-mini for cost efficiency
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "user",
                content: `Parse this request and return a valid JSON array: "${prompt}"`
            }
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: "json_object" }
    });

    // OpenAI returns an object, we need to wrap it in an array if it's not already
    let responseText = response.choices[0].message.content;
    
    // Try to parse and ensure it's an array
    try {
        const parsed = JSON.parse(responseText);
        if (!Array.isArray(parsed)) {
            // If it's an object, wrap it in an array
            responseText = JSON.stringify([parsed]);
        }
    } catch (e) {
        // If parsing fails, assume it's already a string representation of an array
    }

    return {
        text: responseText,
        provider: 'openai'
    };
};
*/

// Function to clean and parse AI response
const cleanAndParseResponse = (jsonResponse, provider) => {
    console.log(`Raw ${provider} response:`, jsonResponse);

    // Clean up response more thoroughly
    let cleaned = jsonResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^[^[\{]*/, "")
        .replace(/[^}\]]*$/, "")
        .trim();

    console.log(`Cleaned ${provider} response:`, cleaned);

    // Parse JSON to validate
    let parsedActions;
    try {
        parsedActions = JSON.parse(cleaned);
    } catch (parseError) {
        console.error(`${provider} JSON parsing error:`, parseError);
        
        // Try to extract JSON from response
        const jsonMatch = cleaned.match(/\[.*\]/s) || cleaned.match(/\{.*\}/s);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                parsedActions = Array.isArray(parsed) ? parsed : [parsed];
            } catch (retryError) {
                console.error(`${provider} retry parsing failed:`, retryError);
                throw new Error(`Failed to parse ${provider} response`);
            }
        } else {
            throw new Error(`No valid JSON found in ${provider} response`);
        }
    }

    // Ensure it's an array
    if (!Array.isArray(parsedActions)) {
        parsedActions = [parsedActions];
    }

    return parsedActions;
};

// Updated fallback action generator with proper ZRC20 tokens
const generateFallbackAction = (prompt) => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Detect target chain from prompt
    const targetChainId = getTargetChainId(prompt);
    
    // Get proper token address based on prompt and chain
    const tokenAddress = getTokenAddress(prompt, targetChainId);
    
    console.log(`🔧 Fallback: Chain ${targetChainId}, Token ${tokenAddress}`);
    
    let fallbackAction = {
        actionType: "transfer",
        recipient: CONTRACT_ADDRESSES.OWNER,
        amount: "1000000000000000000", // 1 ETH in wei
        tokenAddress: tokenAddress, // Using proper ZRC20 token
        targetChainId: targetChainId,
        metadataURI: "",
        tokenId: 0,
        contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
    };

    // Extract amount from prompt
    const amountMatch = prompt.match(/(\d+\.?\d*)/);
    if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        
        // Handle USDC (6 decimals) vs ETH (18 decimals)
        if (lowerPrompt.includes('usdc')) {
            fallbackAction.amount = (amount * Math.pow(10, 6)).toString();
        } else {
            fallbackAction.amount = (amount * Math.pow(10, 18)).toString();
        }
    }

    // Detect cross-chain operations
    if (lowerPrompt.includes('bridge') || lowerPrompt.includes('cross') || 
        lowerPrompt.includes('polygon') || lowerPrompt.includes('arbitrum') ||
        lowerPrompt.includes('base') || lowerPrompt.includes('avalanche') ||
        lowerPrompt.includes('bsc') || targetChainId !== 7001) {
        fallbackAction.actionType = "bridge";
    }

    // Handle NFT actions
    if (lowerPrompt.includes('nft') || lowerPrompt.includes('mint')) {
        fallbackAction.actionType = "mintNFT";
        fallbackAction.tokenAddress = CONTRACT_ADDRESSES.ZETA_NFT;
        fallbackAction.amount = "0";
        fallbackAction.targetChainId = 7001; // NFTs on ZetaChain
        
        // Extract metadata URI if present
        const uriMatch = prompt.match(/(https?:\/\/[^\s]+|ipfs:\/\/[^\s]+)/);
        if (uriMatch) {
            fallbackAction.metadataURI = uriMatch[1];
        }
    }

    console.log(`✅ Generated fallback action:`, fallbackAction);
    return fallbackAction;
};

router.post("/parse", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (prompt.trim().length < 5) {
            return res.status(400).json({ 
                error: "Prompt too short", 
                details: "Please provide a more detailed request" 
            });
        }

        let parsedActions;
        let aiProvider = 'fallback';
        let aiError = null;

        // Try Gemini 2.5 Pro
        try {
            console.log("🚀 Processing prompt with Gemini 2.5 Pro:", prompt);
            
            const geminiResult = await retryWithBackoff(async () => {
                return await callGeminiAI(prompt);
            }, 3, 2000); // Increased retries since no OpenAI fallback

            parsedActions = cleanAndParseResponse(geminiResult.text, 'gemini');
            aiProvider = 'gemini';
            
        } catch (geminiError) {
            console.error("❌ Gemini 2.5 Pro failed:", geminiError.message);
            aiError = geminiError.message;
            
            // No OpenAI fallback - go directly to fallback action generator
            console.log("🔧 Using fallback action generator...");
            parsedActions = [generateFallbackAction(prompt)];
            aiProvider = 'fallback';
            aiError = `Gemini: ${geminiError.message}`;
        }

        // Validate that we have valid actions
        if (!Array.isArray(parsedActions) || parsedActions.length === 0) {
            console.log("📝 Invalid AI response, using fallback");
            parsedActions = [generateFallbackAction(prompt)];
            aiProvider = 'fallback';
        }

        // Validate and enhance each action
        const validatedActions = parsedActions.map((action) => {
            // Get target chain ID
            const targetChainId = parseInt(action.targetChainId) || getTargetChainId(prompt);
            
            const validatedAction = {
                actionType: action.actionType || "transfer",
                recipient: action.recipient || CONTRACT_ADDRESSES.OWNER,
                amount: action.amount || "1000000000000000000",
                tokenAddress: action.tokenAddress || getTokenAddress(prompt, targetChainId), // Use proper token
                targetChainId: targetChainId,
                metadataURI: action.metadataURI || "",
                tokenId: action.tokenId || 0,
                contractAddress: action.contractAddress || CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            };

            // Fix action types
            if (validatedAction.actionType === "mint") {
                validatedAction.actionType = "mintNFT";
                validatedAction.tokenAddress = CONTRACT_ADDRESSES.ZETA_NFT;
                validatedAction.amount = "0";
                validatedAction.targetChainId = 7001; // NFTs on ZetaChain
            }

            // Ensure no zero address is used
            if (validatedAction.tokenAddress === "0x0000000000000000000000000000000000000000") {
                console.warn("⚠️ Detected zero address, replacing with proper ZRC20 token");
                validatedAction.tokenAddress = getTokenAddress(prompt, validatedAction.targetChainId);
            }

            return validatedAction;
        });

        console.log("✅ Final validated actions:", validatedActions);

        res.json({
            success: true,
            actions: validatedActions,
            originalPrompt: prompt,
            contractAddresses: CONTRACT_ADDRESSES,
            zrc20Tokens: ZRC20_TOKENS,
            aiProvider: aiProvider,
            model: aiProvider === 'gemini' ? 'gemini-2.0-flash-exp' : 'fallback',
            fallbackUsed: aiProvider === 'fallback',
            aiError: aiProvider === 'fallback' ? aiError : null
        });

    } catch (error) {
        console.error("💥 Critical error in /parse:", error);
        
        // Always return a fallback action even on critical errors
        const fallbackAction = generateFallbackAction(req.body.prompt || "transfer 1 ETH");
        res.json({
            success: true,
            actions: [fallbackAction],
            originalPrompt: req.body.prompt || "",
            contractAddresses: CONTRACT_ADDRESSES,
            zrc20Tokens: ZRC20_TOKENS,
            aiProvider: 'fallback',
            model: 'fallback',
            fallbackUsed: true,
            error: "Critical error, used fallback action",
            aiError: error.message
        });
    }
});

// GET /api/chat/contracts
router.get("/contracts", (req, res) => {
    res.json({
        success: true,
        contracts: CONTRACT_ADDRESSES,
        zrc20Tokens: ZRC20_TOKENS,
        chainToToken: CHAIN_TO_TOKEN,
    });
});

// GET /api/chat/examples
router.get("/examples", (req, res) => {
    const examples = [
        {
            prompt: "Transfer 0.001 ETH to owner",
            expectedOutput: [{
                actionType: "transfer",
                recipient: CONTRACT_ADDRESSES.OWNER,
                amount: "1000000000000000",
                tokenAddress: ZRC20_TOKENS.ETH_SEPOLIA, // Using proper ZRC20
                targetChainId: 7001,
                metadataURI: "",
                tokenId: 0,
                contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            }],
        },
        {
            prompt: "Mint NFT with metadata ipfs://example",
            expectedOutput: [{
                actionType: "mintNFT",
                recipient: CONTRACT_ADDRESSES.OWNER,
                amount: "0",
                tokenAddress: CONTRACT_ADDRESSES.ZETA_NFT,
                targetChainId: 7001,
                metadataURI: "ipfs://example",
                tokenId: 0,
                contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            }],
        },
        {
            prompt: "Bridge 0.05 ETH to arbitrum",
            expectedOutput: [{
                actionType: "bridge",
                recipient: CONTRACT_ADDRESSES.OWNER,
                amount: "50000000000000000",
                tokenAddress: ZRC20_TOKENS.ETH_ARBITRUM, // Proper Arbitrum ETH token
                targetChainId: 421614,
                metadataURI: "",
                tokenId: 0,
                contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            }],
        },
    ];

    res.json({ 
        examples, 
        contractAddresses: CONTRACT_ADDRESSES,
        zrc20Tokens: ZRC20_TOKENS,
        supportedProviders: ['gemini', 'fallback'],
        primaryProvider: 'gemini',
        backupProvider: 'fallback'
    });
});

// New endpoint to check AI service status
router.get("/status", async (req, res) => {
    const status = {
        gemini: 'unknown',
        // openai: 'unknown', // COMMENTED OUT
        timestamp: new Date().toISOString()
    };

    // Test Gemini 2.5 Pro
    try {
        await callGeminiAI("test");
        status.gemini = 'available';
    } catch (error) {
        status.gemini = 'unavailable';
        status.geminiError = error.message;
    }

    // Test OpenAI (COMMENTED OUT)
    /*
    try {
        await callOpenAI("test");
        status.openai = 'available';
    } catch (error) {
        status.openai = 'unavailable';
        status.openaiError = error.message;
    }
    */

    res.json(status);
});

module.exports = router;
