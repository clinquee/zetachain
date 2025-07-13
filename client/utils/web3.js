import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "./contracts";

// Web3 utility functions
export const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            return { provider, signer };
        } catch (error) {
            console.error("Error connecting wallet:", error);
            throw error;
        }
    } else {
        throw new Error("Please install MetaMask");
    }
};

// Execute actions through ZetaVaultExecutor
export const executeActions = async (actions, signer) => {
    try {
        const contract = new ethers.Contract(
            CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            CONTRACT_ABIS.ZETA_VAULT_EXECUTOR,
            signer
        );

        // Convert actions to the format expected by the contract
        const formattedActions = actions.map((action) => ({
            actionType: action.actionType,
            recipient: action.recipient || ethers.constants.AddressZero,
            amount: action.amount || "0",
            tokenAddress: action.tokenAddress || ethers.constants.AddressZero,
            targetChainId: action.targetChainId,
            metadataURI: action.metadataURI || "",
            tokenId: action.tokenId || 0,
        }));

        console.log("Executing actions:", formattedActions);

        const tx = await contract.executeActions(formattedActions);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        return receipt;
    } catch (error) {
        console.error("Error executing actions:", error);
        throw error;
    }
};

// Get user balance from ZetaVaultExecutor
export const getUserBalance = async (userAddress, tokenAddress, provider) => {
    try {
        const contract = new ethers.Contract(
            CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            CONTRACT_ABIS.ZETA_VAULT_EXECUTOR,
            provider
        );

        const balance = await contract.getUserBalance(
            userAddress,
            tokenAddress
        );
        return balance;
    } catch (error) {
        console.error("Error getting user balance:", error);
        throw error;
    }
};
