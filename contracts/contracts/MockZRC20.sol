// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IZRC20.sol";

contract MockZRC20 is ERC20, IZRC20 {
    uint8 private _decimals;
    uint256 private _chainId;
    uint8 private _coinType;
    address private _feeToken;
    uint256 private _flatFee;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 chainId_,
        uint8 coinType_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _chainId = chainId_;
        _coinType = coinType_;
        _feeToken = address(this);
        _flatFee = 0.001 ether;
    }

    function name() public view override(ERC20, IZRC20) returns (string memory) {
        return super.name();
    }

    function symbol() public view override(ERC20, IZRC20) returns (string memory) {
        return super.symbol();
    }

    function decimals() public view override(ERC20, IZRC20) returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override(ERC20, IZRC20) returns (uint256) {
        return super.totalSupply();
    }

    function balanceOf(address account) public view override(ERC20, IZRC20) returns (uint256) {
        return super.balanceOf(account);
    }

    function transfer(address to, uint256 amount) public override(ERC20, IZRC20) returns (bool) {
        return super.transfer(to, amount);
    }

    function allowance(address owner, address spender) public view override(ERC20, IZRC20) returns (uint256) {
        return super.allowance(owner, spender);
    }

    function approve(address spender, uint256 amount) public override(ERC20, IZRC20) returns (bool) {
        return super.approve(spender, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override(ERC20, IZRC20) returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(uint256 amount) external override returns (bool) {
        _burn(msg.sender, amount);
        return true;
    }

    function deposit(address to, uint256 amount) external override returns (bool) {
        _mint(to, amount);
        return true;
    }

    function withdraw(bytes memory to, uint256 amount) external override returns (bool) {
        _burn(msg.sender, amount);
        // In real implementation, this would trigger cross-chain transfer
        return true;
    }

    function withdrawGasFee() external view override returns (address, uint256) {
        return (_feeToken, _flatFee);
    }

    function withdrawGasFeeWithGasLimit(uint256) external view override returns (address, uint256) {
        return (_feeToken, _flatFee);
    }

    function CHAIN_ID() external view override returns (uint256) {
        return _chainId;
    }

    function COIN_TYPE() external view override returns (uint8) {
        return _coinType;
    }

    function setFeeToken(address token, uint256 fee) external {
        _feeToken = token;
        _flatFee = fee;
    }
}