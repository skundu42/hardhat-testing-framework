const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleAuction", function () {
  let SimpleAuction;
  let simpleAuction;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    SimpleAuction = await ethers.getContractFactory("SimpleAuction");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const biddingTime = 600; // 10 minutes
    simpleAuction = await SimpleAuction.deploy(biddingTime);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await simpleAuction.owner()).to.equal(owner.address);
    });

    it("Should set the correct auction end time", async function () {
      const endTime = (await ethers.provider.getBlock('latest')).timestamp + 600;
      expect(await simpleAuction.auctionEndTime()).to.be.closeTo(endTime, 2);
    });
  });

  describe("Bidding", function () {
    it("Should record highest bid correctly", async function () {
      await simpleAuction.connect(addr1).bid({ value: ethers.parseEther("1.0") });
      expect(await simpleAuction.highestBid()).to.equal(ethers.parseEther("1.0"));
      expect(await simpleAuction.highestBidder()).to.equal(addr1.address);

      await expect(simpleAuction.connect(addr2).bid({ value: ethers.parseEther("0.5") }))
        .to.be.revertedWith("There already is a higher bid.");
    });

    it("Should refund previous highest bidder", async function () {
      await simpleAuction.connect(addr1).bid({ value: ethers.parseEther("1.0") });
      await simpleAuction.connect(addr2).bid({ value: ethers.parseEther("2.0") });

      expect(await simpleAuction.pendingReturns(addr1.address)).to.equal(ethers.parseEther("1.0"));

      const initialBalance = await ethers.provider.getBalance(addr1.address);
      const tx = await simpleAuction.connect(addr1).withdraw();
      const receipt = await tx.wait();
      const gasUsed = BigInt(receipt.gasUsed);
      const gasPrice = BigInt(tx.gasPrice);
      const gasCost = gasUsed * gasPrice;

      const finalBalance = await ethers.provider.getBalance(addr1.address);
      const expectedBalance = initialBalance + ethers.parseEther("1.0") - gasCost;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });
  });

  describe("Ending Auction", function () {
    it("Should only be ended by the owner", async function () {
      await expect(simpleAuction.connect(addr1).endAuction()).to.be.revertedWith("You are not the auction owner.");
    });

    it("Should transfer highest bid to the owner", async function () {
      await simpleAuction.connect(addr1).bid({ value: ethers.parseEther("1.0") });
      await ethers.provider.send("evm_increaseTime", [601]); // move time forward
      await simpleAuction.endAuction();

      expect(await ethers.provider.getBalance(owner.address)).to.be.closeTo(ethers.parseEther("10001.0"), ethers.parseEther("0.1"));
    });
  });
});
