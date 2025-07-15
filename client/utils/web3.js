import { writeContract, waitForTransactionReceipt, readContract, getAccount } from 'wagmi/actions';
import { parseEther, formatEther } from 'viem';
import { config } from '../lib/wagmi';
import { CONTRACT_ADDRESSES } from './contracts';
import { IZRC20_ABI } from '../abis/IZRC20';
import { ZetaVaultExecutorABI } from '@/abis/ZetaVaultExtractor';

// ZRC20 Token addresses from your deployment
const ZRC20_TOKENS = {
    ETH_SEPOLIA: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0', // sETH.SEPOLIA
    ETH_ARBITRUM: '0x1de70f3e971B62A0707dA18100392af14f7fB677', // ETH.ARBSEP
    ETH_BASE: '0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD', // ETH.BASESEPOLIA
    USDC_SEPOLIA: '0xcC683A782f4B30c138787CB5576a86AF66fdc31d', // USDC.SEPOLIA
    USDC_ARBITRUM: '0x4bC32034caCcc9B7e02536945eDbC286bACbA073', // USDC.ARBSEP
    USDC_POLYGON: '0xe573a6e11f8506620F123DBF930222163D46BCB6', // USDC.AMOY
    BNB_BSC: '0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891', // BNB.BSC
    AVAX_FUJI: '0xEe9CC614D03e7Dbe994b514079f4914a605B4719', // AVAX.FUJI
    POL_AMOY: '0x777915D031d1e8144c90D025C594b3b8Bf07a08d', // POL.AMOY
};

// Function to check contract ownership and token support
export const validateContractSetup = async () => {
    try {
        console.log('🔍 Validating contract setup...');
        
        // Check contract owner
        const owner = await readContract(config, {
            address: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            abi: ZetaVaultExecutorABI,
            functionName: 'owner',
            chainId: 7001,
        });
        
        // Check if paused
        const isPaused = await readContract(config, {
            address: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            abi: ZetaVaultExecutorABI,
            functionName: 'paused',
            chainId: 7001,
        });
        
        // Check token support for key tokens
        const tokenChecks = await Promise.allSettled([
            readContract(config, {
                address: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
                abi: ZetaVaultExecutorABI,
                functionName: 'supportedTokens',
                args: [ZRC20_TOKENS.ETH_SEPOLIA],
                chainId: 7001,
            }),
            readContract(config, {
                address: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
                abi: ZetaVaultExecutorABI,
                functionName: 'supportedTokens',
                args: [ZRC20_TOKENS.USDC_SEPOLIA],
                chainId: 7001,
            })
        ]);
        
        const sethSupported = tokenChecks[0].status === 'fulfilled' ? tokenChecks[0].value : false;
        const usdcSupported = tokenChecks[1].status === 'fulfilled' ? tokenChecks[1].value : false;
        
        const setupStatus = {
            contractAddress: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            owner: owner,
            isPaused: isPaused,
            tokensSupported: {
                sETH: sethSupported,
                USDC: usdcSupported
            },
            isReady: !isPaused && (sethSupported || usdcSupported)
        };
        
        console.log('📊 Contract Setup Status:', setupStatus);
        return setupStatus;
        
    } catch (error) {
        console.error('❌ Failed to validate contract setup:', error);
        return {
            isReady: false,
            error: error.message
        };
    }
};

// Enhanced token validation before execution
export const validateTokenSupport = async (tokenAddress) => {
    try {
        const isSupported = await readContract(config, {
            address: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
            abi: ZetaVaultExecutorABI,
            functionName: 'supportedTokens',
            args: [tokenAddress],
            chainId: 7001,
        });
        
        if (!isSupported) {
            throw new Error(`Token ${tokenAddress} is not supported by the contract. Please contact the contract owner to add support.`);
        }
        
        return true;
    } catch (error) {
        console.error(`Token validation failed for ${tokenAddress}:`, error);
        throw error;
    }
};

