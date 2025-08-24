# Stablecoin Farming dApp (EVM • Testnet) — README

> Build a full-stack, security-hardened stablecoin farming application from scratch on an EVM-compatible testnet (Intuition testnet RPC).

* **Target network (testnet)**: `https://testnet.rpc.intuition.systems/http:13579`
* **Architecture**: ERC-20 Stablecoin + ERC-20 Reward Token + Staking/Farming Vault (optionally AMM pool)
* **Focus**: Security-first design, reproducible deployments, automated testing, monitoring, and emergency controls

---

## 0) TL;DR

1. **Deploy tokens**: `StableUSD (sUSD)` + `Reward (RWD)`.
2. **Deploy FarmingVault** with:

   * reward rate per second (or per block),
   * lock/withdrawal delay,
   * reward funding address (Treasury).
3. **Fund rewards**: Treasury sends RWD to the vault.
4. **Users**: Deposit `sUSD` → earn `RWD` → claim/withdraw.
5. **Security**: AccessControl + Pausable + ReentrancyGuard + Timelock + Multisig + Audits + Monitoring.

---

## 1) Features

* **Custom Stablecoin (sUSD)**: ERC-20 with EIP-2612 `permit()` for gasless approvals.
* **Reward Token (RWD)**: Simple ERC-20 mint/burn restricted to `MINTER_ROLE`.
* **FarmingVault**: Staking of sUSD to earn RWD with precise accounting and protection against reentrancy/flash-loans.
* **Upgradeable** (optional): UUPS proxy pattern with upgrade timelocks.
* **Role-based access**: `DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE`, `TREASURER_ROLE`, `UPGRADER_ROLE`.
* **Emergency controls**: `pause()`, `unpause()`, emergency withdraw, reward drains locked behind timelock.
* **Monitoring hooks**: events for deposits, withdrawals, reward updates.
* **Comprehensive tests**: unit + integration + property-based (invariants).

---

## 2) Security Overview (Do This!)

* **Solidity**: ≥0.8.24 (built-in overflow checks).
* **Use**: OpenZeppelin contracts (`ERC20`, `ERC20Permit`, `AccessControl`, `ReentrancyGuard`, `Pausable`, `UUPSUpgradeable`, `SafeCast`, `SafeERC20`).
* **Patterns**:

  * Checks-Effects-Interactions
  * Pull over push (users claim rewards)
  * Use `nonReentrant` on state-changing external functions
  * Do not rely on block.timestamp for randomness
  * Snapshot-based reward accounting, no external price oracles required
  * Introduce **lock period** / **cooldown** to mitigate flash-loan abuse
  * Use **TWAP** or **snapshots** if integrating AMM prices
* **Operational Security**:

  * Deploy with **multisig** admin
  * **TimelockController** for upgrades/critical params
  * **.env** secrets kept locally; never commit
  * Restrict RPC keys; use separate deployer vs ops keys
* **Testing**:

  * 100% coverage on vault logic (accruals, rounding, edge cases)
  * Fuzz/invariant tests for conservation (no reward inflation/deflation beyond schedule)
* **Audits**: Internal review checklist + optional external review
* **Bug Bounty**: Minimal rules in repo (see `SECURITY.md`)

---

## 3) Project Structure

```
stablecoin-farm/
├─ contracts/
│  ├─ tokens/
│  │  ├─ StableUSD.sol
│  │  └─ RewardToken.sol
│  ├─ farming/
│  │  └─ FarmingVault.sol
│  ├─ upgrade/
│  │  └─ UUPSProxy.sol (optional)
│  └─ utils/
│     └─ Libraries.sol
├─ script/
│  ├─ 00_deploy_tokens.ts
│  ├─ 01_deploy_vault.ts
│  └─ 02_post_deploy_config.ts
├─ test/
│  ├─ tokens/
│  ├─ farming/
│  └─ integration/
├─ web/
│  ├─ app/ (Next.js)
│  └─ components/
├─ .env.example
├─ hardhat.config.ts
├─ package.json
├─ SECURITY.md
└─ README.md
```

