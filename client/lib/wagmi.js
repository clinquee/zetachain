import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Define ZetaChain testnet as primary
const zetaChainTestnet = {
  id: 7001,
  name: 'ZetaChain Athens Testnet',
  iconUrl: 'https://www.zetachain.com/favicon.ico',
  iconBackground: '#fff',
  nativeCurrency: { name: 'ZETA', symbol: 'ZETA', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ZetaChain Explorer',
      url: 'https://zetachain-athens.blockscout.com',
    },
  },
  testnet: true,
};

const sepolia = {
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://ethereum-sepolia.blockpi.network/v1/rpc/public'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
};

const amoy = {
  id: 80002,
  name: 'Polygon Amoy Testnet',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: { name: 'Polygonscan', url: 'https://amoy.polygonscan.com' },
  },
  testnet: true,
};

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

const arbitrumSepolia = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
  },
  testnet: true,
};

const avalancheFuji = {
  id: 43113,
  name: 'Avalanche Fuji Testnet',
  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://api.avax-test.network/ext/bc/C/rpc'],
    },
  },
  blockExplorers: {
    default: { name: 'Snowtrace', url: 'https://testnet.snowtrace.io' },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'ZetaVault',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [
    zetaChainTestnet, // ZetaChain first as primary
    sepolia,
    amoy,
    baseSepolia,
    arbitrumSepolia,
    avalancheFuji,
  ],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        injectedWallet,
        walletConnectWallet,
        coinbaseWallet,
      ],
    },
  ],
  ssr: true,
});
