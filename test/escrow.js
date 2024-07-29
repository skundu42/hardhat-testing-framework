const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowSystem", function () {
  let EscrowSystem;
  let escrowSystem;
  let owner;
  let buyer;
  let seller;
  let addr1;
  let addr2;

  beforeEach(async function () {
    EscrowSystem = await ethers.getContractFactory("EscrowSystem");
    [owner, buyer, seller, addr1, addr2] = await ethers.getSigners();
    escrowSystem = await EscrowSystem.deploy();
  });

  describe("Escrow", function () {
    it("Should initiate escrow", async function () {
      const amount = ethers.parseEther("1.0");
      await escrowSystem.connect(buyer).initiateEscrow(seller.address, { value: amount });

      const escrow = await escrowSystem.escrows(1);
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.amount).to.equal(amount);
    });

    it("Should confirm delivery and release funds", async function () {
      const amount = ethers.parseEther("1.0");
      await escrowSystem.connect(buyer).initiateEscrow(seller.address, { value: amount });

      const initialBalance = BigInt(await ethers.provider.getBalance(seller.address));

      const tx = await escrowSystem.connect(buyer).confirmDelivery(1);
      const receipt = await tx.wait();
      const gasUsed = BigInt(receipt.gasUsed);
      const gasPrice = BigInt(tx.gasPrice);
      const gasCost = gasUsed * gasPrice;

      const finalBalance = BigInt(await ethers.provider.getBalance(seller.address));
      const expectedBalance = initialBalance + amount - gasCost;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });

    it("Should initiate a dispute", async function () {
      const amount = ethers.parseEther("1.0");
      await escrowSystem.connect(buyer).initiateEscrow(seller.address, { value: amount });

      await escrowSystem.connect(buyer).initiateDispute(1);

      const escrow = await escrowSystem.escrows(1);
      expect(escrow.isDisputed).to.be.true;
    });

    it("Should resolve a dispute and refund the buyer", async function () {
      const amount = ethers.parseEther("1.0");
      await escrowSystem.connect(buyer).initiateEscrow(seller.address, { value: amount });

      const initialBalance = BigInt(await ethers.provider.getBalance(buyer.address));

      await escrowSystem.connect(buyer).initiateDispute(1);
      const tx = await escrowSystem.connect(owner).resolveDispute(1, buyer.address);
      const receipt = await tx.wait();
      const gasUsed = BigInt(receipt.gasUsed);
      const gasPrice = BigInt(tx.gasPrice);
      const gasCost = gasUsed * gasPrice;

      const finalBalance = BigInt(await ethers.provider.getBalance(buyer.address));
      const expectedBalance = initialBalance + amount - gasCost;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });

    it("Should cancel an escrow and refund the buyer", async function () {
      const amount = ethers.parseEther("1.0");
      await escrowSystem.connect(buyer).initiateEscrow(seller.address, { value: amount });

      const initialBalance = BigInt(await ethers.provider.getBalance(buyer.address));

      const tx = await escrowSystem.connect(buyer).cancelEscrow(1);
      const receipt = await tx.wait();
      const gasUsed = BigInt(receipt.gasUsed);
      const gasPrice = BigInt(tx.gasPrice);
      const gasCost = gasUsed * gasPrice;

      const finalBalance = BigInt(await ethers.provider.getBalance(buyer.address));
      const expectedBalance = initialBalance + amount - gasCost;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause the contract", async function () {
      await escrowSystem.connect(owner).pause();
      await expect(escrowSystem.connect(buyer).initiateEscrow(seller.address, { value: ethers.parseEther("1.0") }))
        .to.be.revertedWith("Contract is paused");

      await escrowSystem.connect(owner).unpause();
      await expect(escrowSystem.connect(buyer).initiateEscrow(seller.address, { value: ethers.parseEther("1.0") }))
        .not.to.be.reverted;
    });
  });
});