---

## 4) Contracts (High-Level)

### 4.1 StableUSD (sUSD)

* `ERC20Permit` (EIP-2612) for signatures-based approvals
* Mint/burn restricted (`MINTER_ROLE`)
* (Testnet) Centralized mint for ease of UX; **never** do this on mainnet without collateralization design

### 4.2 RewardToken (RWD)

* Plain ERC-20 with `MINTER_ROLE`
* Treasury mints to fund rewards or pre-mint supply

### 4.3 FarmingVault

* Stake asset: `sUSD`
* Reward asset: `RWD`
* Core state:

  * `accRewardPerShare` (scaled by 1e12 or 1e18)
  * `lastUpdate`
  * `rewardRate` (per second)
* User state:

  * `amount`, `rewardDebt`
* Functions:

  * `deposit(amount)` / `withdraw(amount)` / `claim()` / `exit()`
  * `notifyReward(amount, duration)` (or direct `rewardRate` set behind timelock)
  * `pause()` / `unpause()` / `emergencyWithdraw()`
* Protections:

  * `nonReentrant` on external mutating calls
  * internal `_update()` accrual before state changes
  * cooldown / lock period (configurable)

---

## 5) Tokenomics (Testnet Defaults)

* **sUSD**: 18 decimals; mint as needed for testing
* **RWD Emissions**: e.g., 10,000 RWD over 30 days → `rewardRate = 10000e18 / (30 * 24 * 3600)`
* **Deposit limits**: optional per-wallet cap
* **Fees**: 0% (testnet), introduce withdrawal fee only if justified (note: fee contracts are sensitive!)

---

## 6) Development Environment

### 6.1 Prerequisites

* Node.js ≥ 18, pnpm/yarn/npm
* Hardhat or Foundry (below example uses **Hardhat**)
* OpenZeppelin contracts

### 6.2 Install

```bash
pnpm install
# or
npm install
```

### 6.3 Env Vars (`.env`)

```
PRIVATE_KEY=0x...
RPC_INTUITION=https://testnet.rpc.intuition.systems/http:13579
CHAIN_ID= # put chain id here if known (e.g., 424242)
EXPLORER_URL= # optional block explorer URL
TREASURY_ADDRESS=0x...
MULTISIG_ADDRESS=0x...
```

### 6.4 Hardhat Network Config (snippet)

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris"
    }
  },
  networks: {
    intuition: {
      url: process.env.RPC_INTUITION!,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: Number(process.env.CHAIN_ID || 0)
    }
  }
};
export default config;
```

---

## 7) Minimal Interface Snippets

### 7.1 StableUSD.sol (sketch)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract StableUSD is ERC20, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address admin) ERC20("StableUSD", "sUSD") ERC20Permit("StableUSD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
}
```

