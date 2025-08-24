'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

export default function AdminPanel() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'rewards' | 'config' | 'emergency'>('rewards');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardDuration, setRewardDuration] = useState('30');
  const [newLockPeriod, setNewLockPeriod] = useState('');
  const [newMinStake, setNewMinStake] = useState('');
  const [newMaxStake, setNewMaxStake] = useState('');
  const [newEmergencyFee, setNewEmergencyFee] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintAddress, setMintAddress] = useState('');

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read current vault configuration
  const { data: vaultStats } = useReadContract({
    ...CONTRACTS.farmingVault,
    functionName: 'getVaultStats',
  });

  const { data: lockPeriod } = useReadContract({
    ...CONTRACTS.farmingVault,
    functionName: 'lockPeriod',
  });

  const { data: minStakeAmount } = useReadContract({
    ...CONTRACTS.farmingVault,
    functionName: 'minStakeAmount',
  });

  const { data: maxStakeAmount } = useReadContract({
    ...CONTRACTS.farmingVault,
    functionName: 'maxStakeAmount',
  });

  const { data: emergencyFee } = useReadContract({
    ...CONTRACTS.farmingVault,
    functionName: 'emergencyWithdrawFee',
  });

  const { data: isPaused } = useReadContract({
    ...CONTRACTS.farmingVault,
    functionName: 'paused',
  });

  const { data: rewardTokenBalance } = useReadContract({
    ...CONTRACTS.rewardToken,
    functionName: 'balanceOf',
    args: [address],
  });

  // Reset forms on successful transaction
  useEffect(() => {
    if (isSuccess) {
      setRewardAmount('');
      setMintAmount('');
      setMintAddress('');
    }
  }, [isSuccess]);

  const handleFundRewards = async () => {
    if (!rewardAmount || !rewardDuration) return;
    
    try {
      const amount = parseEther(rewardAmount);
      const duration = parseInt(rewardDuration) * 24 * 60 * 60; // Convert days to seconds
      
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: 'fundRewards',
        args: [amount, BigInt(duration)],
      });
    } catch (err) {
      console.error('Fund rewards error:', err);
    }
  };

  const handleSetRewardRate = async () => {
    if (!rewardAmount || !rewardDuration) return;
    
    try {
      const amount = parseEther(rewardAmount);
      const duration = parseInt(rewardDuration) * 24 * 60 * 60; // Convert days to seconds
      const rate = amount / BigInt(duration);
      
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: 'setRewardRate',
        args: [rate, BigInt(duration)],
      });
    } catch (err) {
      console.error('Set reward rate error:', err);
    }
  };

  const handleSetLockPeriod = async () => {
    if (!newLockPeriod) return;
    
    try {
      const lockSeconds = parseInt(newLockPeriod) * 24 * 60 * 60; // Convert days to seconds
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: 'setLockPeriod',
        args: [BigInt(lockSeconds)],
      });
    } catch (err) {
      console.error('Set lock period error:', err);
    }
  };

  const handleSetStakeLimits = async () => {
    if (!newMinStake || !newMaxStake) return;
    
    try {
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: 'setStakeLimits',
        args: [parseEther(newMinStake), parseEther(newMaxStake)],
      });
    } catch (err) {
      console.error('Set stake limits error:', err);
    }
  };

  const handleSetEmergencyFee = async () => {
    if (!newEmergencyFee) return;
    
    try {
      const fee = parseInt(newEmergencyFee) * 100; // Convert percentage to basis points
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: 'setEmergencyWithdrawFee',
        args: [BigInt(fee)],
      });
    } catch (err) {
      console.error('Set emergency fee error:', err);
    }
  };

  const handlePauseToggle = async () => {
    try {
      writeContract({
        ...CONTRACTS.farmingVault,
        functionName: isPaused ? 'unpause' : 'pause',
        args: [],
      });
    } catch (err) {
      console.error('Pause toggle error:', err);
    }
  };

  const handleMintTokens = async () => {
    if (!mintAmount || !mintAddress) return;
    
    try {
      writeContract({
        ...CONTRACTS.stableUSD,
        functionName: 'mint',
        args: [mintAddress as `0x${string}`, parseEther(mintAmount)],
      });
    } catch (err) {
      console.error('Mint tokens error:', err);
    }
  };

  const handleApproveRewards = async () => {
    if (!rewardAmount) return;
    
    try {
      writeContract({
        ...CONTRACTS.rewardToken,
        functionName: 'approve',
        args: [CONTRACTS.farmingVault.address, parseEther(rewardAmount)],
      });
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-r-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.5 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-xl font-semibold text-orange-900">Admin Panel</h2>
            <p className="text-sm text-orange-700">
              Administrative functions for the farming vault. Use with caution.
            </p>
          </div>
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Total Staked</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {vaultStats ? formatEther(vaultStats[0]) : '0'} sUSD
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Reward Rate</h3>
          <p className="text-2xl font-bold text-green-600">
            {vaultStats ? formatEther(vaultStats[1]) : '0'} RWD/sec
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Lock Period</h3>
          <p className="text-2xl font-bold text-purple-600">
            {lockPeriod ? Number(lockPeriod) / (24 * 60 * 60) : '0'} days
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Status</h3>
          <p className={`text-2xl font-bold ${isPaused ? 'text-red-600' : 'text-green-600'}`}>
            {isPaused ? 'Paused' : 'Active'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex space-x-1 mb-6">
          {(['rewards', 'config', 'emergency'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Reward Management</h3>
            
            {/* Current Reward Token Balance */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Your RWD Balance</h4>
              <p className="text-2xl font-bold text-blue-600">
                {rewardTokenBalance ? formatEther(rewardTokenBalance) : '0'} RWD
              </p>
            </div>

            {/* Fund Rewards */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Fund Vault with Rewards</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Amount (RWD)
                  </label>
                  <input
                    type="number"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="10000"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={rewardDuration}
                    onChange={(e) => setRewardDuration(e.target.value)}
                    placeholder="30"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleApproveRewards}
                  disabled={!rewardAmount || isPending || isConfirming}
                  className="btn-secondary"
                >
                  1. Approve RWD
                </button>
                <button
                  onClick={handleFundRewards}
                  disabled={!rewardAmount || !rewardDuration || isPending || isConfirming}
                  className="btn-primary"
                >
                  2. Fund Vault
                </button>
              </div>
              
              <p className="text-sm text-gray-600">
                Rate: {rewardAmount && rewardDuration ? 
                  (parseFloat(rewardAmount) / (parseInt(rewardDuration) * 24 * 60 * 60)).toFixed(8) : '0'} RWD/second
              </p>
            </div>

            {/* Set Reward Rate */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-medium text-gray-900">Set Reward Rate (Alternative)</h4>
              <button
                onClick={handleSetRewardRate}
                disabled={!rewardAmount || !rewardDuration || isPending || isConfirming}
                className="btn-secondary"
              >
                Set Reward Rate Only
              </button>
              <p className="text-xs text-gray-500">
                Use this if rewards are already in the vault
              </p>
            </div>

            {/* Mint Tokens */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-medium text-gray-900">Mint sUSD Tokens (Testnet Only)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (sUSD)
                  </label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="1000"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={mintAddress}
                    onChange={(e) => setMintAddress(e.target.value)}
                    placeholder="0x..."
                    className="input-field"
                  />
                </div>
              </div>
              <button
                onClick={handleMintTokens}
                disabled={!mintAmount || !mintAddress || isPending || isConfirming}
                className="btn-secondary"
              >
                Mint sUSD Tokens
              </button>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Vault Configuration</h3>
            
            {/* Current Settings */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Current Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Lock Period:</span>
                  <span className="ml-2 font-mono">
                    {lockPeriod ? Number(lockPeriod) / (24 * 60 * 60) : '0'} days
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Min Stake:</span>
                  <span className="ml-2 font-mono">
                    {minStakeAmount ? formatEther(minStakeAmount) : '0'} sUSD
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Max Stake:</span>
                  <span className="ml-2 font-mono">
                    {maxStakeAmount ? formatEther(maxStakeAmount) : '0'} sUSD
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Emergency Fee:</span>
                  <span className="ml-2 font-mono">
                    {emergencyFee ? Number(emergencyFee) / 100 : '0'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Update Lock Period */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Update Lock Period</h4>
              <div className="flex space-x-3">
                <input
                  type="number"
                  value={newLockPeriod}
                  onChange={(e) => setNewLockPeriod(e.target.value)}
                  placeholder="7"
                  className="input-field flex-1"
                />
                <button
                  onClick={handleSetLockPeriod}
                  disabled={!newLockPeriod || isPending || isConfirming}
                  className="btn-primary"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-gray-500">Lock period in days</p>
            </div>

            {/* Update Stake Limits */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Update Stake Limits</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="number"
                  value={newMinStake}
                  onChange={(e) => setNewMinStake(e.target.value)}
                  placeholder="Min stake (sUSD)"
                  className="input-field"
                />
                <input
                  type="number"
                  value={newMaxStake}
                  onChange={(e) => setNewMaxStake(e.target.value)}
                  placeholder="Max stake (sUSD)"
                  className="input-field"
                />
                <button
                  onClick={handleSetStakeLimits}
                  disabled={!newMinStake || !newMaxStake || isPending || isConfirming}
                  className="btn-primary"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Update Emergency Fee */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Update Emergency Withdraw Fee</h4>
              <div className="flex space-x-3">
                <input
                  type="number"
                  value={newEmergencyFee}
                  onChange={(e) => setNewEmergencyFee(e.target.value)}
                  placeholder="10"
                  min="0"
                  max="50"
                  className="input-field flex-1"
                />
                <button
                  onClick={handleSetEmergencyFee}
                  disabled={!newEmergencyFee || isPending || isConfirming}
                  className="btn-primary"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-gray-500">Fee percentage (max 50%)</p>
            </div>
          </div>
        )}

        {/* Emergency Tab */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Emergency Controls</h3>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> Emergency controls should only be used in critical situations. 
                    Always communicate with users before taking emergency actions.
                  </p>
                </div>
              </div>
            </div>

            {/* Pause/Unpause */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Pause Contract</h4>
              <div className="flex items-center space-x-4">
                <div className={`status-${isPaused ? 'error' : 'success'}`}>
                  {isPaused ? 'Contract Paused' : 'Contract Active'}
                </div>
                <button
                  onClick={handlePauseToggle}
                  disabled={isPending || isConfirming}
                  className={`${isPaused ? 'btn-primary' : 'btn-danger'}`}
                >
                  {isPaused ? 'Unpause Contract' : 'Pause Contract'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {isPaused 
                  ? 'Contract is paused. Users cannot deposit, withdraw, or claim rewards.'
                  : 'Contract is active. Users can perform all operations.'
                }
              </p>
            </div>

            {/* Contract Addresses */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-medium text-gray-900">Contract Addresses</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">StableUSD:</span>
                  <span className="text-indigo-600">{CONTRACTS.stableUSD.address}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">RewardToken:</span>
                  <span className="text-green-600">{CONTRACTS.rewardToken.address}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">FarmingVault:</span>
                  <span className="text-purple-600">{CONTRACTS.farmingVault.address}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {(isPending || isConfirming) && (
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="spinner" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {isPending ? 'Waiting for wallet confirmation...' : 'Transaction confirming...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
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
