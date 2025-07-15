// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct RevertOptions {
    bool revertToOriginal;
    string revertMessage;
}

struct CallOptions {
    uint256 gasLimit;
    bool isArbitraryCall;
}

/**
 * @title IGatewayZEVM
 * @dev Interface for ZetaChain Gateway contract for cross-chain operations
 */
interface IGatewayZEVM {
    /**
     * @dev Withdraw ZRC20 tokens to external chain
     * @param receiver The receiver address on destination chain
     * @param amount Amount of tokens to withdraw
     * @param zrc20 The ZRC20 token contract address
     * @param revertOptions Options for handling revert scenarios
     */
    function withdraw(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        RevertOptions calldata revertOptions
    ) external;

    /**
     * @dev Withdraw and call external contract
     * @param receiver The receiver address on destination chain
     * @param amount Amount of tokens to withdraw
     * @param zrc20 The ZRC20 token contract address
     * @param message Message/data to pass to destination
     * @param callOptions Options for the call
     * @param revertOptions Options for handling revert scenarios
     */
    function withdrawAndCall(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    ) external;

    /**
     * @dev Call external contract
     * @param receiver The receiver address on destination chain
     * @param zrc20 The ZRC20 token contract address (for gas)
     * @param message Message/data to pass to destination
     * @param callOptions Options for the call
     * @param revertOptions Options for handling revert scenarios
     */
    function call(
        bytes memory receiver,
        address zrc20,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    ) external;
}