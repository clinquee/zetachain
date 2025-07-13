import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Define ZetaChain networks
const zetaChainTestnet = {
  id: 7001,
  name: 'ZetaChain Athens Testnet',
  iconUrl: 'https://www.zetachain.com/favicon.ico',
  iconBackground: '#fff',
  nativeCurrency: { name: 'ZETA', symbol: 'ZETA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'] },
  },
  blockExplorers: {
    default: { name: 'ZetaChain Explorer', url: 'https://zetachain-athens.blockscout.com' },
  },
  testnet: true,
};

const zetaChainMainnet = {
  id: 7000,
  name: 'ZetaChain Mainnet',
  iconUrl: 'https://www.zetachain.com/favicon.ico',
  iconBackground: '#fff',
  nativeCurrency: { name: 'ZETA', symbol: 'ZETA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://zetachain-evm.blockpi.network/v1/rpc/public'] },
  },
  blockExplorers: {
    default: { name: 'ZetaChain Explorer', url: 'https://zetachain.blockscout.com' },
  },
};

export const config = getDefaultConfig({
  appName: 'ZetaVault',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com/
  chains: [zetaChainTestnet, zetaChainMainnet],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        injectedWallet, // This will detect Keplr, Leap, etc.
        walletConnectWallet,
        coinbaseWallet,
      ],
    },
  ],
  ssr: true,
});