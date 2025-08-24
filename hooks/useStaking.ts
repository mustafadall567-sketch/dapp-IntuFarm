import { useAccount } from 'wagmi';
import { useContractRead, useMultipleContractRead } from './useContract';
import { CONTRACTS } from '@/lib/contracts';
import { useCallback } from 'react';

interface UserInfo {
  amount: bigint;
  rewardDebt: bigint;
  lastDeposit: bigint;
  pendingRewards: bigint;
  unlockTime: bigint;
}

interface StakingStats {
  totalStaked: bigint;
  rewardRate: bigint;
  rewardEndTime: bigint;
  accRewardPerShare: bigint;
}

interface TokenBalances {
  sUSD: bigint;
  RWD: bigint;
}

/**
 * Comprehensive hook for staking-related data and operations
 */
export function useStaking() {
  const { address } = useAccount();

  // User-specific data
  const { data: userInfoRaw, refetch: refetchUserInfo, isLoading: userInfoLoading } = useContractRead<readonly [bigint, bigint, bigint, bigint, bigint]>({
    address: CONTRACTS.farmingVault.address,
    abi: CONTRACTS.farmingVault.abi,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  const { data: pendingRewards, refetch: refetchPendingRewards } = useContractRead<bigint>({
    address: CONTRACTS.farmingVault.address,
    abi: CONTRACTS.farmingVault.abi,
    functionName: 'pendingReward',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Vault statistics
  const { data: stakingStatsRaw, refetch: refetchStakingStats } = useContractRead<readonly [bigint, bigint, bigint, bigint]>({
    address: CONTRACTS.farmingVault.address,
    abi: CONTRACTS.farmingVault.abi,
    functionName: 'getVaultStats',
    watch: true,
  });

  // Token balances
  const { data: balancesRaw, refetch: refetchBalances } = useMultipleContractRead([
    {
      address: CONTRACTS.stableUSD.address,
      abi: CONTRACTS.stableUSD.abi,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
      key: 'sUSD' as const,
    },
    {
      address: CONTRACTS.rewardToken.address,
      abi: CONTRACTS.rewardToken.abi,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
      key: 'RWD' as const,
    },
  ]);

  // Additional vault parameters
  const { data: lockPeriod } = useContractRead<bigint>({
    address: CONTRACTS.farmingVault.address,
    abi: CONTRACTS.farmingVault.abi,
    functionName: 'lockPeriod',
  });

  const { data: minStakeAmount } = useContractRead<bigint>({
    address: CONTRACTS.farmingVault.address,
    abi: CONTRACTS.farmingVault.abi,
    functionName: 'minStakeAmount',
  });

  const { data: maxStakeAmount } = useContractRead<bigint>({
    address: CONTRACTS.farmingVault.address,
    abi: CONTRACTS.farmingVault.abi,
    functionName: 'maxStakeAmount',
  });

  const { data: emergencyWithdrawFee } = useContractRead<bigint>({
    address: CONTRACTS.farmingVault.address,
    abi: CONTRACTS.farmingVault.abi,
    functionName: 'emergencyWithdrawFee',
  });

  const { data: isPaused } = useContractRead<boolean>({
    address: CONTRACTS.farmingVault.address,
    abi: CONTRACTS.farmingVault.abi,
    functionName: 'paused',
  });

  // Process raw data into structured objects
  const userInfo: UserInfo | null = userInfoRaw ? {
    amount: userInfoRaw[0],
    rewardDebt: userInfoRaw[1],
    lastDeposit: userInfoRaw[2],
    pendingRewards: userInfoRaw[3],
    unlockTime: userInfoRaw[4],
  } : null;

  const stakingStats: StakingStats | null = stakingStatsRaw ? {
    totalStaked: stakingStatsRaw[0],
    rewardRate: stakingStatsRaw[1],
    rewardEndTime: stakingStatsRaw[2],
    accRewardPerShare: stakingStatsRaw[3],
  } : null;

  const balances: TokenBalances | null = balancesRaw.data.sUSD !== undefined && balancesRaw.data.RWD !== undefined ? {
    sUSD: balancesRaw.data.sUSD as bigint,
    RWD: balancesRaw.data.RWD as bigint,
  } : null;

  // Computed values
  const isStaked = userInfo ? userInfo.amount > 0n : false;
  const canWithdraw = userInfo ? 
    userInfo.amount > 0n && (Number(userInfo.unlockTime) <= Math.floor(Date.now() / 1000)) : false;
  const hasRewards = pendingRewards ? pendingRewards > 0n : false;
  const timeUntilUnlock = userInfo && Number(userInfo.unlockTime) > Math.floor(Date.now() / 1000) ?
    Number(userInfo.unlockTime) - Math.floor(Date.now() / 1000) : 0;

  // APR calculation
  const currentAPR = stakingStats && stakingStats.totalStaked > 0n && stakingStats.rewardRate > 0n ?
    calculateAPR(stakingStats.rewardRate, stakingStats.totalStaked) : 0;

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchUserInfo();
    refetchPendingRewards();
    refetchStakingStats();
    refetchBalances();
  }, [refetchUserInfo, refetchPendingRewards, refetchStakingStats, refetchBalances]);

  return {
    // Raw data
    userInfo,
    pendingRewards: pendingRewards || 0n,
    stakingStats,
    balances,
    
    // Vault parameters
    lockPeriod: lockPeriod || 0n,
    minStakeAmount: minStakeAmount || 0n,
    maxStakeAmount: maxStakeAmount || 0n,
    emergencyWithdrawFee: emergencyWithdrawFee || 0n,
    isPaused: isPaused || false,
    
    // Computed values
    isStaked,
    canWithdraw,
    hasRewards,
    timeUntilUnlock,
    currentAPR,
    
    // Loading states
    isLoading: userInfoLoading || balancesRaw.isLoading,
    
    // Refetch functions
    refetchAll,
    refetchUserInfo,
    refetchPendingRewards,
    refetchStakingStats,
    refetchBalances,
  };
}

/**
 * Hook for admin-specific staking data
 */
export function useStakingAdmin() {
  const { address } = useAccount();
  
  // Admin-specific data queries
  const { data: rewardTokenBalance } = useContractRead<bigint>({
    address: CONTRACTS.rewardToken.address,
    abi: CONTRACTS.rewardToken.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  const { data: vaultRewardBalance } = useContractRead<bigint>({
    address: CONTRACTS.rewardToken.address,
    abi: CONTRACTS.rewardToken.abi,
    functionName: 'balanceOf',
    args: [CONTRACTS.farmingVault.address],
    watch: true,
  });

  const { data: totalSupplyStableUSD } = useContractRead<bigint>({
    address: CONTRACTS.stableUSD.address,
    abi: CONTRACTS.stableUSD.abi,
    functionName: 'totalSupply',
  });

  const { data: totalSupplyRewardToken } = useContractRead<bigint>({
    address: CONTRACTS.rewardToken.address,
    abi: CONTRACTS.rewardToken.abi,
    functionName: 'totalSupply',
  });

  return {
    rewardTokenBalance: rewardTokenBalance || 0n,
    vaultRewardBalance: vaultRewardBalance || 0n,
    totalSupplyStableUSD: totalSupplyStableUSD || 0n,
    totalSupplyRewardToken: totalSupplyRewardToken || 0n,
  };
}

/**
 * Hook for staking analytics and statistics
 */
export function useStakingAnalytics() {
  const { stakingStats } = useStaking();
  
  // Calculate various metrics
  const metrics = React.useMemo(() => {
    if (!stakingStats) {
      return {
        totalValueLocked: 0n,
        dailyRewards: 0n,
        weeklyRewards: 0n,
        monthlyRewards: 0n,
        yearlyRewards: 0n,
        rewardsPerDay: 0n,
        utilizationRate: 0,
      };
    }

    const secondsPerDay = 24 * 60 * 60;
    const secondsPerWeek = 7 * secondsPerDay;
    const secondsPerMonth = 30 * secondsPerDay;
    const secondsPerYear = 365 * secondsPerDay;

    const dailyRewards = stakingStats.rewardRate * BigInt(secondsPerDay);
    const weeklyRewards = stakingStats.rewardRate * BigInt(secondsPerWeek);
    const monthlyRewards = stakingStats.rewardRate * BigInt(secondsPerMonth);
    const yearlyRewards = stakingStats.rewardRate * BigInt(secondsPerYear);

    return {
      totalValueLocked: stakingStats.totalStaked,
      dailyRewards,
      weeklyRewards,
      monthlyRewards,
      yearlyRewards,
      rewardsPerDay: dailyRewards,
      utilizationRate: 0, // Would need max pool size to calculate
    };
  }, [stakingStats]);

  return metrics;
}

/**
 * Calculate APR based on reward rate and total staked
 */
function calculateAPR(rewardRatePerSecond: bigint, totalStaked: bigint): number {
  if (totalStaked === 0n || rewardRatePerSecond === 0n) {
    return 0;
  }
  
  const secondsPerYear = 365 * 24 * 60 * 60;
  const annualRewards = Number(rewardRatePerSecond) * secondsPerYear;
  const totalStakedNumber = Number(totalStaked) / Math.pow(10, 18);
  const annualRewardsNumber = annualRewards / Math.pow(10, 18);
  
  return (annualRewardsNumber / totalStakedNumber) * 100;
}
