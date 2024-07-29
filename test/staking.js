const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
  let token, staking, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20Token");
    token = await Token.deploy("Test Token", "TST", ethers.parseEther("1000000"));
    
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(token.target);

    await token.transfer(addr1, ethers.parseEther("1000"));
    await token.transfer(addr2, ethers.parseEther("1000"));
  });

  it("Should allow staking and rewards", async function () {
    await token.connect(addr1).approve(staking.target, ethers.parseEther("100"));
    await staking.connect(addr1).stake(ethers.parseEther("100"));

    // Simulate blocks passing
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    let reward = await staking.earned(addr1);
    expect(reward).to.be.gt(0);

    await staking.connect(addr1).getReward(addr1);
    let balance = await token.balanceOf(addr1);
    expect(balance).to.be.gt(ethers.parseEther("900"));
  });

  it("Should allow withdrawal", async function () {
    await token.connect(addr2).approve(staking.target, ethers.parseEther("100"));
    await staking.connect(addr2).stake(ethers.parseEther("100"));

    // Simulate blocks passing
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    await staking.connect(addr2).withdraw(ethers.parseEther("100"));
    let balance = await token.balanceOf(addr2);
    expect(balance).to.be.at.least(ethers.parseEther("999"));
  });
});