### 7.2 RewardToken.sol (sketch)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract RewardToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address admin) ERC20("Reward", "RWD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
```

### 7.3 FarmingVault.sol (sketch)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract FarmingVault is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    IERC20 public immutable stakeToken; // sUSD
    IERC20 public immutable rewardToken; // RWD

    uint256 public accRewardPerShare; // 1e18 scale
    uint256 public lastUpdate;
    uint256 public rewardRate; // per second, 1e18 scale

    uint256 public lockPeriod; // seconds

    struct UserInfo { uint256 amount; uint256 rewardDebt; uint256 lastDeposit; }
    mapping(address => UserInfo) public userInfo;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 rewardRate);

    constructor(IERC20 _stake, IERC20 _reward, address admin, uint256 _lock) {
        stakeToken = _stake; rewardToken = _reward; lockPeriod = _lock;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(TREASURER_ROLE, admin);
        lastUpdate = block.timestamp;
    }

    modifier update() {
        if (block.timestamp > lastUpdate) {
            uint256 supply = stakeToken.balanceOf(address(this));
            if (supply > 0 && rewardRate > 0) {
                uint256 delta = block.timestamp - lastUpdate;
                accRewardPerShare += delta * rewardRate * 1e18 / supply;
            }
            lastUpdate = block.timestamp;
        }
        _;
    }

    function setRewardRate(uint256 _rate) external onlyRole(TREASURER_ROLE) update {
        rewardRate = _rate;
        emit RewardRateUpdated(_rate);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function pending(address user) public view returns (uint256) {
        UserInfo memory u = userInfo[user];
        uint256 _acc = accRewardPerShare;
        if (block.timestamp > lastUpdate) {
            uint256 supply = stakeToken.balanceOf(address(this));
            if (supply > 0 && rewardRate > 0) {
                uint256 delta = block.timestamp - lastUpdate;
                _acc += delta * rewardRate * 1e18 / supply;
            }
        }
        return u.amount * _acc / 1e18 - u.rewardDebt;
    }

    function deposit(uint256 amount) external nonReentrant whenNotPaused update {
        UserInfo storage u = userInfo[msg.sender];
        if (u.amount > 0) {
            uint256 p = u.amount * accRewardPerShare / 1e18 - u.rewardDebt;
            if (p > 0) rewardToken.safeTransfer(msg.sender, p);
        }
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);
        u.amount += amount; u.rewardDebt = u.amount * accRewardPerShare / 1e18; u.lastDeposit = block.timestamp;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused update {
        UserInfo storage u = userInfo[msg.sender];
        require(u.amount >= amount, "insufficient");
        require(block.timestamp >= u.lastDeposit + lockPeriod, "locked");
        uint256 p = u.amount * accRewardPerShare / 1e18 - u.rewardDebt;
        if (p > 0) rewardToken.safeTransfer(msg.sender, p);
        u.amount -= amount; u.rewardDebt = u.amount * accRewardPerShare / 1e18;
        stakeToken.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function claim() external nonReentrant whenNotPaused update {
        UserInfo storage u = userInfo[msg.sender];
        uint256 p = u.amount * accRewardPerShare / 1e18 - u.rewardDebt;
        require(p > 0, "no rewards");
        u.rewardDebt = u.amount * accRewardPerShare / 1e18;
        rewardToken.safeTransfer(msg.sender, p);
        emit Claim(msg.sender, p);
    }

    function emergencyWithdraw() external nonReentrant {
        UserInfo storage u = userInfo[msg.sender];
        uint256 amt = u.amount; u.amount = 0; u.rewardDebt = 0;
        stakeToken.safeTransfer(msg.sender, amt);
    }
}
```

> **Note**: This sketch omits audits, overflow scaling nuances, and upgradeability hooks for brevity. In production, factor out math into libraries, add events for all admin actions, and add timelocks/multisig.

---

## 8) Deployment (Hardhat Scripts)

### 8.1 Deploy Tokens

```ts
// script/00_deploy_tokens.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const StableUSD = await ethers.getContractFactory("StableUSD");
  const sUSD = await StableUSD.deploy(deployer.address);
  await sUSD.deployed();

  const Reward = await ethers.getContractFactory("RewardToken");
  const rwd = await Reward.deploy(deployer.address);
  await rwd.deployed();

  console.log("sUSD:", sUSD.address);
  console.log("RWD:", rwd.address);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

### 8.2 Deploy Vault

```ts
// script/01_deploy_vault.ts
import { ethers } from "hardhat";

const LOCK = 60 * 60 * 24 * 3; // 3 days

