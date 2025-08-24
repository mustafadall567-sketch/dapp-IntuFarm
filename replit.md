# StableCoin Farming dApp

## Overview

A security-hardened stablecoin farming application built on the Intuition testnet (EVM-compatible). The application enables users to stake sUSD tokens to earn RWD rewards through a sophisticated farming vault system. The project implements a complete DeFi farming ecosystem with custom ERC-20 tokens, secure staking mechanisms, and comprehensive admin controls.

The system consists of three main smart contracts: StableUSD (sUSD) as the staking token with EIP-2612 permit functionality, RewardToken (RWD) for farming rewards, and FarmingVault which handles all staking logic with advanced security features. The frontend is built with Next.js and integrates Web3 functionality through RainbowKit and Wagmi.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with React and TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system including predefined color palettes and component styles
- **Web3 Integration**: RainbowKit for wallet connections, Wagmi for blockchain interactions, and Viem for low-level Ethereum operations
- **State Management**: React hooks with custom abstractions for contract interactions and staking data
- **Component Structure**: Modular components including WalletConnect, StakingInterface, and AdminPanel with clear separation of concerns

### Backend/Smart Contract Architecture
- **Token Contracts**: Two ERC-20 tokens - StableUSD with permit functionality and RewardToken with controlled minting
- **Farming System**: FarmingVault contract implementing precise reward accounting with time-based distribution
- **Security Patterns**: Implements Checks-Effects-Interactions pattern, reentrancy guards, and pull-over-push for reward distribution
- **Access Control**: Role-based permissions using OpenZeppelin AccessControl with Admin, Pauser, and Treasurer roles
- **Emergency Controls**: Pause functionality and emergency withdrawal mechanisms with fee structures

### Development Infrastructure
- **Smart Contract Development**: Hardhat with TypeScript for compilation, testing, and deployment
- **Testing Strategy**: Comprehensive test suites covering unit tests, integration tests, and full user journey scenarios
- **Deployment Scripts**: Automated deployment pipeline with post-deployment configuration for contract setup
- **Network Configuration**: Configured for Intuition testnet with custom chain parameters and gas optimization

### Security Design Principles
- **Lock Period Mechanism**: 7-day lock period to prevent flash loan attacks and ensure committed staking
- **Minimum/Maximum Stake Limits**: Configurable bounds to prevent dust attacks and limit exposure
- **Emergency Features**: Admin-controlled pause functionality and emergency withdrawal with penalty fees
- **Time-based Rewards**: Precise reward calculation based on time elapsed and staking duration
- **Input Validation**: Comprehensive validation on all user inputs and state changes

## External Dependencies

### Blockchain Infrastructure
- **Target Network**: Intuition testnet (Chain ID: 13579) at https://testnet.rpc.intuition.systems/http:13579
- **Block Explorer**: Custom explorer integration for transaction verification and contract interaction monitoring

### Smart Contract Dependencies
- **OpenZeppelin Contracts**: Core security and utility contracts including ERC20, AccessControl, ReentrancyGuard, and Pausable
- **Hardhat Toolbox**: Complete development environment with compilation, testing, and deployment tools
- **TypeChain**: Automatic TypeScript bindings generation for smart contracts

### Frontend Dependencies
- **RainbowKit**: Wallet connection interface supporting multiple wallet providers including MetaMask
- **Wagmi**: React hooks for Ethereum interactions with built-in caching and state management
- **Viem**: TypeScript-first Ethereum library for low-level blockchain operations
- **TanStack Query**: Data fetching and caching for blockchain state management

### Development Tools
- **TypeScript**: Full type safety across both frontend and smart contract development
- **Tailwind CSS**: Utility-first CSS framework with custom configuration for DeFi applications
- **Next.js**: Full-stack React framework with optimizations for Web3 applications
- **ESLint/Prettier**: Code quality and formatting tools configured for TypeScript and React

### Environment Configuration
- **Multi-environment Support**: Separate configurations for local development, testnet, and production deployments
- **Environment Variables**: Secure management of private keys, RPC URLs, and contract addresses
- **Gas Optimization**: Configured gas pricing and optimization settings for cost-effective transactions