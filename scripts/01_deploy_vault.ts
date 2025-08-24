import { ethers } from "hardhat";
import { FarmingVault } from "../typechain-types";

async function main() {
  console.log("Deploying FarmingVault...");
  
  const [deployer] = await ethers.getSigners();
  
  // Get token addresses from environment or use placeholders
  const stableUSDAddress = process.env.STABLE_USD_ADDRESS;
  const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;
  
  if (!stableUSDAddress || !rewardTokenAddress) {
    throw new Error("Token addresses not provided. Please set STABLE_USD_ADDRESS and REWARD_TOKEN_ADDRESS environment variables.");
  }
  
  console.log("Deploying with account:", deployer.address);
  console.log("StableUSD address:", stableUSDAddress);
  console.log("RewardToken address:", rewardTokenAddress);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Vault configuration
  const lockPeriod = 7 * 24 * 60 * 60; // 7 days in seconds
  const minStakeAmount = ethers.parseEther("1"); // 1 sUSD minimum
  const maxStakeAmount = ethers.parseEther("1000000"); // 1M sUSD maximum

  console.log("\nVault Configuration:");
  console.log("Lock period:", lockPeriod, "seconds (", lockPeriod / (24 * 60 * 60), "days)");
  console.log("Min stake:", ethers.formatEther(minStakeAmount), "sUSD");
  console.log("Max stake:", ethers.formatEther(maxStakeAmount), "sUSD");

  // Deploy FarmingVault
  console.log("\nDeploying FarmingVault...");
  const FarmingVaultFactory = await ethers.getContractFactory("FarmingVault");
  const farmingVault = await FarmingVaultFactory.deploy(
    stableUSDAddress,
    rewardTokenAddress,
    deployer.address, // admin
    lockPeriod,
    minStakeAmount,
    maxStakeAmount
  ) as FarmingVault;
  
  await farmingVault.waitForDeployment();
  const farmingVaultAddress = await farmingVault.getAddress();
  
  console.log("FarmingVault deployed to:", farmingVaultAddress);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const stakeToken = await farmingVault.stakeToken();
  const rewardToken = await farmingVault.rewardToken();
  const vaultLockPeriod = await farmingVault.lockPeriod();
  const vaultMinStake = await farmingVault.minStakeAmount();
  const vaultMaxStake = await farmingVault.maxStakeAmount();
  
  console.log("Stake token:", stakeToken);
  console.log("Reward token:", rewardToken);
  console.log("Lock period:", vaultLockPeriod.toString(), "seconds");
  console.log("Min stake:", ethers.formatEther(vaultMinStake), "sUSD");
  console.log("Max stake:", ethers.formatEther(vaultMaxStake), "sUSD");

  // Check roles
  const DEFAULT_ADMIN_ROLE = await farmingVault.DEFAULT_ADMIN_ROLE();
  const PAUSER_ROLE = await farmingVault.PAUSER_ROLE();
  const TREASURER_ROLE = await farmingVault.TREASURER_ROLE();

  const hasAdminRole = await farmingVault.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  const hasPauserRole = await farmingVault.hasRole(PAUSER_ROLE, deployer.address);
  const hasTreasurerRole = await farmingVault.hasRole(TREASURER_ROLE, deployer.address);

  console.log("\nRole verification:");
  console.log("Admin role:", hasAdminRole);
  console.log("Pauser role:", hasPauserRole);
  console.log("Treasurer role:", hasTreasurerRole);

  // Save deployment info
  const deploymentInfo = {
    network: "intuition",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      farmingVault: {
        address: farmingVaultAddress,
        stakeToken: stakeToken,
        rewardToken: rewardToken,
        lockPeriod: vaultLockPeriod.toString(),
        minStakeAmount: ethers.formatEther(vaultMinStake),
        maxStakeAmount: ethers.formatEther(vaultMaxStake)
      }
    }
  };

  console.log("\nFarmingVault deployment completed successfully!");
  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));
  
  return deploymentInfo;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;
