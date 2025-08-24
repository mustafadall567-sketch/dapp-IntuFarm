import { ethers } from "hardhat";
import { StableUSD, RewardToken } from "../typechain-types";

async function main() {
  console.log("Deploying tokens...");
  
  const [deployer] = await ethers.getSigners();
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  
  console.log("Deploying with account:", deployer.address);
  console.log("Treasury address:", treasuryAddress);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy StableUSD
  console.log("\nDeploying StableUSD...");
  const StableUSDFactory = await ethers.getContractFactory("StableUSD");
  const stableUSD = await StableUSDFactory.deploy(deployer.address, treasuryAddress) as StableUSD;
  await stableUSD.waitForDeployment();
  const stableUSDAddress = await stableUSD.getAddress();
  
  console.log("StableUSD deployed to:", stableUSDAddress);

  // Deploy RewardToken
  console.log("\nDeploying RewardToken...");
  const RewardTokenFactory = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardTokenFactory.deploy(deployer.address, treasuryAddress) as RewardToken;
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  
  console.log("RewardToken deployed to:", rewardTokenAddress);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const stableUSDName = await stableUSD.name();
  const stableUSDSymbol = await stableUSD.symbol();
  const stableUSDSupply = await stableUSD.totalSupply();
  
  const rewardTokenName = await rewardToken.name();
  const rewardTokenSymbol = await rewardToken.symbol();
  const rewardTokenSupply = await rewardToken.totalSupply();
  
  console.log(`StableUSD: ${stableUSDName} (${stableUSDSymbol}), Supply: ${ethers.formatEther(stableUSDSupply)}`);
  console.log(`RewardToken: ${rewardTokenName} (${rewardTokenSymbol}), Supply: ${ethers.formatEther(rewardTokenSupply)}`);

  // Save deployment addresses
  const deploymentInfo = {
    network: "intuition",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    treasury: treasuryAddress,
    contracts: {
      stableUSD: {
        address: stableUSDAddress,
        name: stableUSDName,
        symbol: stableUSDSymbol,
        initialSupply: ethers.formatEther(stableUSDSupply)
      },
      rewardToken: {
        address: rewardTokenAddress,
        name: rewardTokenName,
        symbol: rewardTokenSymbol,
        initialSupply: ethers.formatEther(rewardTokenSupply)
      }
    }
  };

  console.log("\nDeployment completed successfully!");
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
