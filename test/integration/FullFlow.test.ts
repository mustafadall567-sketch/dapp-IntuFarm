import { expect } from "chai";
import { ethers } from "hardhat";
import { FarmingVault, StableUSD, RewardToken } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Full Flow Integration", function () {
  let farmingVault: FarmingVault;
  let stableUSD: StableUSD;
  let rewardToken: RewardToken;
  let owner: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const lockPeriod = 7 * 24 * 60 * 60; // 7 days
  const minStakeAmount = ethers.parseEther("1");
  const maxStakeAmount = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, treasury, user1, user2] = await ethers.getSigners();
    
    // Deploy all contracts
    const StableUSDFactory = await ethers.getContractFactory("StableUSD");
    stableUSD = await StableUSDFactory.deploy(owner.address, treasury.address);
    await stableUSD.waitForDeployment();

    const RewardTokenFactory = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardTokenFactory.deploy(owner.address, treasury.address);
    await rewardToken.waitForDeployment();

    const FarmingVaultFactory = await ethers.getContractFactory("FarmingVault");
    farmingVault = await FarmingVaultFactory.deploy(
      await stableUSD.getAddress(),
      await rewardToken.getAddress(),
      owner.address,
      lockPeriod,
      minStakeAmount,
      maxStakeAmount
    );
    await farmingVault.waitForDeployment();
  });

  describe("Complete User Journey", function () {
    it("Should handle full farming lifecycle", async function () {
      // Step 1: Setup - distribute tokens to users
      const userStakeAmount = ethers.parseEther("1000");
      await stableUSD.connect(treasury).transfer(user1.address, userStakeAmount);
      await stableUSD.connect(treasury).transfer(user2.address, userStakeAmount);

      // Step 2: Fund the vault with rewards
      const rewardAmount = ethers.parseEther("10000");
      const rewardDuration = 30 * 24 * 60 * 60; // 30 days
      
      await rewardToken.connect(treasury).approve(await farmingVault.getAddress(), rewardAmount);
      await farmingVault.connect(owner).fundRewards(rewardAmount, rewardDuration);

      // Verify vault is funded
      const vaultRewardBalance = await rewardToken.balanceOf(await farmingVault.getAddress());
      expect(vaultRewardBalance).to.equal(rewardAmount);

      // Step 3: User1 deposits
      const user1DepositAmount = ethers.parseEther("500");
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), user1DepositAmount);
      await farmingVault.connect(user1).deposit(user1DepositAmount);

      // Verify deposit
      let user1Info = await farmingVault.userInfo(user1.address);
      expect(user1Info.amount).to.equal(user1DepositAmount);

      // Step 4: Time passes (1 day)
      await time.increase(24 * 60 * 60);

      // Step 5: User2 deposits (should affect reward distribution)
      const user2DepositAmount = ethers.parseEther("500");
      await stableUSD.connect(user2).approve(await farmingVault.getAddress(), user2DepositAmount);
      await farmingVault.connect(user2).deposit(user2DepositAmount);

      // Verify both users have deposits
      user1Info = await farmingVault.userInfo(user1.address);
      const user2Info = await farmingVault.userInfo(user2.address);
      expect(user1Info.amount).to.equal(user1DepositAmount);
      expect(user2Info.amount).to.equal(user2DepositAmount);

      // Step 6: More time passes
      await time.increase(24 * 60 * 60);

      // Step 7: Check pending rewards
      const user1Pending = await farmingVault.pendingReward(user1.address);
      const user2Pending = await farmingVault.pendingReward(user2.address);
      
      expect(user1Pending).to.be.gt(0);
      expect(user2Pending).to.be.gt(0);
      expect(user1Pending).to.be.gt(user2Pending); // User1 staked longer

      // Step 8: User1 claims rewards
      const user1InitialRewardBalance = await rewardToken.balanceOf(user1.address);
      await farmingVault.connect(user1).claim();
      const user1FinalRewardBalance = await rewardToken.balanceOf(user1.address);
      
      expect(user1FinalRewardBalance - user1InitialRewardBalance).to.be.gt(0);

      // Step 9: Wait for lock period to end
      await time.increase(lockPeriod);

      // Step 10: User1 withdraws partial amount
      const withdrawAmount = ethers.parseEther("200");
      const user1InitialStableBalance = await stableUSD.balanceOf(user1.address);
      await farmingVault.connect(user1).withdraw(withdrawAmount);
      const user1FinalStableBalance = await stableUSD.balanceOf(user1.address);
      
      expect(user1FinalStableBalance - user1InitialStableBalance).to.equal(withdrawAmount);

      // Step 11: User2 exits completely
      const user2InitialStableBalance = await stableUSD.balanceOf(user2.address);
      const user2InitialRewardBalance = await rewardToken.balanceOf(user2.address);
      
      await farmingVault.connect(user2).exit();
      
      const user2FinalStableBalance = await stableUSD.balanceOf(user2.address);
      const user2FinalRewardBalance = await rewardToken.balanceOf(user2.address);
      
      expect(user2FinalStableBalance - user2InitialStableBalance).to.equal(user2DepositAmount);
      expect(user2FinalRewardBalance - user2InitialRewardBalance).to.be.gt(0);

      // Step 12: Verify final state
      const finalUser1Info = await farmingVault.userInfo(user1.address);
      const finalUser2Info = await farmingVault.userInfo(user2.address);
      
      expect(finalUser1Info.amount).to.equal(user1DepositAmount - withdrawAmount);
      expect(finalUser2Info.amount).to.equal(0);
    });

    it("Should handle emergency scenarios", async function () {
      // Setup
      const userStakeAmount = ethers.parseEther("1000");
      await stableUSD.connect(treasury).transfer(user1.address, userStakeAmount);
      
      const rewardAmount = ethers.parseEther("1000");
      const rewardDuration = 30 * 24 * 60 * 60;
      await rewardToken.connect(treasury).approve(await farmingVault.getAddress(), rewardAmount);
      await farmingVault.connect(owner).fundRewards(rewardAmount, rewardDuration);

      // User deposits
      const depositAmount = ethers.parseEther("500");
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await farmingVault.connect(user1).deposit(depositAmount);

      // Emergency pause
      await farmingVault.connect(owner).pause();
      
      // Should not allow new deposits when paused
      await expect(
        farmingVault.connect(user1).deposit(ethers.parseEther("100"))
      ).to.be.reverted;

      // Emergency withdraw should still work
      const initialBalance = await stableUSD.balanceOf(user1.address);
      await farmingVault.connect(user1).emergencyWithdraw();
      const finalBalance = await stableUSD.balanceOf(user1.address);
      
      // Should receive amount minus fee
      const fee = await farmingVault.emergencyWithdrawFee();
      const expectedAmount = depositAmount - (depositAmount * fee / 10000n);
      expect(finalBalance - initialBalance).to.equal(expectedAmount);
    });

    it("Should maintain reward accounting integrity", async function () {
      // Setup multiple users
      const userStakeAmount = ethers.parseEther("1000");
      await stableUSD.connect(treasury).transfer(user1.address, userStakeAmount);
      await stableUSD.connect(treasury).transfer(user2.address, userStakeAmount);

      const rewardAmount = ethers.parseEther("10000");
      const rewardDuration = 10 * 24 * 60 * 60; // 10 days
      await rewardToken.connect(treasury).approve(await farmingVault.getAddress(), rewardAmount);
      await farmingVault.connect(owner).fundRewards(rewardAmount, rewardDuration);

      // User1 deposits
      const user1DepositAmount = ethers.parseEther("300");
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), user1DepositAmount);
      await farmingVault.connect(user1).deposit(user1DepositAmount);

      // Time passes
      await time.increase(2 * 24 * 60 * 60); // 2 days

      // User2 deposits
      const user2DepositAmount = ethers.parseEther("700");
      await stableUSD.connect(user2).approve(await farmingVault.getAddress(), user2DepositAmount);
      await farmingVault.connect(user2).deposit(user2DepositAmount);

      // More time passes
      await time.increase(3 * 24 * 60 * 60); // 3 days

      // Check total pending rewards
      const user1Pending = await farmingVault.pendingReward(user1.address);
      const user2Pending = await farmingVault.pendingReward(user2.address);
      const totalPending = user1Pending + user2Pending;

      // Calculate expected total rewards distributed
      const vaultStats = await farmingVault.getVaultStats();
      const rewardRate = vaultStats[1];
      const totalTimeElapsed = 5 * 24 * 60 * 60; // 5 days total
      const expectedTotalRewards = BigInt(totalTimeElapsed) * rewardRate;

      // Should be close (allowing for rounding differences)
      expect(totalPending).to.be.closeTo(expectedTotalRewards, ethers.parseEther("1"));

      // User1 should have more rewards (staked longer)
      expect(user1Pending).to.be.gt(user2Pending);
    });
  });
});
