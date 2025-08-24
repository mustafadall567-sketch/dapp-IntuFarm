import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardToken } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RewardToken", function () {
  let rewardToken: RewardToken;
  let owner: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, treasury, user1, user2] = await ethers.getSigners();
    
    const RewardTokenFactory = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardTokenFactory.deploy(owner.address, treasury.address);
    await rewardToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await rewardToken.name()).to.equal("Reward Token");
      expect(await rewardToken.symbol()).to.equal("RWD");
    });

    it("Should set correct initial supply to treasury", async function () {
      const treasuryBalance = await rewardToken.balanceOf(treasury.address);
      expect(treasuryBalance).to.equal(ethers.parseEther("10000000"));
    });

    it("Should grant correct roles", async function () {
      const DEFAULT_ADMIN_ROLE = await rewardToken.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await rewardToken.MINTER_ROLE();
      
      expect(await rewardToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await rewardToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await rewardToken.hasRole(MINTER_ROLE, treasury.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await rewardToken.connect(owner).mint(user1.address, mintAmount);
      
      expect(await rewardToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        rewardToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.reverted;
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await rewardToken.MAX_SUPPLY();
      const currentSupply = await rewardToken.totalSupply();
      const excessAmount = maxSupply - currentSupply + ethers.parseEther("1");
      
      await expect(
        rewardToken.connect(owner).mint(user1.address, excessAmount)
      ).to.be.revertedWith("RewardToken: exceeds max supply");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await rewardToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should allow burner to burn tokens", async function () {
      const burnAmount = ethers.parseEther("500");
      const initialBalance = await rewardToken.balanceOf(user1.address);
      
      await rewardToken.connect(owner).burn(user1.address, burnAmount);
      
      expect(await rewardToken.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should allow self burning", async function () {
      const burnAmount = ethers.parseEther("500");
      const initialBalance = await rewardToken.balanceOf(user1.address);
      
      await rewardToken.connect(user1).burnSelf(burnAmount);
      
      expect(await rewardToken.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
    });
  });

  describe("Pause functionality", function () {
    it("Should allow pauser to pause contract", async function () {
      await rewardToken.connect(owner).pause();
      expect(await rewardToken.paused()).to.be.true;
    });

    it("Should not allow transfers when paused", async function () {
      await rewardToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await rewardToken.connect(owner).pause();
      
      await expect(
        rewardToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });
});
