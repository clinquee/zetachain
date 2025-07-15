import { ZetaVaultExecutorABI } from "../abis/ZetaVaultExtractor";
import { ZetaNFTABI } from "../abis/ZetaNFT";

// Contract addresses from environment variables
export const CONTRACT_ADDRESSES = {
    ZETA_VAULT_EXECUTOR: process.env.NEXT_PUBLIC_ZETA_VAULT_EXECUTOR || "0xCA7c84C6Ca61f48fA04d7dBbA1649f269962997c",
    ZETA_NFT: process.env.NEXT_PUBLIC_ZETA_NFT || "0xAdB17C7D41c065C0c57D69c7B4BC97A6fcD4D117",
    GATEWAY: process.env.NEXT_PUBLIC_GATEWAY || "0x6c533f7fe93fae114d0954697069df33c9b74fd7",
    // Add a default owner/deployer address for testing
    OWNER: process.env.NEXT_PUBLIC_OWNER || "0x71AfE44200A819171a0687b1026E8d4424472Ff8",
};

// Contract ABIs
export const CONTRACT_ABIS = {
    ZETA_VAULT_EXECUTOR: ZetaVaultExecutorABI,
    ZETA_NFT: ZetaNFTABI,
};

// Chain configurations for ZetaChain ecosystem
export const SUPPORTED_CHAINS = {
    7001: { name: "ZetaChain Athens", rpcUrl: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public" },
    11155111: { name: "Ethereum Sepolia", rpcUrl: "https://ethereum-sepolia.blockpi.network/v1/rpc/public" },
    80002: { name: "Polygon Amoy", rpcUrl: "https://rpc-amoy.polygon.technology" },
    421614: { name: "Arbitrum Sepolia", rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc" },
    84532: { name: "Base Sepolia", rpcUrl: "https://sepolia.base.org" },
    43113: { name: "Avalanche Fuji", rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc" },
};

// Helper function to get contract instance
export const getContract = (contractName, chainId = 7001) => {
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
        "transfer", "bridge", "swap", "stake", "mintNFT", "transferNFT", 
        "approve", "deposit", "withdraw", "crossChainTransfer"
    ];
    if (!validActionTypes.includes(action.actionType)) {
        throw new Error(`Invalid action type: ${action.actionType}`);
    }

    return true;
};
