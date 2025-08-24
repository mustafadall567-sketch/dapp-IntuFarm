import { ethers } from "hardhat";
import { FarmingVault, RewardToken } from "../typechain-types";

async function main() {
  console.log("Post-deployment configuration...");
  
  const [deployer] = await ethers.getSigners();
  
  // Get contract addresses from environment
  const farmingVaultAddress = process.env.FARMING_VAULT_ADDRESS;
  const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;
  
  if (!farmingVaultAddress || !rewardTokenAddress) {
    throw new Error("Contract addresses not provided. Please set FARMING_VAULT_ADDRESS and REWARD_TOKEN_ADDRESS environment variables.");
  }
  
  console.log("Configuring with account:", deployer.address);
  console.log("FarmingVault address:", farmingVaultAddress);
  console.log("RewardToken address:", rewardTokenAddress);

  // Get contract instances
  const farmingVault = await ethers.getContractAt("FarmingVault", farmingVaultAddress) as FarmingVault;
  const rewardToken = await ethers.getContractAt("RewardToken", rewardTokenAddress) as RewardToken;

  // Configuration parameters
  const rewardAmount = ethers.parseEther("10000"); // 10,000 RWD tokens
  const rewardDuration = 30 * 24 * 60 * 60; // 30 days in seconds

  console.log("\nConfiguration parameters:");
  console.log("Reward amount:", ethers.formatEther(rewardAmount), "RWD");
  console.log("Reward duration:", rewardDuration, "seconds (", rewardDuration / (24 * 60 * 60), "days)");
  console.log("Reward rate:", ethers.formatEther(rewardAmount / BigInt(rewardDuration)), "RWD/second");

  try {
    // Step 1: Grant MINTER_ROLE to farming vault for reward token
    console.log("\n1. Granting MINTER_ROLE to FarmingVault...");
    const MINTER_ROLE = await rewardToken.MINTER_ROLE();
    const hasMinterRole = await rewardToken.hasRole(MINTER_ROLE, farmingVaultAddress);
    
    if (!hasMinterRole) {
      const grantRoleTx = await rewardToken.grantRole(MINTER_ROLE, farmingVaultAddress);
      await grantRoleTx.wait();
      console.log("MINTER_ROLE granted to FarmingVault");
    } else {
      console.log("FarmingVault already has MINTER_ROLE");
    }

    // Step 2: Check reward token balance
    console.log("\n2. Checking reward token balance...");
    const deployerBalance = await rewardToken.balanceOf(deployer.address);
    console.log("Deployer RWD balance:", ethers.formatEther(deployerBalance));
    
    if (deployerBalance < rewardAmount) {
      console.log("Insufficient balance. Minting additional tokens...");
      const mintTx = await rewardToken.mint(deployer.address, rewardAmount - deployerBalance);
      await mintTx.wait();
      console.log("Additional tokens minted");
    }

    // Step 3: Approve and fund the farming vault
    console.log("\n3. Funding the farming vault...");
    
    // Check current allowance
    const currentAllowance = await rewardToken.allowance(deployer.address, farmingVaultAddress);
    if (currentAllowance < rewardAmount) {
      console.log("Approving reward tokens...");
      const approveTx = await rewardToken.approve(farmingVaultAddress, rewardAmount);
      await approveTx.wait();
      console.log("Approval completed");
    }
    
    // Fund the vault
    console.log("Funding vault with rewards...");
    const fundTx = await farmingVault.fundRewards(rewardAmount, rewardDuration);
    await fundTx.wait();
    console.log("Vault funded successfully");

    // Step 4: Verify configuration
    console.log("\n4. Verifying configuration...");
    const vaultStats = await farmingVault.getVaultStats();
    console.log("Total staked:", ethers.formatEther(vaultStats[0]));
    console.log("Reward rate:", ethers.formatEther(vaultStats[1]), "RWD/second");
    console.log("Reward end time:", new Date(Number(vaultStats[2]) * 1000).toISOString());
    console.log("Acc reward per share:", vaultStats[3].toString());

    // Check vault reward token balance
    const vaultRewardBalance = await rewardToken.balanceOf(farmingVaultAddress);
    console.log("Vault RWD balance:", ethers.formatEther(vaultRewardBalance));

    console.log("\nPost-deployment configuration completed successfully!");
    
  } catch (error) {
    console.error("Configuration failed:", error);
    throw error;
  }
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
