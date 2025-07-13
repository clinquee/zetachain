// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IZRC20.sol";
import "./ZetaNFT.sol";

contract ZetaVaultExecutor is Ownable, ReentrancyGuard {
    struct Action {
        string actionType;
        address recipient;
        uint256 amount;
        address tokenAddress;
        uint256 targetChainId;
        string metadataURI;
        uint256 tokenId;
    }

    ZetaNFT public zetaNFT;
    
    // User balances for deposited tokens
    mapping(address => mapping(address => uint256)) public userBalances;
    
    event ActionExecuted(
        string actionType,
        address indexed user,
        address indexed recipient,
        uint256 amount,
        address indexed tokenAddress,
        uint256 tokenId
    );
    
    event TokensDeposited(address indexed user, address indexed token, uint256 amount);
    event TokensWithdrawn(address indexed user, address indexed token, uint256 amount);
    event NFTMinted(address indexed recipient, uint256 indexed tokenId, string metadataURI);
    event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(address _zetaNFT) Ownable(msg.sender) {
        zetaNFT = ZetaNFT(_zetaNFT);
    }

    function executeActions(Action[] calldata actions) external nonReentrant {
        for (uint256 i = 0; i < actions.length; i++) {
            _executeAction(actions[i]);
        }
    }

    function _executeAction(Action calldata action) internal {
        if (keccak256(bytes(action.actionType)) == keccak256(bytes("mintNFT"))) {
            _mintNFT(action.recipient, action.metadataURI);
        } else if (keccak256(bytes(action.actionType)) == keccak256(bytes("transfer"))) {
            _transferTokens(action.recipient, action.amount, action.tokenAddress);
        } else if (keccak256(bytes(action.actionType)) == keccak256(bytes("deposit"))) {
            _depositTokens(action.amount, action.tokenAddress);
        } else if (keccak256(bytes(action.actionType)) == keccak256(bytes("withdraw"))) {
            _withdrawTokens(action.amount, action.tokenAddress);
        } else if (keccak256(bytes(action.actionType)) == keccak256(bytes("transferNFT"))) {
            _transferNFT(action.recipient, action.tokenId);
        } else {
            revert("Invalid action type");
        }

        emit ActionExecuted(
            action.actionType,
            msg.sender,
            action.recipient,
            action.amount,
            action.tokenAddress,
            action.tokenId
        );
    }

    function _mintNFT(address recipient, string calldata metadataURI) internal {
        uint256 tokenId = zetaNFT.mint(recipient, metadataURI);
        emit NFTMinted(recipient, tokenId, metadataURI);
    }

    function _transferTokens(address recipient, uint256 amount, address tokenAddress) internal {
        IZRC20 token = IZRC20(tokenAddress);
        require(token.transferFrom(msg.sender, recipient, amount), "Transfer failed");
    }

    function _depositTokens(uint256 amount, address tokenAddress) internal {
        IZRC20 token = IZRC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Deposit failed");
        
        userBalances[msg.sender][tokenAddress] += amount;
        emit TokensDeposited(msg.sender, tokenAddress, amount);
    }

    function _withdrawTokens(uint256 amount, address tokenAddress) internal {
        require(userBalances[msg.sender][tokenAddress] >= amount, "Insufficient balance");
        
        userBalances[msg.sender][tokenAddress] -= amount;
        
        IZRC20 token = IZRC20(tokenAddress);
        require(token.transfer(msg.sender, amount), "Withdrawal failed");
        
        emit TokensWithdrawn(msg.sender, tokenAddress, amount);
    }

    function _transferNFT(address recipient, uint256 tokenId) internal {
        zetaNFT.transferFrom(msg.sender, recipient, tokenId);
        emit NFTTransferred(msg.sender, recipient, tokenId);
    }

    function getUserBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }
}