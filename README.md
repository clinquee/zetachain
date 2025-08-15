# ZetaVault

ZetaVault is an NLP-powered, multi-chain portfolio manager built on [ZetaChain](https://www.zetachain.com).  
It allows users to execute cross-chain token swaps, NFT transfers, and bridging operations using simple natural language commands.

Example commands:
"Diversify my portfolio to 50% ZETA, 30% USDT, and 20% BTC"
"Send my NFT #1452 to 0x123...abc on Polygon"
"Bridge 100 USDT from Ethereum to Binance Smart Chain"


ZetaVault converts your instructions into structured JSON using **Gemini** and executes them through **ZRC-20 contracts** and omnichain smart contracts on ZetaChain.

---

## Features

- **Natural Language Commands**  
  No complex UI or scripting — type commands in plain English.

- **Cross-Chain Bridging**  
  Transfer assets between multiple blockchains without manual bridge interfaces.

- **ZRC-20 Token Management**  
  Swap, transfer, and diversify portfolios seamlessly across chains.

- **NFT Transfers**  
  Send NFTs across chains and wallets using their IDs or metadata.

- **Multi-Chain Execution**  
  Works with all ZetaChain-connected chains for unified asset management.

- **Non-Custodial**  
  Users retain control over their keys; ZetaVault only executes authorized actions.

---

## How It Works

1. **Command Input**  
   The user submits a natural language request.

2. **NLP Parsing with Gemini**  
   The text command is transformed into a structured JSON format containing:
   - Action type (swap, transfer, bridge, etc.)
   - Assets and amounts
   - Chain information
   - Recipient details (if applicable)

3. **Execution via ZetaVaultExtractor**  
   The JSON is processed, and the appropriate smart contract calls are made.

4. **On-Chain Actions**  
   Transactions are executed via ZetaChain’s omnichain contracts, including ZRC-20 token interactions and NFT logic.

---

## Tech Stack

- **Blockchain:** [ZetaChain](https://www.zetachain.com)
- **Token Standard:** ZRC-20
- **Language Processing:** Gemini API
- **Execution Engine:** Custom `ZetaVaultExtractor`
- **Smart Contracts:** Solidity + ZetaChain SDK
- **Backend:** Node.js + Express
- **Frontend (optional):** React.js

---

## Installation

```bash
# Clone the repository
git clone https://github.com/clinquee/zetachain.git
cd zetachain

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Add Gemini API key, ZetaChain RPC URLs, wallet credentials, etc.

# Run locally
npm run dev
