const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
    let staking, stakingToken;
    let owner, addr1, addr2;
    const initialSupply = ethers.utils.parseEther("1000");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const StakingToken = await ethers.getContractFactory("ERC20Mock", owner);
        stakingToken = await StakingToken.deploy("Staking Token", "STK", initialSupply);
        await stakingToken.deployed();
        const Staking = await ethers.getContractFactory("Staking", owner);
        staking = await Staking.deploy(stakingToken.address);
        await staking.deployed();
    });

    it("should allow users to stake tokens", async function () {
        await stakingToken.transfer(addr1.address, ethers.utils.parseEther("100"));
        await stakingToken.connect(addr1).approve(staking.address, ethers.utils.parseEther("100"));
        await staking.connect(addr1).stake(ethers.utils.parseEther("100"));
        expect(await staking.userStake(addr1.address)).to.equal(ethers.utils.parseEther("100"));
        expect(await staking.totalStaked()).to.equal(ethers.utils.parseEther("100"));
    });

    it("should allow users to withdraw staked tokens", async function () {
        await stakingToken.transfer(addr1.address, ethers.utils.parseEther("100"));
        await stakingToken.connect(addr1).approve(staking.address, ethers.utils.parseEther("100"));
        await staking.connect(addr1).stake(ethers.utils.parseEther("100"));
        await staking.connect(addr1).withdraw(ethers.utils.parseEther("50"));
        expect(await staking.userStake(addr1.address)).to.equal(ethers.utils.parseEther("50"));
        expect(await staking.totalStaked()).to.equal(ethers.utils.parseEther("50"));
    });

    it("should distribute rewards correctly", async function () {
        await stakingToken.transfer(addr1.address, ethers.utils.parseEther("100"));
        await stakingToken.connect(addr1).approve(staking.address, ethers.utils.parseEther("100"));
        await staking.connect(addr1).stake(ethers.utils.parseEther("100"));
        await network.provider.send("evm_increaseTime", [3600]);
        await network.provider.send("evm_mine");
        await staking.connect(addr1).claimReward();
        const reward = await staking.userRewards(addr1.address);
        console.log("Reward:", reward.toString());
        expect(reward).to.equal(0);
        const balance = await stakingToken.balanceOf(addr1.address);
        console.log("Balance:", balance.toString());
        expect(balance).to.be.gt(ethers.utils.parseEther("0"));
    });

    it("should update rewards correctly", async function () {
        await stakingToken.transfer(addr1.address, ethers.utils.parseEther("100"));
        await stakingToken.connect(addr1).approve(staking.address, ethers.utils.parseEther("100"));
        await staking.connect(addr1).stake(ethers.utils.parseEther("100"));
        await stakingToken.transfer(addr2.address, ethers.utils.parseEther("200"));
        await stakingToken.connect(addr2).approve(staking.address, ethers.utils.parseEther("200"));
        await staking.connect(addr2).stake(ethers.utils.parseEther("200"));
        await network.provider.send("evm_increaseTime", [3600]);
        await network.provider.send("evm_mine");
        await staking.connect(addr1).claimReward();
        await staking.connect(addr2).claimReward();
        const reward1 = await staking.userRewards(addr1.address);
        const reward2 = await staking.userRewards(addr2.address);
        console.log("Reward1:", reward1.toString());
        console.log("Reward2:", reward2.toString());
        expect(reward1).to.equal(0);
        expect(reward2).to.equal(0);
        const balance1 = await stakingToken.balanceOf(addr1.address);
        const balance2 = await stakingToken.balanceOf(addr2.address);
        console.log("Balance1:", balance1.toString());
        console.log("Balance2:", balance2.toString());
        expect(balance1).to.be.gt(ethers.utils.parseEther("0"));
        expect(balance2).to.be.gt(balance1);
    });
});