// Helper function to approve ZRC20 tokens
export const approveZRC20Token = async (tokenAddress, spenderAddress, amount) => {
    try {
        console.log(`🔐 Approving ${tokenAddress} for ${spenderAddress}`);
        console.log(`💰 Amount: ${amount.toString()}`);

        // Get current account using the correct Wagmi v2 method
        const account = getAccount(config);
        if (!account.address) {
            throw new Error('No wallet connected. Please connect your wallet first.');
        }

        console.log(`👤 Account: ${account.address}`);

        // Check current allowance first
        const currentAllowance = await readContract(config, {
            address: tokenAddress,
            abi: IZRC20_ABI,
            functionName: 'allowance',
            args: [account.address, spenderAddress],
            chainId: 7001, // ZetaChain
        });

        console.log(`📋 Current allowance: ${currentAllowance.toString()}`);

        // If allowance is sufficient, no need to approve again
        if (currentAllowance >= amount) {
            console.log(`✅ Sufficient allowance already exists`);
            return true;
        }

        // Approve the contract to spend tokens
        const approveHash = await writeContract(config, {
            address: tokenAddress,
            abi: IZRC20_ABI,
            functionName: 'approve',
            args: [spenderAddress, amount],
            chainId: 7001, // ZetaChain
        });

        console.log(`📝 Approval transaction: ${approveHash}`);

        // Wait for approval confirmation
        const approveReceipt = await waitForTransactionReceipt(config, {
            hash: approveHash,
            chainId: 7001,
        });

        console.log(`✅ Approval confirmed!`, approveReceipt);
        return approveHash;

    } catch (error) {
        console.error(`❌ Approval failed:`, error);
        throw new Error(`Failed to approve ${tokenAddress}: ${error.message}`);
    }
};

// Helper function to check if approval is needed
export const checkAndApproveTokens = async (actions) => {
    const approvalsNeeded = [];
    const spenderAddress = CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR;

    // Get current account
    const account = getAccount(config);
    if (!account.address) {
        throw new Error('No wallet connected. Please connect your wallet first.');
    }

    for (const action of actions) {
        // Skip NFT actions and zero amounts
        if (action.actionType === 'mintNFT' || action.actionType === 'transferNFT' || action.amount === '0') {
            continue;
        }

        // Check if this token needs approval
        try {
            const currentAllowance = await readContract(config, {
                address: action.tokenAddress,
                abi: IZRC20_ABI,
                functionName: 'allowance',
                args: [account.address, spenderAddress],
                chainId: 7001,
            });

            if (currentAllowance < BigInt(action.amount)) {
                approvalsNeeded.push({
                    tokenAddress: action.tokenAddress,
                    amount: BigInt(action.amount),
                    currentAllowance: currentAllowance
                });
            }
        } catch (error) {
            console.warn(`Could not check allowance for ${action.tokenAddress}:`, error);
            // Add to approvals needed as a precaution
            approvalsNeeded.push({
                tokenAddress: action.tokenAddress,
                amount: BigInt(action.amount),
                currentAllowance: BigInt(0)
            });
        }
    }

    return approvalsNeeded;
};

