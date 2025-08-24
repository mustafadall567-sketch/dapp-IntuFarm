# StableCoin Farming dApp

A security-hardened stablecoin farming application built on the Intuition testnet. Stake sUSD tokens to earn RWD rewards with advanced security features and emergency controls.

## 🌟 Features

- **Custom Stablecoin (sUSD)**: ERC-20 with EIP-2612 permit functionality
- **Reward Token (RWD)**: ERC-20 with controlled minting for rewards
- **Farming Vault**: Secure staking contract with precise reward accounting
- **Security-First Design**: Reentrancy guards, access controls, emergency pause
- **Web Interface**: Modern React/Next.js frontend with Web3 integration
- **Admin Controls**: Comprehensive admin panel for vault management
- **Emergency Features**: Emergency withdraw and pause functionality

## 🔒 Security Features

- **Access Control**: Role-based permissions (Admin, Pauser, Treasurer)
- **Reentrancy Protection**: All external functions protected
- **Lock Period**: 7-day lock period prevents flash loan attacks
- **Emergency Controls**: Pause functionality and emergency withdraw
- **Comprehensive Testing**: 100% test coverage on critical functions
- **OpenZeppelin**: Built on battle-tested OpenZeppelin contracts

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm/yarn/pnpm
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd stablecoin-farming-dapp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your configuration
