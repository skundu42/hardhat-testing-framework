const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("Staking", function () {
    let staking, stakingToken;
    let owner, addr1, addr2;
    let initialSupply = ethers.parseEther("1000");

    beforeEach(async function () {
        const StakingToken = await ethers.getContractFactory("ERC20Mock");
        stakingToken = await StakingToken.deploy("Staking Token", "STK", initialSupply);
        await stakingToken.waitForDeployment();

        const Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy(await stakingToken.getAddress());
        await staking.waitForDeployment();

        [owner, addr1, addr2] = await ethers.getSigners();
    });

    it("should allow users to stake tokens", async function () {
        await stakingToken.transfer(addr1.address, ethers.parseEther("100"));
        await stakingToken.connect(addr1).approve(await staking.getAddress(), ethers.parseEther("100"));
        await staking.connect(addr1).stake(ethers.parseEther("100"));

        expect(await staking.userStake(addr1.address)).to.equal(ethers.parseEther("100"));
        expect(await staking.totalStaked()).to.equal(ethers.parseEther("100"));
    });

    it("should allow users to withdraw staked tokens", async function () {
        await stakingToken.transfer(addr1.address, ethers.parseEther("100"));
        await stakingToken.connect(addr1).approve(await staking.getAddress(), ethers.parseEther("100"));
        await staking.connect(addr1).stake(ethers.parseEther("100"));

        await staking.connect(addr1).withdraw(ethers.parseEther("50"));

        expect(await staking.userStake(addr1.address)).to.equal(ethers.parseEther("50"));
        expect(await staking.totalStaked()).to.equal(ethers.parseEther("50"));
    });

    it("should distribute rewards correctly", async function () {
        await stakingToken.transfer(addr1.address, ethers.parseEther("100"));
        await stakingToken.connect(addr1).approve(await staking.getAddress(), ethers.parseEther("100"));
        await staking.connect(addr1).stake(ethers.parseEther("100"));

        // Simulate some time passing
        await network.provider.send("evm_increaseTime", [3600]); // Increase time by 1 hour
        await network.provider.send("evm_mine"); // Mine a new block to update timestamp

        await staking.connect(addr1).claimReward();
        const reward = await staking.userRewards(addr1.address);
        console.log("Reward:", reward.toString());
        expect(reward).to.equal(0); // Since the reward has been claimed, userRewards should be 0

        const balance = await stakingToken.balanceOf(addr1.address);
        console.log("Balance:", balance.toString());
        expect(balance).to.be.above(0); // The balance of addr1 should have increased by the reward amount
    });

    it("should update rewards correctly", async function () {
        await stakingToken.transfer(addr1.address, ethers.parseEther("100"));
        await stakingToken.connect(addr1).approve(await staking.getAddress(), ethers.parseEther("100"));
        await staking.connect(addr1).stake(ethers.parseEther("100"));

        await stakingToken.transfer(addr2.address, ethers.parseEther("200"));
        await stakingToken.connect(addr2).approve(await staking.getAddress(), ethers.parseEther("200"));
        await staking.connect(addr2).stake(ethers.parseEther("200"));

        // Simulate some time passing
        await network.provider.send("evm_increaseTime", [3600]); // Increase time by 1 hour
        await network.provider.send("evm_mine"); // Mine a new block to update timestamp

        await staking.connect(addr1).claimReward();
        await staking.connect(addr2).claimReward();

        const reward1 = await staking.userRewards(addr1.address);
        const reward2 = await staking.userRewards(addr2.address);

        console.log("Reward1:", reward1.toString());
        console.log("Reward2:", reward2.toString());

        expect(reward1).to.equal(0); // Since the reward has been claimed, userRewards should be 0
        expect(reward2).to.equal(0); // Since the reward has been claimed, userRewards should be 0

        const balance1 = await stakingToken.balanceOf(addr1.address);
        const balance2 = await stakingToken.balanceOf(addr2.address);
        console.log("Balance1:", balance1.toString());
        console.log("Balance2:", balance2.toString());

        expect(balance1).to.be.above(0); // The balance of addr1 should have increased by the reward amount
        expect(balance2).to.be.above(balance1); // The balance of addr2 should be greater than balance1 due to higher stake
    });
});
