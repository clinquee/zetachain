import { ZetaVaultExecutorABI } from "../abis/ZetaVaultExtractor";
import { ZetaNFTABI } from "../abis/ZetaNFT";

// Contract addresses from deployed contracts
export const CONTRACT_ADDRESSES = {
    ZETA_VAULT_EXECUTOR: "0x5630263676cCB2cE59Bebb8084d36d77136b8d86",
    TEST_TOKEN: "0x5547Bbf729Fee6027d1cD77f512b0d05F8Bb2c1D",
    ZETA_NFT: "0xc47bA4fA2B3713Fe1B1d62b5aF18B649aD36329A",
    OWNER: "0x71AfE44200A819171a0687b1026E8d4424472Ff8",
};

// Contract ABIs
export const CONTRACT_ABIS = {
    ZETA_VAULT_EXECUTOR: ZetaVaultExecutorABI,
    ZETA_NFT: ZetaNFTABI,
};

// Chain configurations
export const SUPPORTED_CHAINS = {
    1: {
        name: "Ethereum",
        rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
    },
    137: { name: "Polygon", rpcUrl: "https://polygon-rpc.com" },
    80001: { name: "Polygon Mumbai", rpcUrl: "https://rpc-mumbai.matic.today" },
};

// Helper function to get contract instance
export const getContract = (contractName, chainId = 137) => {
    return {
        address: CONTRACT_ADDRESSES[contractName],
        abi: CONTRACT_ABIS[contractName],
        chainId,
    };
};

// Helper function to validate action structure
export const validateAction = (action) => {
    const requiredFields = ["actionType", "targetChainId"];
    const missingFields = requiredFields.filter((field) => !action[field]);

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Validate action type
    const validActionTypes = [
        "transfer",
        "bridge",
        "swap",
        "stake",
        "mint",
        "approve",
        "liquidity",
    ];
    if (!validActionTypes.includes(action.actionType)) {
        throw new Error(`Invalid action type: ${action.actionType}`);
    }

    return true;
};
