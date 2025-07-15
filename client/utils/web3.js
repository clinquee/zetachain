import { writeContract, waitForTransactionReceipt } from 'wagmi/actions';
import { parseEther, formatEther, parseUnits } from 'viem';
import { config } from '../lib/wagmi';
import { CONTRACT_ADDRESSES } from './contracts';
import { ZetaVaultExecutorABI } from '../abis/ZetaVaultExtractor';

// Helper function to safely convert to BigInt
const safeBigInt = (value, defaultValue = 0) => {
  try {
    if (value === null || value === undefined || value === '') {
      return BigInt(defaultValue);
    }
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'string') {
      // Remove any non-numeric characters except decimal point
      const cleaned = value.replace(/[^0-9.]/g, '');
      if (cleaned === '' || cleaned === '.') {
        return BigInt(defaultValue);
      }
      // If it contains a decimal, treat as ether value
      if (cleaned.includes('.')) {
        return parseEther(cleaned);
      }
      return BigInt(cleaned);
    }
    if (typeof value === 'number') {
      if (value < 1) {
        // If it's a decimal, treat as ether
        return parseEther(value.toString());
      }
      return BigInt(Math.floor(value));
    }
    return BigInt(defaultValue);
  } catch (error) {
    console.warn(`Failed to convert ${value} to BigInt, using default ${defaultValue}:`, error);
    return BigInt(defaultValue);
  }
};

