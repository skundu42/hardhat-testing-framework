const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleStorage", function () {
  it("Should return the new value once it's changed", async function () {
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorage.deploy();
    await simpleStorage.waitForDeployment();

    expect(await simpleStorage.get()).to.equal(0);

    const setValueTx = await simpleStorage.set(42);
    await setValueTx.wait();

    expect(await simpleStorage.get()).to.equal(42);
  });
});
