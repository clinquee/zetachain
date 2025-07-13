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

// Define the system prompt for structured JSON output
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

Convert amounts to wei (multiply by 10^18 for most tokens).

Response format should be a JSON array of actions:
[
  {
    "actionType": "transfer",
    "recipient": "0x...",
    "amount": "5000000000000000000",
    "tokenAddress": "0x...",
    "targetChainId": 137,
    "metadataURI": "",
    "tokenId": 0,
    "contractAddress": "${CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR}"
  }
]

IMPORTANT: Only respond with valid JSON array, no additional text or markdown formatting.
`;

router.post("/parse", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // Initialize Gemini 1.5 Flash model with correct configuration
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        });

        // Create the full prompt with explicit JSON instruction
        const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: "${prompt}"\n\nReturn only a valid JSON array, no other text:`;

        console.log("Processing prompt with Gemini 1.5 Flash:", prompt);

        // Generate response
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let jsonResponse = response.text();

        console.log("Raw AI response:", jsonResponse);

        // Clean up response more thoroughly
        jsonResponse = jsonResponse
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .replace(/^[^[\{]*/, "") // Remove any text before JSON starts
            .replace(/[^}\]]*$/, "") // Remove any text after JSON ends
            .trim();

        console.log("Cleaned AI response:", jsonResponse);

        // Parse JSON to validate
        let parsedActions;
        try {
            parsedActions = JSON.parse(jsonResponse);
        } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            console.error("Raw response:", jsonResponse);

            // Try to extract JSON from response if it's wrapped in text
            const jsonMatch = jsonResponse.match(/\[.*\]/s);
            if (jsonMatch) {
                try {
                    parsedActions = JSON.parse(jsonMatch[0]);
                } catch (retryError) {
                    return res.status(500).json({
                        error: "Failed to parse AI response",
                        details: parseError.message,
                        rawResponse: jsonResponse,
                    });
                }
            } else {
                return res.status(500).json({
                    error: "Failed to parse AI response",
                    details: parseError.message,
                    rawResponse: jsonResponse,
                });
            }
        }

        // Validate that it's an array
        if (!Array.isArray(parsedActions)) {
            return res.status(500).json({
                error: "AI response is not an array",
                response: parsedActions,
            });
        }

        // Validate and enhance each action with contract addresses
        const validatedActions = parsedActions.map((action, index) => {
            const requiredFields = ["actionType", "targetChainId"];
            const missingFields = requiredFields.filter(
                (field) => !action[field]
            );

            if (missingFields.length > 0) {
                throw new Error(
                    `Action ${index} missing required fields: ${missingFields.join(
                        ", "
                    )}`
                );
            }

            // Auto-assign contract addresses based on action type
            let tokenAddress =
                action.tokenAddress ||
                "0x0000000000000000000000000000000000000000";
            let contractAddress = CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR;

            // Handle specific token references
            if (
                action.actionType === "mint" &&
                action.tokenAddress === CONTRACT_ADDRESSES.ZETA_NFT
            ) {
                tokenAddress = CONTRACT_ADDRESSES.ZETA_NFT;
            } else if (
                tokenAddress.toLowerCase().includes("test") ||
                prompt.toLowerCase().includes("test token") ||
                prompt.toLowerCase().includes("testtoken")
            ) {
                tokenAddress = CONTRACT_ADDRESSES.TEST_TOKEN;
            }

            return {
                actionType: action.actionType,
                recipient: action.recipient || "",
                amount: action.amount || "0",
                tokenAddress: tokenAddress,
                targetChainId: parseInt(action.targetChainId),
                metadataURI: action.metadataURI || "",
                tokenId: action.tokenId || 0,
                contractAddress: contractAddress,
            };
        });

        console.log("Validated actions:", validatedActions);

        res.json({
            success: true,
            actions: validatedActions,
            originalPrompt: prompt,
            contractAddresses: CONTRACT_ADDRESSES,
            model: "gemini-1.5-flash",
        });
    } catch (error) {
        console.error("Chat parsing error:", error);
        res.status(500).json({
            error: "Failed to process request",
            details: error.message,
        });
    }
});

// GET /api/chat/contracts - Get deployed contract addresses
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
            prompt: "Transfer 5 TestToken to 0xabc123 on Polygon",
            expectedOutput: [
                {
                    actionType: "transfer",
                    recipient: "0xabc123",
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
            prompt: "Mint a ZetaNFT with metadata URI https://example.com/metadata.json",
            expectedOutput: [
                {
                    actionType: "mint",
                    recipient: "",
                    amount: "1",
                    tokenAddress: CONTRACT_ADDRESSES.ZETA_NFT,
                    targetChainId: 137,
                    metadataURI: "https://example.com/metadata.json",
                    tokenId: 0,
                    contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
                },
            ],
        },
    ];

    res.json({ examples, contractAddresses: CONTRACT_ADDRESSES });
});

module.exports = router;
