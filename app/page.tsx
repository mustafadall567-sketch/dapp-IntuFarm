'use client';

import { useState } from 'react';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 animate-gradient-shift">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="intufarm-logo animate-pulse-soft">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">IF</span>
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent mb-6 animate-slide-up">
            IntuFarm
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed animate-slide-up-delayed">
            Stake your sUSD tokens to earn RWD rewards on the Intuition testnet. 
            Secure, transparent, and decentralized yield farming.
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-12 animate-fade-in-up">
          <button 
            onClick={() => setIsConnected(!isConnected)}
            className="btn-primary-dark transform hover:scale-105 transition-all duration-300 ease-out"
          >
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              {isConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
            </span>
          </button>
        </div>

        {/* Main Content */}
        {isConnected ? (
          <div className="space-y-8 animate-fade-in-up-slow">
            {/* Network Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-500">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                Network Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="group hover:transform hover:scale-105 transition-all duration-300">
                  <span className="font-medium text-gray-400 group-hover:text-emerald-400 transition-colors">Network:</span>
                  <p className="text-emerald-400 font-semibold text-lg">Intuition Testnet</p>
                </div>
                <div className="group hover:transform hover:scale-105 transition-all duration-300">
                  <span className="font-medium text-gray-400 group-hover:text-teal-400 transition-colors">Chain ID:</span>
                  <p className="text-teal-400 font-semibold text-lg">{process.env.NEXT_PUBLIC_CHAIN_ID || '13579'}</p>
                </div>
                <div className="group hover:transform hover:scale-105 transition-all duration-300">
                  <span className="font-medium text-gray-400 group-hover:text-cyan-400 transition-colors">Connected:</span>
                  <p className="text-cyan-400 font-mono text-sm bg-slate-700/50 px-3 py-1 rounded-lg">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x1234...5678'}
                  </p>
                </div>
              </div>
            </div>

            {/* Staking Interface - Coming Soon */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-500 group">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">🚀</span>
                </div>
                Staking Interface
              </h2>
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
                <p className="text-gray-300 text-lg leading-relaxed">
                  Advanced staking functionality will be available once smart contracts are deployed.
                  Get ready to earn competitive yields on your digital assets.
                </p>
                <div className="mt-4 flex gap-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                  <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>

            {/* Admin Panel - Coming Soon */}
            {isConnected && address === '0x1234567890123456789012345678901234567890' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-orange-500/50 hover:border-orange-500/80 transition-all duration-500">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <span className="text-xl">⚡</span>
                  </div>
                  Admin Panel
                </h2>
                <p className="text-gray-300 text-lg">
                  Admin functionality will be available once contracts are deployed.
                </p>
              </div>
            )}

            {/* Complex components will be available after contract deployment */}

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-amber-300 mb-2">
                    Testnet Environment
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    This is a testnet deployment on Intuition Network. Use only testnet tokens for experimentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-lg mx-auto border border-slate-700/50">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
                  <span className="text-3xl">🌟</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Welcome to IntuFarm
              </h2>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Connect your wallet to start farming rewards with your sUSD tokens on the Intuition testnet.
              </p>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <span className="text-gray-400">Lock Period:</span>
                  <span className="font-semibold text-emerald-400">7 days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <span className="text-gray-400">Min Stake:</span>
                  <span className="font-semibold text-teal-400">1 sUSD</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <span className="text-gray-400">Max Stake:</span>
                  <span className="font-semibold text-cyan-400">1,000,000 sUSD</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-400 animate-fade-in">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
            <p className="mb-2">
              Built with security-first principles on the Intuition Network
            </p>
            <p className="text-xs text-gray-500">
              IntuFarm © 2025 - Advanced DeFi Yield Farming Platform
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
