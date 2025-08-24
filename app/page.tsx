'use client';

import { useState, useEffect } from 'react';
import WalletConnect from '@/components/WalletConnect';
import StakingInterface from '@/components/StakingInterface';
import AdminPanel from '@/components/AdminPanel';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected, address } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if connected address is admin (simplified check)
  useEffect(() => {
    if (address) {
      // In a real app, you'd check this against the contract
      // For demo purposes, we'll use environment variable
      const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
      setIsAdmin(address.toLowerCase() === adminAddress);
    } else {
      setIsAdmin(false);
    }
  }, [address]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            StableCoin Farming dApp
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stake your sUSD tokens to earn RWD rewards on the Intuition testnet. 
            Secure, transparent, and decentralized yield farming.
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-8">
          <WalletConnect />
        </div>

        {/* Main Content */}
        {isConnected ? (
          <div className="space-y-8">
            {/* Network Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Network Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Network:</span>
                  <p className="text-indigo-600">Intuition Testnet</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Chain ID:</span>
                  <p className="text-indigo-600">{process.env.NEXT_PUBLIC_CHAIN_ID}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Connected:</span>
                  <p className="text-green-600 font-mono text-xs">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Staking Interface */}
            <StakingInterface />

            {/* Admin Panel (only for admin users) */}
            {isAdmin && (
              <div className="border-t-4 border-orange-500">
                <AdminPanel />
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Testnet Notice:</strong> This is a testnet deployment for testing purposes only. 
                    Tokens have no real value. Always verify contract addresses before interacting on mainnet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome to StableCoin Farming
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to start farming rewards with your sUSD tokens.
              </p>
              <div className="space-y-4 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Lock Period:</span>
                  <span className="font-medium">7 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Min Stake:</span>
                  <span className="font-medium">1 sUSD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max Stake:</span>
                  <span className="font-medium">1,000,000 sUSD</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>
            Built with security-first principles. Source code available on{' '}
            <a 
              href="#" 
              className="text-indigo-600 hover:text-indigo-800 underline"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