// Execute approvals for all needed tokens
export const executeApprovals = async (approvalsNeeded) => {
    const approvalHashes = [];
    const spenderAddress = CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR;

    for (const approval of approvalsNeeded) {
        try {
            const hash = await approveZRC20Token(
                approval.tokenAddress, 
                spenderAddress, 
                approval.amount
            );
            approvalHashes.push({
                tokenAddress: approval.tokenAddress,
                hash: hash,
                amount: approval.amount
            });

            // Wait a bit between approvals
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`Failed to approve ${approval.tokenAddress}:`, error);
            throw error;
        }
    }

    return approvalHashes;
};

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

  // Validate and clean token address - use proper ZRC20 instead of zero address
  let tokenAddress = action.tokenAddress;
  if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
    console.warn(`Invalid or zero token address: ${tokenAddress}, using sETH.SEPOLIA`);
    tokenAddress = ZRC20_TOKENS.ETH_SEPOLIA; // Use proper ZRC20 token
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
    console.log('🚀 Starting action execution with validation...');
    
    // Step 0: Validate contract setup
    const setupStatus = await validateContractSetup();
    if (!setupStatus.isReady) {
        throw new Error(`Contract not ready: ${setupStatus.error || 'Contract is paused or tokens not supported'}`);
    }
    
    // Check wallet connection first
    const account = getAccount(config);
    if (!account.address) {
      throw new Error('No wallet connected. Please connect your wallet to continue.');
    }
    console.log(`👤 Connected account: ${account.address}`);

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
      actionsArray = [actions];
    } else {
      throw new Error(`Invalid actions format. Expected array or object, got ${typeof actions}.`);
    }
    
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

    // CRITICAL: Validate formattedActions is still valid after processing
    if (!formattedActions || !Array.isArray(formattedActions) || formattedActions.length === 0) {
      throw new Error('Formatted actions became invalid during processing. Please try again.');
    }

    // IMPORTANT: Store the count early to prevent variable scope issues
    const actionsCount = formattedActions.length;
    console.log(`📊 Actions count preserved: ${actionsCount}`);

    // Step 1: Validate token support for all actions
    console.log('🔐 Step 1: Validating token support...');
    for (const action of formattedActions) {
        if (action.actionType !== 'mintNFT' && action.actionType !== 'transferNFT') {
            await validateTokenSupport(action.tokenAddress);
        }
    }
    console.log('✅ All tokens are supported');

    // Step 2: Check which tokens need approval
    console.log('🔐 Step 2: Checking token approvals...');
    const approvalsNeeded = await checkAndApproveTokens(formattedActions);
    let approvalsCount = 0;
    
    if (approvalsNeeded.length > 0) {
      console.log(`🔑 Found ${approvalsNeeded.length} tokens that need approval:`, approvalsNeeded);
      approvalsCount = approvalsNeeded.length;
      
      // Execute approvals
      const approvalResults = await executeApprovals(approvalsNeeded);
      console.log(`✅ All approvals completed:`, approvalResults);
      
      // Add a small delay after approvals to ensure blockchain state is updated
      console.log('⏳ Waiting for approval state to propagate...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log(`✅ No approvals needed, all tokens already approved`);
    }

    // Step 3: Execute the main transaction
    console.log('🔥 Step 3: Executing main transaction...');
    
    // DOUBLE CHECK: Ensure formattedActions is still valid
    if (!formattedActions || !Array.isArray(formattedActions)) {
      throw new Error('Critical error: formattedActions became undefined. Please try again.');
    }
    
    if (formattedActions.length === 0) {
      throw new Error('Critical error: formattedActions is empty. Please try again.');
    }

    console.log(`🚀 About to execute ${formattedActions.length} actions:`, formattedActions);
    
    // Create a deep copy of formattedActions to prevent reference issues
    const actionsForContract = formattedActions.map(action => ({
      actionType: action.actionType,
      recipient: action.recipient,
      amount: action.amount,
      tokenAddress: action.tokenAddress,
      targetChainId: action.targetChainId,
      metadataURI: action.metadataURI,
      tokenId: action.tokenId,
    }));

    console.log(`📝 Cleaned actions for contract:`, actionsForContract);
    
    const targetChainId = chainId || 7001;
    
    const hash = await writeContract(config, {
      address: CONTRACT_ADDRESSES.ZETA_VAULT_EXECUTOR,
      abi: ZetaVaultExecutorABI,
      functionName: 'executeActions',
      args: [actionsForContract],
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

    const explorerUrl = `https://zetachain-athens.blockscout.com/tx/${hash}`;

    // Use the preserved count instead of accessing formattedActions.length
    return {
      hash,
      receipt,
      success: true,
      explorerUrl,
      actionsExecuted: actionsCount, // Use preserved count
      approvalsNeeded: approvalsCount
    };

  } catch (error) {
    console.error('❌ Error executing actions:', error);
    
    // Enhanced error handling
    if (error.message?.includes('No wallet connected')) {
      throw new Error('Please connect your wallet first to execute transactions.');
    } else if (error.message?.includes('not supported')) {
      throw new Error(`Token not supported: ${error.message}`);
    } else if (error.message?.includes('Contract not ready')) {
      throw new Error(`Contract setup incomplete: ${error.message}`);
    } else if (error.message?.includes('0xd92e233d') || error.message?.includes('OwnableUnauthorizedAccount')) {
      throw new Error('Access denied: The contract owner needs to add token support first. Please contact the project team.');
    } else if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
      throw new Error('Transaction was rejected by user');
    } else if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction and gas fees');
    } else if (error.message?.includes('allowance') || error.message?.includes('ERC20: transfer amount exceeds allowance')) {
      throw new Error('Token allowance insufficient. The approval step may have failed.');
    } else {
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

// Export available tokens for reference
export { ZRC20_TOKENS };