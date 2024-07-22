const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
  let token, staking, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20Token");
    token = await Token.deploy("Test Token", "TST", 18, ethers.utils.parseEther("1000000"));
    await token.deployed();

    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(token.address);
    await staking.deployed();

    await token.transfer(addr1.address, ethers.utils.parseEther("1000"));
    await token.transfer(addr2.address, ethers.utils.parseEther("1000"));
  });

  it("Should allow staking and rewards", async function () {
    await token.connect(addr1).approve(staking.address, ethers.utils.parseEther("100"));
    await staking.connect(addr1).stake(ethers.utils.parseEther("100"));

    // Simulate blocks passing
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    let reward = await staking.getReward(addr1.address);
    expect(reward).to.be.above(0);

    await staking.connect(addr1).claimReward();
    let balance = await token.balanceOf(addr1.address);
    expect(balance).to.be.above(ethers.utils.parseEther("900"));
  });

  it("Should allow withdrawal", async function () {
    await token.connect(addr2).approve(staking.address, ethers.utils.parseEther("100"));
    await staking.connect(addr2).stake(ethers.utils.parseEther("100"));

    // Simulate blocks passing
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    await staking.connect(addr2).withdraw(ethers.utils.parseEther("100"));
    let balance = await token.balanceOf(addr2.address);
    expect(balance).to.be.at.least(ethers.utils.parseEther("999"));
  });
});
