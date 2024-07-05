# Hardhat Testing Framework for Shardeum University

This is a framework for implementing the testcases for Shardeum University Contests.


project-root/
├── contracts/
│   ├── ERC20Mock.sol
│   └── Staking.sol
└── test/
    └── Staking.js

To compile the smart contracts:
```shell
npx hardhat compile
```

To run the tests:

```
npx hardhat test
```

## Note
- ethers v6 should be used
- chai testing framework should be used