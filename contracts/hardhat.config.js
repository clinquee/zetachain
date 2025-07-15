require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    zetachain_testnet: {
      url: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      chainId: 7001,
      accounts: process.env.SEPOLIA_API_KEY ? [process.env.SEPOLIA_API_KEY] : [],
      gasPrice: 20000000000,
    }
  },
  etherscan: {
    // Blockscout support for Zetachain testnet
    customChains: [
      {
        network: "zetachain_testnet",
        chainId: 7001,
        urls: {
          apiURL: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
          browserURL: "https://athens.explorer.zetachain.com"
        }
      }
    ],
    apiKey: {
      // Dummy key for ZetaChain testnet
      zetachain_testnet: "ABC123"
    }
  }
};