// Helper function to safely convert to number (for chain IDs)
const safeNumber = (value, defaultValue = 7001) => {
  try {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    if (typeof value === 'number') {
      return Math.floor(value);
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to convert ${value} to number, using default ${defaultValue}:`, error);
    return defaultValue;
  }
};

// Helper function to validate and clean action data
const validateAndCleanAction = (action, index) => {
  console.log(`🔍 Validating action ${index + 1}:`, action);
  
  // Required fields validation
  if (!action || typeof action !== 'object') {
    throw new Error(`Action ${index + 1} is not a valid object`);
  }

  // Validate actionType
  const validActionTypes = [
    'transfer', 'bridge', 'crossChainTransfer', 'mintNFT', 'transferNFT', 
    'approve', 'deposit', 'withdraw', 'stake', 'unstake'
  ];
  
  const actionType = action.actionType || 'transfer';
  if (!validActionTypes.includes(actionType)) {
    console.warn(`Invalid action type: ${actionType}, defaulting to 'transfer'`);
  }

  // Validate and clean recipient address
  let recipient = action.recipient || CONTRACT_ADDRESSES.OWNER;
  if (!recipient || typeof recipient !== 'string' || !recipient.startsWith('0x')) {
    console.warn(`Invalid recipient: ${recipient}, using default owner`);
    recipient = CONTRACT_ADDRESSES.OWNER;
  }

  // Validate and clean token address
  let tokenAddress = action.tokenAddress || '0x0000000000000000000000000000000000000000';
  if (!tokenAddress || typeof tokenAddress !== 'string' || !tokenAddress.startsWith('0x')) {
    console.warn(`Invalid token address: ${tokenAddress}, using ETH`);
    tokenAddress = '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0'; // sETH.SEPOLIA
  }

  // Clean and validate amounts
  const amount = safeBigInt(action.amount, 0);
  const tokenId = safeBigInt(action.tokenId, 0);
  
  // Handle targetChainId as a regular number (not BigInt)
  const targetChainId = safeNumber(action.targetChainId, 7001);

  // Validate chainId range with supported chains
  const supportedChainIds = [7001, 11155111, 80002, 421614, 84532, 43113];
  if (!supportedChainIds.includes(targetChainId)) {
    console.warn(`Unsupported chain ID: ${targetChainId}, defaulting to ZetaChain (7001)`);
    // Don't throw error, just use default
  }

  const cleanedAction = {
    actionType: actionType,
    recipient: recipient,
    amount: amount,
    tokenAddress: tokenAddress,
    targetChainId: BigInt(targetChainId), // Convert to BigInt for contract
    metadataURI: action.metadataURI || '',
    tokenId: tokenId,
  };

  console.log(`✅ Cleaned action ${index + 1}:`, cleanedAction);
  return cleanedAction;
};

// Execute actions using Wagmi + Viem
export const executeActionsWithWagmi = async (actions, chainId) => {
  try {
    console.log('🚀 Starting action execution...');
    console.log('📥 Raw actions received:', actions);
    console.log('📥 Actions type:', typeof actions);
    console.log('📥 Actions is array:', Array.isArray(actions));
    console.log('🔗 Target Chain ID:', chainId);
    console.log('📋 Contract Address:', CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR);
    
    // Enhanced validation with better error messages
    if (actions === null || actions === undefined) {
      throw new Error('Actions parameter is null or undefined. Please submit a prompt first.');
    }
    
    if (typeof actions === 'string') {
      try {
        actions = JSON.parse(actions);
      } catch (parseError) {
        throw new Error('Invalid actions string format. Please submit a new prompt.');
      }
    }
    
    // Ensure actions is an array with comprehensive checking
    let actionsArray;
    if (Array.isArray(actions)) {
      actionsArray = actions;
    } else if (actions && typeof actions === 'object') {
      // If it's a single action object, wrap it in an array
      actionsArray = [actions];
    } else {
      throw new Error(`Invalid actions format. Expected array or object, got ${typeof actions}. Please submit a new prompt.`);
    }
    
    // Check if array is empty
    if (actionsArray.length === 0) {
      throw new Error('No actions to execute. Please submit a prompt with valid actions.');
    }

    if (actionsArray.length > 10) {
      throw new Error(`Too many actions (${actionsArray.length}). Maximum 10 actions allowed per execution.`);
    }

    console.log(`📊 Processing ${actionsArray.length} action(s)...`);

    // Validate each action exists and has required properties
    for (let i = 0; i < actionsArray.length; i++) {
      const action = actionsArray[i];
      if (!action) {
        throw new Error(`Action ${i + 1} is null or undefined`);
      }
      if (typeof action !== 'object') {
        throw new Error(`Action ${i + 1} must be an object, got ${typeof action}`);
      }
    }

    // Validate and format each action
    const formattedActions = actionsArray.map((action, index) => {
      try {
        return validateAndCleanAction(action, index);
      } catch (error) {
        throw new Error(`Action ${index + 1} validation failed: ${error.message}`);
      }
    });

    console.log('📤 Final formatted actions for contract:', formattedActions);

    // Validate contract address
    if (!CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR || !CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR.startsWith('0x')) {
      throw new Error('Invalid contract address configuration. Please check environment variables.');
    }

    // Validate chain ID
    const targetChainId = chainId || 7001;
    if (typeof targetChainId !== 'number' || targetChainId < 1) {
      throw new Error(`Invalid chain ID: ${targetChainId}`);
    }

    console.log('📞 Calling writeContract...');
    console.log('- Contract:', CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR);
    console.log('- Chain ID:', targetChainId);
    console.log('- Function: executeActions');
    console.log('- Args:', [formattedActions]);

    // Execute the transaction
    const hash = await writeContract(config, {
      address: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
      abi: ZetaVaultExecutorABI,
      functionName: 'executeActions',
      args: [formattedActions],
      chainId: targetChainId,
    });

    console.log('💫 Transaction submitted! Hash:', hash);

    // Wait for transaction confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      chainId: targetChainId,
    });

    console.log('🎉 Transaction confirmed!', receipt);

    // Determine explorer URL based on chain
    let explorerUrl;
    switch (targetChainId) {
      case 7001:
        explorerUrl = `https://zetachain-athens.blockscout.com/tx/${hash}`;
        break;
      case 11155111:
        explorerUrl = `https://sepolia.etherscan.io/tx/${hash}`;
        break;
      case 80002:
        explorerUrl = `https://amoy.polygonscan.com/tx/${hash}`;
        break;
      case 421614:
        explorerUrl = `https://sepolia.arbiscan.io/tx/${hash}`;
        break;
      case 84532:
        explorerUrl = `https://sepolia.basescan.org/tx/${hash}`;
        break;
      case 43113:
        explorerUrl = `https://testnet.snowtrace.io/tx/${hash}`;
        break;
      default:
        explorerUrl = `https://zetachain-athens.blockscout.com/tx/${hash}`;
    }

    return {
      hash,
      receipt,
      success: true,
      explorerUrl,
      actionsExecuted: formattedActions.length
    };
  } catch (error) {
    console.error('❌ Error executing actions:', error);
    
    // Enhanced error handling with more specific error types
    if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
      throw new Error('Transaction was rejected by user');
    } else if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction and gas fees');
    } else if (error.message?.includes('allowance')) {
      throw new Error('Please approve the contract to spend your tokens first');
    } else if (error.message?.includes('Invalid action type')) {
      throw new Error('One or more actions contain invalid action types');
    } else if (error.message?.includes('validation failed')) {
      throw new Error(error.message); // Pass through validation errors
    } else if (error.message?.includes('Contract call reverted')) {
      throw new Error('Transaction reverted - check contract requirements and balances');
    } else if (error.message?.includes('network')) {
      throw new Error('Network error - please check your connection and try again');
    } else if (error.message?.includes('Cannot read properties')) {
      throw new Error('Action data format error - please submit a new prompt');
    } else if (error.message?.includes('Invalid contract address')) {
      throw new Error('Contract configuration error - please contact support');
    } else if (error.message?.includes('null or undefined')) {
      throw new Error(error.message); // Pass through null/undefined errors
    } else {
      // Log the full error for debugging
      console.error('Full error details:', error);
      throw new Error(error.message || 'Transaction failed - please try again');
    }
  }
};

// Helper function to format amounts (handles both string and number inputs)
export const formatAmount = (amount, decimals = 18) => {
  try {
    return safeBigInt(amount, 0).toString();
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0';
  }
};

// Helper function to parse amounts for display
export const parseAmount = (amount, decimals = 18) => {
  try {
    return formatEther(safeBigInt(amount, 0));
  } catch (error) {
    console.error('Error parsing amount:', error);
    return '0';
  }
};

// Helper to get chain name
export const getChainName = (chainId) => {
  const chains = {
    7001: 'ZetaChain Athens',
    11155111: 'Ethereum Sepolia',
    80002: 'Polygon Amoy',
    421614: 'Arbitrum Sepolia',
    84532: 'Base Sepolia',
    43113: 'Avalanche Fuji'
  };
  return chains[chainId] || `Chain ${chainId}`;
};

// Helper to validate contract address
export const validateContractAddress = (address) => {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Debug helper to inspect action data
export const debugAction = (action) => {
  console.log('🔍 Action Debug Info:');
  console.log('- Type:', typeof action);
  console.log('- Keys:', Object.keys(action || {}));
  console.log('- Values:', Object.values(action || {}));
  console.log('- Full action:', action);
};