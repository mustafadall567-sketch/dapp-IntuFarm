'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

const inter = Inter({ subsets: ['latin'] });

// Configure chains
const intuitionTestnet = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 13579,
  name: 'Intuition Testnet',
  network: 'intuition',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet.rpc.intuition.systems/http:13579'] },
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet.rpc.intuition.systems/http:13579'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: process.env.NEXT_PUBLIC_EXPLORER_URL || '#' },
  },
  testnet: true,
};

const config = getDefaultConfig({
  appName: 'StableCoin Farming dApp',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  chains: [intuitionTestnet],
  ssr: false,
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>StableCoin Farming dApp</title>
        <meta name="description" content="Secure stablecoin farming on Intuition testnet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