async function main() {
  const sUSD = process.env.SUSD!;
  const RWD = process.env.RWD!;
  const [admin] = await ethers.getSigners();

  const Vault = await ethers.getContractFactory("FarmingVault");
  const vault = await Vault.deploy(sUSD, RWD, admin.address, LOCK);
  await vault.deployed();

  console.log("Vault:", vault.address);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

### 8.3 Post-Deploy Config

```ts
// script/02_post_deploy_config.ts
import { ethers } from "hardhat";

async function main() {
  const vaultAddr = process.env.VAULT!;
  const rwdAddr = process.env.RWD!;

  const vault = await ethers.getContractAt("FarmingVault", vaultAddr);
  const rwd = await ethers.getContractAt("RewardToken", rwdAddr);

  // Mint rewards to deployer, then fund vault or set rewardRate
  const totalRewards = ethers.utils.parseEther("10000");
  await rwd.mint(vault.address, totalRewards);

  // Example fixed rate over 30 days
  const duration = 30 * 24 * 3600;
  const rate = totalRewards.div(duration);
  await vault.setRewardRate(rate);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

Run:

```bash
npx hardhat run script/00_deploy_tokens.ts --network intuition
npx hardhat run script/01_deploy_vault.ts --network intuition
VAULT=0x... RWD=0x... npx hardhat run script/02_post_deploy_config.ts --network intuition
```

---

## 9) Frontend (Next.js + wagmi + viem)

* Connect wallet, show network mismatch prompt
* Display: user sUSD balance, staked amount, pending rewards (call `pending()`)
* Actions: `Approve`, `Stake`, `Claim`, `Unstake`
* UI guards: disable if paused/locked; show timers for cooldown
* Gas/error handling with readable toasts

**Minimal flow**:

1. `approve(sUSD → vault)` or `permit()` signature flow
2. `deposit(amount)`
3. Display `pending()` polling
4. `claim()` or `withdraw()` after lock

---

## 10) Monitoring & Ops

* **Events** to watch: `Deposit`, `Withdraw`, `Claim`, `RewardRateUpdated`, `Paused`, `Unpaused`
* **Dashboards**: Tenderly/Blockscout (if available on testnet)
* **Alerting**: Notify on abnormal vault balances, sudden rewardRate changes, or pauses
* **Backups**: Export ABIs + addresses into `deployments/intuition.json`
* **Runbooks**:

  * *Emergency pause*: call `pause()` from multisig
  * *Upgrade*: queue via Timelock → execute after delay

---

## 11) Formal Security Checklist

* [ ] Use latest OZ contracts & lock versions
* [ ] Lint + `solhint` + `slither` static analysis
* [ ] Unit tests: deposit/withdraw/claim, rate changes mid-epoch
* [ ] Fuzz: amounts, timing, concurrent users
* [ ] Invariants: total rewards paid == scheduled ± ε
* [ ] Reentrancy tests (malicious ERC-777 hooks avoided by using ERC-20 only)
* [ ] Approval race conditions tested; prefer `permit()`
* [ ] Front-run resistance: use cooldowns, fixed-rate accrual, no price-dependent logic
* [ ] Timelock on `setRewardRate` + param changes
* [ ] Multisig admin; EOA never holds admin
* [ ] Emergency withdraw tested
* [ ] Code coverage ≥ 95%

---

## 12) Emergency & Governance

* **Pause policy**: Any critical anomaly → `pause()` → broadcast status → investigate
* **Unpause policy**: Post-mortem + patch + timelock executed
* **Upgrades** (if UUPS): Only via multisig + timelock
* **Bug bounty**: Provide rules + rewards in `SECURITY.md`

---

## 13) Running Locally

```bash
# 1) Start local node
npx hardhat node

# 2) Deploy locally
npx hardhat run script/00_deploy_tokens.ts --network localhost
npx hardhat run script/01_deploy_vault.ts --network localhost

# 3) Run tests
npx hardhat test
```

---

## 14) FAQs

**Q: Why a centralized mint for sUSD on testnet?**
A: Speeds up testing and UX. For production, introduce collateral vaults or a bridge to a trusted stable.

**Q: How do we prevent flash-loan abuse?**
A: Fixed-rate accrual + lock period/cooldown; rewards accrue over time, and users can’t cycle in/out in a single block for unfair share.

**Q: Can we add an AMM?**
A: Yes—deploy a simple AMM or integrate an existing DEX on the network. If rewards depend on price/TVL, add TWAP or snapshot protections.

---

## 15) License

MIT for the sample code. Use at your own risk; not production-audited.
