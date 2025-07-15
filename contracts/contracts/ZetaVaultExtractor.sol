// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IZRC20.sol";
import "./interfaces/IGatewayZVEM.sol";
import "./ZetaNFT.sol";

/**
 * @title ZetaVaultExecutor
 * @dev Main orchestrator contract for ZetaVault cross-chain DeFi operations
 * Supports deposits, withdrawals, transfers, NFT operations, and cross-chain transactions
 */
contract ZetaVaultExecutor is Ownable, ReentrancyGuard, Pausable {
    struct Action {
        string actionType;      // "deposit", "withdraw", "transfer", "mintNFT", "transferNFT", "crossChainTransfer", "bridge"
        address recipient;      // Target address
        uint256 amount;         // Amount of tokens
        address tokenAddress;   // Token contract address
        uint256 targetChainId;  // Target chain ID for cross-chain operations
        string metadataURI;     // NFT metadata URI
        uint256 tokenId;        // NFT token ID
    }

    ZetaNFT public immutable zetaNFT;
    IGatewayZEVM public immutable gateway;

    // User balances: user => token => amount
    mapping(address => mapping(address => uint256)) public userBalances;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    
    // Cross-chain transaction tracking
    mapping(bytes32 => bool) public processedTransactions;
    
    // Fee configuration
    uint256 public constant FEE_BASIS_POINTS = 10; // 0.1%
    uint256 public constant MAX_FEE_BASIS_POINTS = 1000; // 10%
    address public feeRecipient;

    // Events
    event ActionExecuted(
        string indexed actionType,
        address indexed user,
        address indexed recipient,
        uint256 amount,
        address tokenAddress,
        uint256 tokenId,
        uint256 chainId
    );

    event TokensDeposited(address indexed user, address indexed token, uint256 amount);
    event TokensWithdrawn(address indexed user, address indexed token, uint256 amount);
    event NFTMinted(address indexed recipient, uint256 indexed tokenId, string metadataURI);
    event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId);
    event CrossChainTransferInitiated(
        address indexed user,
        bytes recipient,
        address indexed token,
        uint256 amount,
        uint256 indexed targetChainId,
        bytes32 txHash
    );
    event TokenSupportUpdated(address indexed token, bool supported);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    /**
     * @dev Constructor
     * @param _zetaNFT Address of the ZetaNFT contract
     * @param _gateway Address of the ZetaChain Gateway contract
     */
    constructor(address _zetaNFT, address _gateway) Ownable(msg.sender) {
        require(_zetaNFT != address(0), "Invalid ZetaNFT address");
        require(_gateway != address(0), "Invalid Gateway address");
        
        zetaNFT = ZetaNFT(_zetaNFT);
        gateway = IGatewayZEVM(_gateway);
        feeRecipient = msg.sender;
    }

    /**
     * @dev Execute multiple actions in a single transaction
     * @param actions Array of actions to execute
     */
    function executeActions(Action[] calldata actions) external nonReentrant whenNotPaused {
        require(actions.length > 0, "No actions provided");
        require(actions.length <= 10, "Too many actions");

        for (uint256 i = 0; i < actions.length; i++) {
            _executeAction(actions[i]);
        }
    }

    /**
     * @dev Execute a single action
     * @param action Action to execute
     */
    function _executeAction(Action calldata action) internal {
        bytes32 actionHash = keccak256(abi.encode(action, msg.sender, block.timestamp));
        
        if (keccak256(bytes(action.actionType)) == keccak256("mintNFT")) {
            _mintNFT(action.recipient, action.metadataURI);
        } else if (keccak256(bytes(action.actionType)) == keccak256("transfer")) {
            _transferTokens(action.recipient, action.amount, action.tokenAddress);
        } else if (keccak256(bytes(action.actionType)) == keccak256("deposit")) {
            _depositTokens(action.amount, action.tokenAddress);
        } else if (keccak256(bytes(action.actionType)) == keccak256("withdraw")) {
            _withdrawTokens(action.amount, action.tokenAddress);
        } else if (keccak256(bytes(action.actionType)) == keccak256("transferNFT")) {
            _transferNFT(action.recipient, action.tokenId);
        } else if (
            keccak256(bytes(action.actionType)) == keccak256("crossChainTransfer") ||
            keccak256(bytes(action.actionType)) == keccak256("bridge")
        ) {
            _crossChainTransfer(
                action.tokenAddress,
                action.amount,
                action.targetChainId,
                abi.encodePacked(action.recipient),
                actionHash
            );
        } else {
            revert("Invalid action type");
        }

        emit ActionExecuted(
            action.actionType,
            msg.sender,
            action.recipient,
            action.amount,
            action.tokenAddress,
            action.tokenId,
            action.targetChainId
        );
    }

    /**
     * @dev Mint NFT to recipient
     * @param recipient Address to receive the NFT
     * @param metadataURI Metadata URI for the NFT
     */
    function _mintNFT(address recipient, string calldata metadataURI) internal {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(metadataURI).length > 0, "Empty metadata URI");
        
        uint256 tokenId = zetaNFT.mint(recipient, metadataURI);
        emit NFTMinted(recipient, tokenId, metadataURI);
    }

    /**
     * @dev Transfer tokens from user to recipient
     * @param recipient Address to receive tokens
     * @param amount Amount of tokens to transfer
     * @param tokenAddress Token contract address
     */
    function _transferTokens(address recipient, uint256 amount, address tokenAddress) internal {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(supportedTokens[tokenAddress], "Token not supported");
        
        IZRC20 token = IZRC20(tokenAddress);
        require(token.transferFrom(msg.sender, recipient, amount), "Transfer failed");
    }

    /**
     * @dev Deposit tokens to vault
     * @param amount Amount of tokens to deposit
     * @param tokenAddress Token contract address
     */
    function _depositTokens(uint256 amount, address tokenAddress) internal {
        require(amount > 0, "Invalid amount");
        require(supportedTokens[tokenAddress], "Token not supported");
        
        IZRC20 token = IZRC20(tokenAddress);
        
        // Calculate fee
        uint256 fee = (amount * FEE_BASIS_POINTS) / 10000;
        uint256 netAmount = amount - fee;
        
        require(token.transferFrom(msg.sender, address(this), amount), "Deposit failed");
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            require(token.transfer(feeRecipient, fee), "Fee transfer failed");
        }
        
        userBalances[msg.sender][tokenAddress] += netAmount;
        emit TokensDeposited(msg.sender, tokenAddress, netAmount);
    }

    /**
     * @dev Withdraw tokens from vault
     * @param amount Amount of tokens to withdraw
     * @param tokenAddress Token contract address
     */
    function _withdrawTokens(uint256 amount, address tokenAddress) internal {
        require(amount > 0, "Invalid amount");
        require(userBalances[msg.sender][tokenAddress] >= amount, "Insufficient balance");
        
        userBalances[msg.sender][tokenAddress] -= amount;
        
        IZRC20 token = IZRC20(tokenAddress);
        require(token.transfer(msg.sender, amount), "Withdrawal failed");
        
        emit TokensWithdrawn(msg.sender, tokenAddress, amount);
    }

    /**
     * @dev Transfer NFT to recipient within same chain
     * @param recipient Address to receive the NFT
     * @param tokenId NFT token ID to transfer
     */
    function _transferNFT(address recipient, uint256 tokenId) internal {
        require(recipient != address(0), "Invalid recipient");
        require(zetaNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        
        // Use the new transferNFTSameChain function
        zetaNFT.transferNFTSameChain(msg.sender, recipient, tokenId);
        emit NFTTransferred(msg.sender, recipient, tokenId);
    }

    /**
     * @dev Initiate cross-chain transfer using ZetaChain Gateway
     * @param token Token address to transfer
     * @param amount Amount to transfer
     * @param targetChainId Target chain ID
     * @param recipient Recipient address on target chain
     * @param txHash Unique transaction hash
     */
    function _crossChainTransfer(
        address token,
        uint256 amount,
        uint256 targetChainId,
        bytes memory recipient,
        bytes32 txHash
    ) internal {
        require(amount > 0, "Invalid amount");
        require(targetChainId != block.chainid, "Cannot transfer to same chain");
        require(recipient.length > 0, "Invalid recipient");
        require(!processedTransactions[txHash], "Transaction already processed");
        require(userBalances[msg.sender][token] >= amount, "Insufficient balance");
        
        // Mark transaction as processed
        processedTransactions[txHash] = true;
        
        // Deduct from user balance
        userBalances[msg.sender][token] -= amount;
        
        // Approve gateway to spend tokens
        IZRC20(token).approve(address(gateway), amount);
        
        // Execute cross-chain withdrawal
        gateway.withdraw(
            recipient,
            amount,
            token,
            RevertOptions({
                revertToOriginal: true,
                revertMessage: "Cross-chain transfer failed"
            })
        );
        
        emit CrossChainTransferInitiated(
            msg.sender,
            recipient,
            token,
            amount,
            targetChainId,
            txHash
        );
    }

    /**
     * @dev Get ZRC20 token information
     * @param token Token address to query
     */
    function getZRC20Info(address token)
        external
        view
        returns (
            uint256 supply,
            uint256 balance,
            uint256 allowance_,
            address feeToken,
            uint256 flatFee
        )
    {
        IZRC20 zrc = IZRC20(token);
        supply = zrc.totalSupply();
        balance = zrc.balanceOf(address(this));
        allowance_ = zrc.allowance(msg.sender, address(this));
        (feeToken, flatFee) = zrc.withdrawGasFee();
    }

    /**
     * @dev Get user balance for specific token
     * @param user User address
     * @param token Token address
     * @return User's balance
     */
    function getUserBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }

    /**
     * @dev Get user balances for multiple tokens
     * @param user User address
     * @param tokens Array of token addresses
     * @return balances Array of user balances
     */
    function getUserBalances(address user, address[] calldata tokens) 
        external 
        view 
        returns (uint256[] memory balances) 
    {
        balances = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            balances[i] = userBalances[user][tokens[i]];
        }
    }

    /**
     * @dev Check if transaction was already processed
     * @param txHash Transaction hash to check
     * @return Whether transaction was processed
     */
    function isTransactionProcessed(bytes32 txHash) external view returns (bool) {
        return processedTransactions[txHash];
    }

    // Admin functions

    /**
     * @dev Add or remove token support
     * @param token Token address
     * @param supported Whether token is supported
     */
    function setTokenSupport(address token, bool supported) external onlyOwner {
        require(token != address(0), "Invalid token address");
        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    /**
     * @dev Set fee recipient
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(oldRecipient, newFeeRecipient);
    }

    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal function for owner
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IZRC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {
        // Allow contract to receive ETH
    }
}