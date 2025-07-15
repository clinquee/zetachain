// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IGatewayZVEM.sol";

contract MockGateway is IGatewayZEVM {
    event WithdrawCalled(
        bytes receiver,
        uint256 amount,
        address zrc20,
        RevertOptions revertOptions
    );

    event WithdrawAndCallCalled(
        bytes receiver,
        uint256 amount,
        address zrc20,
        bytes message,
        CallOptions callOptions,
        RevertOptions revertOptions
    );

    event CallCalled(
        bytes receiver,
        address zrc20,
        bytes message,
        CallOptions callOptions,
        RevertOptions revertOptions
    );

    bool public shouldRevert = false;
    string public revertMessage = "Gateway revert";

    function setShouldRevert(bool _shouldRevert, string memory _message) external {
        shouldRevert = _shouldRevert;
        revertMessage = _message;
    }

    function withdraw(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        RevertOptions calldata revertOptions
    ) external override {
        if (shouldRevert) {
            revert(revertMessage);
        }

        emit WithdrawCalled(receiver, amount, zrc20, revertOptions);
    }

    function withdrawAndCall(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    ) external override {
        if (shouldRevert) {
            revert(revertMessage);
        }

        emit WithdrawAndCallCalled(receiver, amount, zrc20, message, callOptions, revertOptions);
    }

    function call(
        bytes memory receiver,
        address zrc20,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    ) external override {
        if (shouldRevert) {
            revert(revertMessage);
        }

        emit CallCalled(receiver, zrc20, message, callOptions, revertOptions);
    }
}