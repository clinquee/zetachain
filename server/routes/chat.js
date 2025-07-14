const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Contract addresses from deployed contracts
const CONTRACT_ADDRESSES = {
    ZETA_VAULT_EXECUTOR: "0x5630263676cCB2cE59Bebb8084d36d77136b8d86",
    TEST_TOKEN: "0x5547Bbf729Fee6027d1cD77f512b0d05F8Bb2c1D",
    ZETA_NFT: "0xc47bA4fA2B3713Fe1B1d62b5aF18B649aD36329A",
    OWNER: "0x71AfE44200A819171a0687b1026E8d4424472Ff8",
};

// Enhanced system prompt with more examples
const SYSTEM_PROMPT = `
You are an expert blockchain transaction parser. Convert natural language requests into structured JSON actions.

Supported action types:
- "transfer": Send tokens/ETH to an address
- "bridge": Move tokens between chains
- "swap": Exchange one token for another
- "stake": Stake tokens for rewards
- "mint": Create NFTs
- "approve": Approve token spending
- "liquidity": Provide liquidity to pools

Common chain IDs:
- Ethereum: 1
- Polygon: 137
- Polygon Mumbai: 80001
- BSC: 56
- Arbitrum: 42161
- Optimism: 10
- Avalanche: 43114

Deployed Contract Addresses (use these when relevant):
- ZetaVaultExecutor: "${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"
- TestToken (ERC20): "${CONTRACT_ADDRESSES.TEST_TOKEN}"
- ZetaNFT (ERC721): "${CONTRACT_ADDRESSES.ZETA_NFT}"
- Owner Address: "${CONTRACT_ADDRESSES.OWNER}"

Token addresses (examples):
- ETH: "0x0000000000000000000000000000000000000000"
- USDC (Ethereum): "0xA0b86a33E6441ce2e1F4d76e5B76F5B35D3c8bbD"
- USDT (Ethereum): "0xdAC17F958D2ee523a2206206994597C13D831ec7"
- MATIC (Polygon): "0x0000000000000000000000000000000000001010"
- TestToken (Deployed): "${CONTRACT_ADDRESSES.TEST_TOKEN}"

Important Notes:
- When user mentions "test token", "TestToken", or similar, use the deployed TestToken address: ${CONTRACT_ADDRESSES.TEST_TOKEN}
- When user mentions NFT minting or ZetaNFT, use the deployed ZetaNFT address: ${CONTRACT_ADDRESSES.ZETA_NFT}
- All transactions should be executed through the ZetaVaultExecutor contract: ${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}
- For NFT actions, set tokenId to appropriate value (0 for new mint, specific ID for transfers)
- Convert amounts to wei (multiply by 10^18 for most tokens)
- If recipient is missing, use the owner address: ${CONTRACT_ADDRESSES.OWNER}

Examples:
User: "Transfer 5 TestToken to 0xabc123"
Response: [{"actionType":"transfer","recipient":"0xabc123","amount":"5000000000000000000","tokenAddress":"${CONTRACT_ADDRESSES.TEST_TOKEN}","targetChainId":137,"metadataURI":"","tokenId":0,"contractAddress":"${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"}]

User: "Send 0.001 ETH to owner"
Response: [{"actionType":"transfer","recipient":"${CONTRACT_ADDRESSES.OWNER}","amount":"1000000000000000","tokenAddress":"0x0000000000000000000000000000000000000000","targetChainId":1,"metadataURI":"","tokenId":0,"contractAddress":"${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"}]

User: "Mint NFT"
Response: [{"actionType":"mint","recipient":"${CONTRACT_ADDRESSES.OWNER}","amount":"1","tokenAddress":"${CONTRACT_ADDRESSES.ZETA_NFT}","targetChainId":137,"metadataURI":"","tokenId":0,"contractAddress":"${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"}]

Response format should be a JSON array of actions. Always return at least one action, never an empty array.
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

// Function to generate fallback action based on prompt
const generateFallbackAction = (prompt) => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Default fallback action
    let fallbackAction = {
        actionType: "transfer",
        recipient: CONTRACT_ADDRESSES.OWNER,
        amount: "1000000000000000000", // 1 token
        tokenAddress: "0x0000000000000000000000000000000000000000", // ETH
        targetChainId: 137,
        metadataURI: "",
        tokenId: 0,
        contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
    };

    // Try to extract amount
    const amountMatch = prompt.match(/(\d+\.?\d*)/);
    if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        fallbackAction.amount = (amount * Math.pow(10, 18)).toString();
    }

    // Try to extract recipient address
    const addressMatch = prompt.match(/0x[a-fA-F0-9]{40}/);
    if (addressMatch) {
        fallbackAction.recipient = addressMatch[0];
    }

    // Determine token type
    if (lowerPrompt.includes('test') || lowerPrompt.includes('testtoken')) {
        fallbackAction.tokenAddress = CONTRACT_ADDRESSES.TEST_TOKEN;
    } else if (lowerPrompt.includes('nft') || lowerPrompt.includes('mint')) {
        fallbackAction.actionType = "mint";
        fallbackAction.tokenAddress = CONTRACT_ADDRESSES.ZETA_NFT;
        fallbackAction.amount = "1";
    }

    // Determine chain
    if (lowerPrompt.includes('ethereum') || lowerPrompt.includes('eth')) {
        fallbackAction.targetChainId = 1;
    } else if (lowerPrompt.includes('polygon') || lowerPrompt.includes('matic')) {
        fallbackAction.targetChainId = 137;
    }

    return fallbackAction;
};

router.post("/parse", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // Check if prompt is too short or incomplete
        if (prompt.trim().length < 5) {
            return res.status(400).json({ 
                error: "Prompt too short", 
                details: "Please provide a more detailed request" 
            });
        }

        // Initialize Gemini 1.5 Flash model
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });

        // Create the full prompt with explicit instructions
        const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: "${prompt}"\n\nPARSE THIS REQUEST AND RETURN A VALID JSON ARRAY:`;

        console.log("Processing prompt with Gemini 1.5 Flash:", prompt);

        // Generate response with retry logic
        const result = await retryWithBackoff(async () => {
            return await model.generateContent(fullPrompt);
        }, 3, 2000);

        const response = await result.response;
        let jsonResponse = response.text();

        console.log("Raw AI response:", jsonResponse);

        // Clean up response more thoroughly
        jsonResponse = jsonResponse
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .replace(/^[^[\{]*/, "")
            .replace(/[^}\]]*$/, "")
            .trim();

        console.log("Cleaned AI response:", jsonResponse);

        // Parse JSON to validate
        let parsedActions;
        try {
            parsedActions = JSON.parse(jsonResponse);
        } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            console.error("Raw response:", jsonResponse);

            // Try to extract JSON from response
            const jsonMatch = jsonResponse.match(/\[.*\]/s);
            if (jsonMatch) {
                try {
                    parsedActions = JSON.parse(jsonMatch[0]);
                } catch (retryError) {
                    console.log("Using fallback action due to parsing error");
                    parsedActions = [generateFallbackAction(prompt)];
                }
            } else {
                console.log("Using fallback action - no JSON found");
                parsedActions = [generateFallbackAction(prompt)];
            }
        }

        // Validate that it's an array and not empty
        if (!Array.isArray(parsedActions) || parsedActions.length === 0) {
            console.log("Using fallback action - empty or invalid response");
            parsedActions = [generateFallbackAction(prompt)];
        }

        // Validate and enhance each action
        const validatedActions = parsedActions.map((action, index) => {
            // Fill in missing required fields
            const validatedAction = {
                actionType: action.actionType || "transfer",
                recipient: action.recipient || CONTRACT_ADDRESSES.OWNER,
                amount: action.amount || "1000000000000000000",
                tokenAddress: action.tokenAddress || "0x0000000000000000000000000000000000000000",
                targetChainId: parseInt(action.targetChainId) || 137,
                metadataURI: action.metadataURI || "",
                tokenId: action.tokenId || 0,
                contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            };

            // Handle specific token references
            if (prompt.toLowerCase().includes("test token") || prompt.toLowerCase().includes("testtoken")) {
                validatedAction.tokenAddress = CONTRACT_ADDRESSES.TEST_TOKEN;
            }

            if (validatedAction.actionType === "mint") {
                validatedAction.tokenAddress = CONTRACT_ADDRESSES.ZETA_NFT;
                validatedAction.amount = "1";
            }

            return validatedAction;
        });

        console.log("Validated actions:", validatedActions);

        res.json({
            success: true,
            actions: validatedActions,
            originalPrompt: prompt,
            contractAddresses: CONTRACT_ADDRESSES,
            model: "gemini-1.5-flash",
            fallbackUsed: parsedActions.length === 1 && parsedActions[0].actionType === "transfer" && !jsonResponse.includes("actionType")
        });
    } catch (error) {
        console.error("Chat parsing error:", error);
        
        // Handle specific error types
        if (error.message.includes('503') || error.message.includes('overloaded')) {
            return res.status(503).json({
                error: "AI service temporarily unavailable",
                details: "The AI service is currently overloaded. Please try again in a few moments.",
                retryAfter: 5000
            });
        }
        
        if (error.message.includes('429') || error.message.includes('quota')) {
            return res.status(429).json({
                error: "Rate limit exceeded",
                details: "API quota exceeded. Please try again later.",
                retryAfter: 60000
            });
        }
        
        // Return fallback action even on error
        const fallbackAction = generateFallbackAction(req.body.prompt || "transfer 1 ETH");
        res.json({
            success: true,
            actions: [fallbackAction],
            originalPrompt: req.body.prompt || "",
            contractAddresses: CONTRACT_ADDRESSES,
            model: "gemini-1.5-flash",
            fallbackUsed: true,
            error: "Used fallback due to AI error"
        });
    }
});

