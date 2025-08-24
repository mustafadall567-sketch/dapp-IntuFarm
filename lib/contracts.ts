import { Address } from 'viem';

// Contract ABIs (essential functions only)
export const STABLE_USD_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const REWARD_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const FARMING_VAULT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "exit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "pendingReward",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserInfo",
    "outputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "rewardDebt", "type": "uint256"},
      {"internalType": "uint256", "name": "lastDeposit", "type": "uint256"},
      {"internalType": "uint256", "name": "pendingRewards", "type": "uint256"},
      {"internalType": "uint256", "name": "unlockTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVaultStats",
    "outputs": [
      {"internalType": "uint256", "name": "_totalStaked", "type": "uint256"},
      {"internalType": "uint256", "name": "_rewardRate", "type": "uint256"},
      {"internalType": "uint256", "name": "_rewardEndTime", "type": "uint256"},
      {"internalType": "uint256", "name": "_accRewardPerShare", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "uint256", "name": "duration", "type": "uint256"}],
    "name": "fundRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_rewardRate", "type": "uint256"}, {"internalType": "uint256", "name": "_duration", "type": "uint256"}],
    "name": "setRewardRate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_lockPeriod", "type": "uint256"}],
    "name": "setLockPeriod",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_minAmount", "type": "uint256"}, {"internalType": "uint256", "name": "_maxAmount", "type": "uint256"}],
    "name": "setStakeLimits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_fee", "type": "uint256"}],
    "name": "setEmergencyWithdrawFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lockPeriod",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minStakeAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxStakeAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdrawFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalStaked",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract addresses - these should be updated after deployment
export const CONTRACT_ADDRESSES = {
  stableUSD: (process.env.NEXT_PUBLIC_STABLE_USD_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  rewardToken: (process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  farmingVault: (process.env.NEXT_PUBLIC_FARMING_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
};

// Contract configurations
export const CONTRACTS = {
  stableUSD: {
    address: CONTRACT_ADDRESSES.stableUSD,
    abi: STABLE_USD_ABI,
  },
  rewardToken: {
    address: CONTRACT_ADDRESSES.rewardToken,
    abi: REWARD_TOKEN_ABI,
  },
  farmingVault: {
    address: CONTRACT_ADDRESSES.farmingVault,
    abi: FARMING_VAULT_ABI,
  },
} as const;

// Chain configuration
export const CHAIN_CONFIG = {
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

// Validation
export function validateContractAddresses(): boolean {
  const isValidAddress = (addr: string) => addr !== '0x0000000000000000000000000000000000000000' && addr.startsWith('0x');
  
  return isValidAddress(CONTRACT_ADDRESSES.stableUSD) &&
         isValidAddress(CONTRACT_ADDRESSES.rewardToken) &&
         isValidAddress(CONTRACT_ADDRESSES.farmingVault);
}

// Helper to get contract by name
export function getContract(name: keyof typeof CONTRACTS) {
  return CONTRACTS[name];
}

// Constants
export const CONSTANTS = {
  DECIMALS: 18,
  MIN_STAKE_AMOUNT: 1,
  MAX_STAKE_AMOUNT: 1000000,
  LOCK_PERIOD_DAYS: 7,
  EMERGENCY_FEE_PERCENT: 10,
  SECONDS_PER_DAY: 24 * 60 * 60,
  BASIS_POINTS: 10000,
} as const;
