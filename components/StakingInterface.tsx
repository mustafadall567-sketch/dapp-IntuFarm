'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useStaking } from '@/hooks/useStaking';
import { CONTRACTS } from '@/lib/contracts';

export default function StakingInterface() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'claim'>('stake');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    userInfo,
    pendingRewards,
    stakingStats,
    balances,
    refetchAll
  } = useStaking();

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Reset form and refetch data on successful transaction
  useEffect(() => {
    if (isSuccess) {
      setAmount('');
      refetchAll();
    }
  }, [isSuccess, refetchAll]);

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      
      // For now, always approve first - a more sophisticated approach would check allowance
      if (true) {
        writeContract({
          ...CONTRACTS.stableUSD,
          functionName: 'approve',
          args: [CONTRACTS.farmingVault.address, amountWei],
        });
      } else {
        writeContract({
          ...CONTRACTS.farmingVault,
          functionName: 'deposit',
          args: [amountWei],
        });
      }
    } catch (err) {
      console.error('Staking error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      setIsLoading(true);
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: 'withdraw',
        args: [parseEther(amount)],
      });
    } catch (err) {
      console.error('Unstaking error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: 'claim',
        args: [],
      });
    } catch (err) {
      console.error('Claim error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!confirm('Emergency withdraw will forfeit all pending rewards and incur a fee. Continue?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: 'emergencyWithdraw',
        args: [],
      });
    } catch (err) {
      console.error('Emergency withdraw error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isWithdrawLocked = userInfo && userInfo.unlockTime > Date.now() / 1000;
  const timeUntilUnlock = isWithdrawLocked 
    ? Math.ceil((Number(userInfo.unlockTime) - Date.now() / 1000) / (24 * 60 * 60))
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Stake</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {userInfo ? formatEther(userInfo.amount) : '0'} sUSD
          </p>
          {isWithdrawLocked && (
            <p className="text-sm text-orange-600 mt-1">
              Locked for {timeUntilUnlock} more days
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Rewards</h3>
          <p className="text-3xl font-bold text-green-600">
            {pendingRewards ? formatEther(pendingRewards) : '0'} RWD
          </p>
          <button
            onClick={handleClaim}
            disabled={!pendingRewards || pendingRewards === 0n || isPending || isConfirming}
            className="mt-2 text-sm btn-primary py-1 px-3"
          >
            Claim Rewards
          </button>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Staked</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stakingStats ? formatEther(stakingStats.totalStaked) : '0'} sUSD
          </p>
          <p className="text-sm text-gray-600 mt-1">
            APR: ~{stakingStats ? calculateAPR(stakingStats) : '0'}%
          </p>
        </div>
      </div>

      {/* Balances */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Balances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">sUSD Balance:</span>
            <span className="font-mono font-semibold">
              {balances?.sUSD ? formatEther(balances.sUSD) : '0'} sUSD
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-700">RWD Balance:</span>
            <span className="font-mono font-semibold">
              {balances?.RWD ? formatEther(balances.RWD) : '0'} RWD
            </span>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="card">
        <div className="flex space-x-1 mb-6">
          {(['stake', 'unstake', 'claim'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stake Tab */}
        {activeTab === 'stake' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Stake (sUSD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="input-field pr-16"
                  min="1"
                  step="0.1"
                />
                <button
                  onClick={() => {
                    if (balances?.sUSD) {
                      setAmount(formatEther(balances.sUSD));
                    }
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum: 1 sUSD • Maximum: 1,000,000 sUSD
              </p>
            </div>

            <button
              onClick={handleStake}
              disabled={!amount || parseFloat(amount) < 1 || isPending || isConfirming || isLoading}
              className="w-full btn-primary"
            >
              {isPending || isConfirming || isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2" />
                  {isPending ? 'Confirming...' : 'Processing...'}
                </span>
              ) : (
                'Stake sUSD'
              )}
            </button>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <p><strong>Lock Period:</strong> 7 days from deposit</p>
              <p><strong>Rewards:</strong> Start accruing immediately</p>
              <p><strong>Gas Fee:</strong> Paid in ETH</p>
            </div>
          </div>
        )}

        {/* Unstake Tab */}
        {activeTab === 'unstake' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Unstake (sUSD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="input-field pr-16"
                  min="0"
                  step="0.1"
                  max={userInfo ? formatEther(userInfo.amount) : '0'}
                />
                <button
                  onClick={() => {
                    if (userInfo) {
                      setAmount(formatEther(userInfo.amount));
                    }
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {userInfo ? formatEther(userInfo.amount) : '0'} sUSD
              </p>
            </div>

            {isWithdrawLocked && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-orange-700">
                      Your funds are locked for {timeUntilUnlock} more days. 
                      You can use emergency withdraw to exit early (with penalty).
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleUnstake}
              disabled={!amount || parseFloat(amount) <= 0 || isWithdrawLocked || isPending || isConfirming || isLoading}
              className="w-full btn-primary"
            >
              {isPending || isConfirming || isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2" />
                  Processing...
                </span>
              ) : (
                'Unstake sUSD'
              )}
            </button>

            {userInfo && userInfo.amount > 0n && (
              <div className="pt-4 border-t">
                <button
                  onClick={handleEmergencyWithdraw}
                  className="w-full btn-danger text-sm"
                  disabled={isPending || isConfirming || isLoading}
                >
                  Emergency Withdraw (10% fee)
                </button>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Emergency withdraw forfeits all pending rewards and charges a 10% fee
                </p>
              </div>
            )}
          </div>
        )}

        {/* Claim Tab */}
        {activeTab === 'claim' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {pendingRewards ? formatEther(pendingRewards) : '0'} RWD
              </h3>
              <p className="text-gray-600">Available to claim</p>
            </div>

            <button
              onClick={handleClaim}
              disabled={!pendingRewards || pendingRewards === 0n || isPending || isConfirming || isLoading}
              className="w-full btn-primary"
            >
              {isPending || isConfirming || isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2" />
                  Processing...
                </span>
              ) : (
                'Claim All Rewards'
              )}
            </button>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <p><strong>Note:</strong> Claiming rewards doesn't affect your staked amount</p>
              <p><strong>Gas Fee:</strong> Paid in ETH</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Transaction failed: {error.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function calculateAPR(stats: any): string {
  if (!stats.rewardRate || !stats.totalStaked || stats.totalStaked === 0n) {
    return '0';
  }
  
  // Annual rewards = rate per second * seconds per year
  const annualRewards = stats.rewardRate * BigInt(365 * 24 * 60 * 60);
  const apr = (Number(annualRewards) / Number(stats.totalStaked)) * 100;
  
  return apr.toFixed(2);
}
