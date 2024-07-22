const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  it("Should create proposals and allow voting", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    await voting.waitForDeployment();

    await voting.createProposal("Proposal 1");
    await voting.createProposal("Proposal 2");

    let proposal = await voting.getProposal(0);
    expect(proposal.description).to.equal("Proposal 1");
    expect(proposal.voteCount).to.equal(0);

    proposal = await voting.getProposal(1);
    expect(proposal.description).to.equal("Proposal 2");
    expect(proposal.voteCount).to.equal(0);

    await voting.connect(addr1).vote(0);
    await voting.connect(addr2).vote(0);

    proposal = await voting.getProposal(0);
    expect(proposal.voteCount).to.equal(2);

    await expect(voting.connect(addr1).vote(0)).to.be.revertedWith("Already voted");

    await voting.connect(addr1).vote(1);
    proposal = await voting.getProposal(1);
    expect(proposal.voteCount).to.equal(1);
  });
});
