import { expect } from "chai";
import { ethers } from "hardhat";
import { StableUSD } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("StableUSD", function () {
  let stableUSD: StableUSD;
  let owner: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, treasury, user1, user2] = await ethers.getSigners();
    
    const StableUSDFactory = await ethers.getContractFactory("StableUSD");
    stableUSD = await StableUSDFactory.deploy(owner.address, treasury.address);
    await stableUSD.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await stableUSD.name()).to.equal("StableUSD");
      expect(await stableUSD.symbol()).to.equal("sUSD");
    });

    it("Should set correct initial supply to treasury", async function () {
      const treasuryBalance = await stableUSD.balanceOf(treasury.address);
      expect(treasuryBalance).to.equal(ethers.parseEther("1000000"));
    });

    it("Should grant correct roles to admin", async function () {
      const DEFAULT_ADMIN_ROLE = await stableUSD.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await stableUSD.MINTER_ROLE();
      const PAUSER_ROLE = await stableUSD.PAUSER_ROLE();
      
      expect(await stableUSD.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await stableUSD.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await stableUSD.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await stableUSD.connect(owner).mint(user1.address, mintAmount);
      
      expect(await stableUSD.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        stableUSD.connect(user1).mint(user1.address, mintAmount)
      ).to.be.reverted;
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await stableUSD.MAX_SUPPLY();
      const currentSupply = await stableUSD.totalSupply();
      const excessAmount = maxSupply - currentSupply + ethers.parseEther("1");
      
      await expect(
        stableUSD.connect(owner).mint(user1.address, excessAmount)
      ).to.be.revertedWith("StableUSD: exceeds max supply");
    });

    it("Should emit Mint event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(stableUSD.connect(owner).mint(user1.address, mintAmount))
        .to.emit(stableUSD, "Mint")
        .withArgs(user1.address, mintAmount);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Mint tokens to user1 for testing
      await stableUSD.connect(owner).mint(user1.address, ethers.parseEther("1000"));
    });

    it("Should allow burner to burn tokens", async function () {
      const burnAmount = ethers.parseEther("500");
      const initialBalance = await stableUSD.balanceOf(user1.address);
      
      await stableUSD.connect(owner).burn(user1.address, burnAmount);
      
      expect(await stableUSD.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should allow self burning", async function () {
      const burnAmount = ethers.parseEther("500");
      const initialBalance = await stableUSD.balanceOf(user1.address);
      
      await stableUSD.connect(user1).burnSelf(burnAmount);
      
      expect(await stableUSD.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should not allow burning more than balance", async function () {
      const burnAmount = ethers.parseEther("2000");
      
      await expect(
        stableUSD.connect(owner).burn(user1.address, burnAmount)
      ).to.be.revertedWith("StableUSD: insufficient balance");
    });

    it("Should emit Burn event", async function () {
      const burnAmount = ethers.parseEther("500");
      await expect(stableUSD.connect(owner).burn(user1.address, burnAmount))
        .to.emit(stableUSD, "Burn")
        .withArgs(user1.address, burnAmount);
    });
  });

  describe("Pause functionality", function () {
    it("Should allow pauser to pause contract", async function () {
      await stableUSD.connect(owner).pause();
      expect(await stableUSD.paused()).to.be.true;
    });

    it("Should not allow transfers when paused", async function () {
      await stableUSD.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await stableUSD.connect(owner).pause();
      
      await expect(
        stableUSD.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should allow transfers after unpause", async function () {
      await stableUSD.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await stableUSD.connect(owner).pause();
      await stableUSD.connect(owner).unpause();
      
      await expect(
        stableUSD.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.not.be.reverted;
    });
  });

  describe("EIP-2612 Permit", function () {
    it("Should have correct domain separator", async function () {
      const domainSeparator = await stableUSD.DOMAIN_SEPARATOR();
      expect(domainSeparator).to.not.equal(ethers.ZeroHash);
    });

    it("Should support permit interface", async function () {
      // This is a basic check - full permit testing would require signature generation
      const nonce = await stableUSD.nonces(user1.address);
      expect(nonce).to.equal(0);
    });
  });
});
