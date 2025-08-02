import { expect } from "chai";
import { ethers } from "hardhat";
import { Deadpool } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Deadpool", function () {
  let deadpool: Deadpool;
  let owner: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let dexRouter: HardhatEthersSigner;

  const POOL_DURATION = 3600; // 1 hour
  const DEFAULT_PLATFORM_FEE_BPS = 1000; // 10% (default)

  before(async () => {
    [owner, treasury, user1, user2, user3, dexRouter] = await ethers.getSigners();
    
    const deadpoolFactory = await ethers.getContractFactory("Deadpool");
    deadpool = (await deadpoolFactory.deploy(treasury.address, dexRouter.address)) as Deadpool;
    await deadpool.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await deadpool.owner()).to.equal(owner.address);
    });

    it("Should set the correct treasury", async function () {
      expect(await deadpool.treasury()).to.equal(treasury.address);
    });

    it("Should set the correct DEX router", async function () {
      expect(await deadpool.dexRouter()).to.equal(dexRouter.address);
    });

    it("Should initialize nextPoolId to 1", async function () {
      expect(await deadpool.nextPoolId()).to.equal(1);
    });

    it("Should set default platform fee to 10%", async function () {
      expect(await deadpool.platformFeeBps()).to.equal(DEFAULT_PLATFORM_FEE_BPS);
    });
  });

  describe("Pool Creation", function () {
    it("Should create a new deadpool", async function () {
      const tokenAddress = user1.address; // Using user address as mock token
      
      await expect(deadpool.connect(user1).createDeadpool(tokenAddress, POOL_DURATION))
        .to.emit(deadpool, "DeadpoolCreated")
        .withArgs(1, user1.address, tokenAddress, await time.latest() + POOL_DURATION);

      const pool = await deadpool.getPool(1);
      expect(pool.creator).to.equal(user1.address);
      expect(pool.tokenAddress).to.equal(tokenAddress);
      expect(pool.finalized).to.be.false;
      expect(pool.cancelled).to.be.false;
    });

    it("Should increment nextPoolId", async function () {
      expect(await deadpool.nextPoolId()).to.equal(2);
    });

    it("Should revert with invalid token address", async function () {
      await expect(
        deadpool.connect(user1).createDeadpool(ethers.ZeroAddress, POOL_DURATION)
      ).to.be.revertedWith("Invalid token address");
    });

    it("Should revert with invalid duration", async function () {
      const tokenAddress = user2.address;
      
      // Too short duration
      await expect(
        deadpool.connect(user1).createDeadpool(tokenAddress, 30 * 60) // 30 minutes
      ).to.be.revertedWith("Invalid duration");

      // Too long duration
      await expect(
        deadpool.connect(user1).createDeadpool(tokenAddress, 31 * 24 * 60 * 60) // 31 days
      ).to.be.revertedWith("Invalid duration");
    });
  });

  describe("Pool Management", function () {
    let poolId: number;

    beforeEach(async function () {
      const tokenAddress = user2.address;
      await deadpool.connect(user1).createDeadpool(tokenAddress, POOL_DURATION);
      poolId = Number(await deadpool.nextPoolId()) - 1;
    });

    it("Should cancel pool if no deposits", async function () {
      await expect(deadpool.connect(user1).cancelPool(poolId))
        .to.emit(deadpool, "PoolCanceled")
        .withArgs(poolId, user1.address);

      const pool = await deadpool.getPool(poolId);
      expect(pool.cancelled).to.be.true;
    });

    it("Should not allow non-creator to cancel pool", async function () {
      await expect(
        deadpool.connect(user2).cancelPool(poolId)
      ).to.be.revertedWith("Only creator can cancel");
    });

    it("Should allow owner to emergency withdraw", async function () {
      await expect(deadpool.connect(owner).emergencyWithdraw(poolId))
        .to.emit(deadpool, "EmergencyWithdraw")
        .withArgs(poolId, owner.address, 0);

      const pool = await deadpool.getPool(poolId);
      expect(pool.cancelled).to.be.true;
    });

    it("Should not allow non-owner to emergency withdraw", async function () {
      await expect(
        deadpool.connect(user1).emergencyWithdraw(poolId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update treasury", async function () {
      const newTreasury = user3.address;
      
      await expect(deadpool.connect(owner).setTreasury(newTreasury))
        .to.emit(deadpool, "TreasuryUpdated")
        .withArgs(treasury.address, newTreasury);

      expect(await deadpool.treasury()).to.equal(newTreasury);
    });

    it("Should not allow non-owner to update treasury", async function () {
      await expect(
        deadpool.connect(user1).setTreasury(user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to update DEX router", async function () {
      const newRouter = user3.address;
      
      await expect(deadpool.connect(owner).setDexRouter(newRouter))
        .to.emit(deadpool, "DexRouterUpdated")
        .withArgs(dexRouter.address, newRouter);

      expect(await deadpool.dexRouter()).to.equal(newRouter);
    });

    it("Should not allow non-owner to update DEX router", async function () {
      await expect(
        deadpool.connect(user1).setDexRouter(user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert with invalid treasury address", async function () {
      await expect(
        deadpool.connect(owner).setTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid treasury address");
    });

    it("Should revert with invalid router address", async function () {
      await expect(
        deadpool.connect(owner).setDexRouter(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid router address");
    });

    it("Should allow owner to update platform fee", async function () {
      const newFeeBps = 500; // 5%
      
      await expect(deadpool.connect(owner).setPlatformFee(newFeeBps))
        .to.emit(deadpool, "PlatformFeeUpdated")
        .withArgs(DEFAULT_PLATFORM_FEE_BPS, newFeeBps);

      expect(await deadpool.platformFeeBps()).to.equal(newFeeBps);
    });

    it("Should not allow non-owner to update platform fee", async function () {
      await expect(
        deadpool.connect(user1).setPlatformFee(500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert with excessive platform fee", async function () {
      await expect(
        deadpool.connect(owner).setPlatformFee(1001) // 10.01%
      ).to.be.revertedWith("Platform fee too high");
    });
  });

  describe("View Functions", function () {
    let poolId: number;

    beforeEach(async function () {
      const tokenAddress = user2.address;
      await deadpool.connect(user1).createDeadpool(tokenAddress, POOL_DURATION);
      poolId = Number(await deadpool.nextPoolId()) - 1;
    });

    it("Should return correct pool information", async function () {
      const pool = await deadpool.getPool(poolId);
      
      expect(pool.creator).to.equal(user1.address);
      expect(pool.tokenAddress).to.equal(user2.address);
      expect(pool.totalDeposited).to.equal(0);
      expect(pool.finalized).to.be.false;
      expect(pool.cancelled).to.be.false;
    });

    it("Should return empty user deposit initially", async function () {
      const deposit = await deadpool.getUserDeposit(poolId, user1.address);
      expect(deposit).to.equal(0);
    });

    it("Should return empty depositors list initially", async function () {
      const depositors = await deadpool.getPoolDepositors(poolId);
      expect(depositors.length).to.equal(0);
    });

    it("Should return user pools", async function () {
      const userPools = await deadpool.getUserPools(user1.address);
      expect(userPools.length).to.be.greaterThan(0);
      expect(userPools[userPools.length - 1]).to.equal(poolId);
    });

    it("Should return user deposits", async function () {
      const userDeposits = await deadpool.getUserDeposits(user1.address);
      expect(userDeposits.length).to.equal(0); // No deposits made yet
    });
  });

  describe("Edge Cases", function () {
    it("Should revert with invalid pool ID", async function () {
      await expect(
        deadpool.getPool(999)
      ).to.be.revertedWith("Invalid pool ID");
    });

    it("Should handle contract receiving ETH", async function () {
      const initialBalance = await ethers.provider.getBalance(await deadpool.getAddress());
      
      await owner.sendTransaction({
        to: await deadpool.getAddress(),
        value: ethers.parseEther("1.0")
      });

      const finalBalance = await ethers.provider.getBalance(await deadpool.getAddress());
      expect(finalBalance).to.equal(initialBalance + ethers.parseEther("1.0"));
    });
  });
});