// GET /api/chat/contracts
router.get("/contracts", (req, res) => {
    res.json({
        success: true,
        contracts: CONTRACT_ADDRESSES,
    });
});

// GET /api/chat/examples
router.get("/examples", (req, res) => {
    const examples = [
        {
            prompt: "Transfer 5 TestToken to 0x71AfE44200A819171a0687b1026E8d4424472Ff8",
            expectedOutput: [
                {
                    actionType: "transfer",
                    recipient: "0x71AfE44200A819171a0687b1026E8d4424472Ff8",
                    amount: "5000000000000000000",
                    tokenAddress: CONTRACT_ADDRESSES.TEST_TOKEN,
                    targetChainId: 137,
                    metadataURI: "",
                    tokenId: 0,
                    contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
                },
            ],
        },
        {
            prompt: "Send 0.001 ETH to owner",
            expectedOutput: [
                {
                    actionType: "transfer",
                    recipient: CONTRACT_ADDRESSES.OWNER,
                    amount: "1000000000000000",
                    tokenAddress: "0x0000000000000000000000000000000000000000",
                    targetChainId: 1,
                    metadataURI: "",
                    tokenId: 0,
                    contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
                },
            ],
        },
        {
            prompt: "Mint a ZetaNFT",
            expectedOutput: [
                {
                    actionType: "mint",
                    recipient: CONTRACT_ADDRESSES.OWNER,
                    amount: "1",
                    tokenAddress: CONTRACT_ADDRESSES.ZETA_NFT,
                    targetChainId: 137,
                    metadataURI: "",
                    tokenId: 0,
                    contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
                },
            ],
        },
    ];

    res.json({ examples, contractAddresses: CONTRACT_ADDRESSES });
});

module.exports = router;
