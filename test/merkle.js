const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MerkleProof", function () {
  let MerkleProof, merkleProof;
  let TestMerkleProof, testMerkleProof;
  let root, leaf, proof;

  before(async function () {
    MerkleProof = await ethers.getContractFactory("MerkleProof");
    merkleProof = await MerkleProof.deploy();
    await merkleProof.deployed();

    TestMerkleProof = await ethers.getContractFactory("TestMerkleProof");
    testMerkleProof = await TestMerkleProof.deploy();
    await testMerkleProof.deployed();

    root = await testMerkleProof.getRoot();
  });

  it("should verify valid proof", async function () {
    leaf = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("alice -> bob"));
    proof = [
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("bob -> dave")),
      ethers.utils.keccak256(
        Buffer.concat([
          ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("carol -> alice"))),
          ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("dave -> bob")))
        ])
      ),
    ];

    expect(await merkleProof.verify(proof, root, leaf, 0)).to.be.true;
  });

  it("should reject invalid proof", async function () {

    leaf = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("alice -> bob"));
    proof = [
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("carol -> alice")), 
      ethers.utils.keccak256(
        Buffer.concat([
          ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("carol -> alice"))),
          ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("dave -> bob")))
        ])
      ),
    ];

    expect(await merkleProof.verify(proof, root, leaf, 0)).to.be.false;
  });
});
