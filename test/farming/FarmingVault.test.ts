import { expect } from "chai";
import { ethers } from "hardhat";
import { FarmingVault, StableUSD, RewardToken } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("FarmingVault", function () {
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
    
    // Deploy tokens
    const StableUSDFactory = await ethers.getContractFactory("StableUSD");
    stableUSD = await StableUSDFactory.deploy(owner.address, treasury.address);
    await stableUSD.waitForDeployment();

    const RewardTokenFactory = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardTokenFactory.deploy(owner.address, treasury.address);
    await rewardToken.waitForDeployment();

    // Deploy FarmingVault
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

    // Setup initial balances
    await stableUSD.connect(treasury).transfer(user1.address, ethers.parseEther("10000"));
    await stableUSD.connect(treasury).transfer(user2.address, ethers.parseEther("10000"));
    
    // Fund the vault with rewards
    const rewardAmount = ethers.parseEther("1000");
    const rewardDuration = 30 * 24 * 60 * 60; // 30 days
    
    await rewardToken.connect(treasury).approve(await farmingVault.getAddress(), rewardAmount);
    await farmingVault.connect(owner).fundRewards(rewardAmount, rewardDuration);
  });

  describe("Deployment", function () {
    it("Should set correct parameters", async function () {
      expect(await farmingVault.stakeToken()).to.equal(await stableUSD.getAddress());
      expect(await farmingVault.rewardToken()).to.equal(await rewardToken.getAddress());
      expect(await farmingVault.lockPeriod()).to.equal(lockPeriod);
      expect(await farmingVault.minStakeAmount()).to.equal(minStakeAmount);
      expect(await farmingVault.maxStakeAmount()).to.equal(maxStakeAmount);
    });

    it("Should grant correct roles", async function () {
      const DEFAULT_ADMIN_ROLE = await farmingVault.DEFAULT_ADMIN_ROLE();
      const PAUSER_ROLE = await farmingVault.PAUSER_ROLE();
      const TREASURER_ROLE = await farmingVault.TREASURER_ROLE();
      
      expect(await farmingVault.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await farmingVault.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await farmingVault.hasRole(TREASURER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Deposit", function () {
    it("Should allow valid deposits", async function () {
      const depositAmount = ethers.parseEther("100");
      
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await farmingVault.connect(user1).deposit(depositAmount);
      
      const userInfo = await farmingVault.userInfo(user1.address);
      expect(userInfo.amount).to.equal(depositAmount);
      expect(await farmingVault.totalStaked()).to.equal(depositAmount);
    });

    it("Should not allow deposits below minimum", async function () {
      const depositAmount = ethers.parseEther("0.5");
      
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await expect(
        farmingVault.connect(user1).deposit(depositAmount)
      ).to.be.revertedWith("FarmingVault: amount below minimum");
    });

    it("Should not allow deposits above maximum", async function () {
      const depositAmount = ethers.parseEther("2000000");
      
      await stableUSD.connect(treasury).mint(user1.address, depositAmount);
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await expect(
        farmingVault.connect(user1).deposit(depositAmount)
      ).to.be.revertedWith("FarmingVault: exceeds maximum stake");
    });

    it("Should emit Deposit event", async function () {
      const depositAmount = ethers.parseEther("100");
      
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await expect(farmingVault.connect(user1).deposit(depositAmount))
        .to.emit(farmingVault, "Deposit")
        .withArgs(user1.address, depositAmount);
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("100");
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await farmingVault.connect(user1).deposit(depositAmount);
    });

    it("Should not allow withdrawal during lock period", async function () {
      const withdrawAmount = ethers.parseEther("50");
      
      await expect(
        farmingVault.connect(user1).withdraw(withdrawAmount)
      ).to.be.revertedWith("FarmingVault: tokens are locked");
    });

    it("Should allow withdrawal after lock period", async function () {
      const withdrawAmount = ethers.parseEther("50");
      
      // Advance time past lock period
      await time.increase(lockPeriod + 1);
      
      const initialBalance = await stableUSD.balanceOf(user1.address);
      await farmingVault.connect(user1).withdraw(withdrawAmount);
      
      const finalBalance = await stableUSD.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(withdrawAmount);
      
      const userInfo = await farmingVault.userInfo(user1.address);
      expect(userInfo.amount).to.equal(ethers.parseEther("50"));
    });

    it("Should not allow withdrawal more than deposited", async function () {
      const withdrawAmount = ethers.parseEther("200");
      
      await time.increase(lockPeriod + 1);
      
      await expect(
        farmingVault.connect(user1).withdraw(withdrawAmount)
      ).to.be.revertedWith("FarmingVault: insufficient balance");
    });
  });

  describe("Claim", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("100");
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await farmingVault.connect(user1).deposit(depositAmount);
    });

    it("Should allow claiming rewards", async function () {
      // Advance time to accrue rewards
      await time.increase(24 * 60 * 60); // 1 day
      
      const pendingBefore = await farmingVault.pendingReward(user1.address);
      expect(pendingBefore).to.be.gt(0);
      
      const initialBalance = await rewardToken.balanceOf(user1.address);
      await farmingVault.connect(user1).claim();
      const finalBalance = await rewardToken.balanceOf(user1.address);
      
      expect(finalBalance - initialBalance).to.be.gt(0);
      
      const pendingAfter = await farmingVault.pendingReward(user1.address);
      expect(pendingAfter).to.equal(0);
    });

    it("Should not allow claiming when no rewards", async function () {
      await expect(
        farmingVault.connect(user1).claim()
      ).to.be.revertedWith("FarmingVault: no rewards to claim");
    });
  });

  describe("Emergency Withdraw", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("100");
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await farmingVault.connect(user1).deposit(depositAmount);
    });

    it("Should allow emergency withdrawal with fee", async function () {
      const userInfo = await farmingVault.userInfo(user1.address);
      const stakedAmount = userInfo.amount;
      const fee = await farmingVault.emergencyWithdrawFee();
      const expectedFee = (stakedAmount * fee) / 10000n;
      const expectedWithdraw = stakedAmount - expectedFee;
      
      const initialBalance = await stableUSD.balanceOf(user1.address);
      await farmingVault.connect(user1).emergencyWithdraw();
      const finalBalance = await stableUSD.balanceOf(user1.address);
      
      expect(finalBalance - initialBalance).to.equal(expectedWithdraw);
      
      const userInfoAfter = await farmingVault.userInfo(user1.address);
      expect(userInfoAfter.amount).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to set reward rate", async function () {
      const newRate = ethers.parseEther("1");
      const duration = 30 * 24 * 60 * 60;
      
      await farmingVault.connect(owner).setRewardRate(newRate, duration);
      
      const vaultStats = await farmingVault.getVaultStats();
      expect(vaultStats[1]).to.equal(newRate);
    });

    it("Should allow admin to pause", async function () {
      await farmingVault.connect(owner).pause();
      expect(await farmingVault.paused()).to.be.true;
      
      const depositAmount = ethers.parseEther("100");
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await expect(
        farmingVault.connect(user1).deposit(depositAmount)
      ).to.be.reverted;
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(
        farmingVault.connect(user1).pause()
      ).to.be.reverted;
    });
  });

  describe("Reward Calculation", function () {
    it("Should calculate rewards correctly", async function () {
      const depositAmount = ethers.parseEther("100");
      await stableUSD.connect(user1).approve(await farmingVault.getAddress(), depositAmount);
      await farmingVault.connect(user1).deposit(depositAmount);
      
      const timeElapsed = 24 * 60 * 60; // 1 day
      await time.increase(timeElapsed);
      
      const pending = await farmingVault.pendingReward(user1.address);
      expect(pending).to.be.gt(0);
      
      // Verify reward calculation
      const vaultStats = await farmingVault.getVaultStats();
      const rewardRate = vaultStats[1];
      const expectedReward = BigInt(timeElapsed) * rewardRate;
      
      // Allow for small rounding differences
      expect(pending).to.be.closeTo(expectedReward, ethers.parseEther("0.001"));
    });
  });
});
