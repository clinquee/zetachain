// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZRC20
 * @dev Extended ZRC20 interface for ZetaChain cross-chain tokens
 * Based on ZetaChain documentation: https://www.zetachain.com/docs/
 */
interface IZRC20 {
    // Standard ERC20 functions
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    // ZRC20 specific functions for cross-chain operations
    function deposit(address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external returns (bool);
    function withdraw(bytes memory to, uint256 amount) external returns (bool);
    function withdrawGasFee() external view returns (address, uint256);
    function withdrawGasFeeWithGasLimit(uint256 gasLimit) external view returns (address, uint256);
    
    // Additional ZRC20 functions
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    
    // Cross-chain specific
    function CHAIN_ID() external view returns (uint256);
    function COIN_TYPE() external view returns (uint8);
}