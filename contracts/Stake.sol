// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Staking {
    ERC20 public stakingToken;
    uint256 public rewardRate = 100; // Reward rate per second
    uint256 public lastUpdateTime;
    mapping(address => uint256) public userRewards;
    mapping(address => uint256) public userStake;
    mapping(address => uint256) public userLastUpdateTime;
    uint256 public totalStaked;

    constructor(ERC20 _stakingToken) {
        stakingToken = _stakingToken;
        lastUpdateTime = block.timestamp;
    }

    function stake(uint256 _amount) external {
        updateReward(msg.sender);
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        userStake[msg.sender] += _amount;
        totalStaked += _amount;
        userLastUpdateTime[msg.sender] = block.timestamp;
    }

    function withdraw(uint256 _amount) external {
        updateReward(msg.sender);
        require(userStake[msg.sender] >= _amount, "Insufficient stake");
        userStake[msg.sender] -= _amount;
        totalStaked -= _amount;
        stakingToken.transfer(msg.sender, _amount);
        userLastUpdateTime[msg.sender] = block.timestamp;
    }

    function claimReward() external {
        updateReward(msg.sender);
        uint256 reward = userRewards[msg.sender];
        userRewards[msg.sender] = 0;
        stakingToken.transfer(msg.sender, reward);
    }

    function updateReward(address _user) internal {
        uint256 timeElapsed = block.timestamp - userLastUpdateTime[_user];
        if (timeElapsed > 0 && totalStaked > 0) {
            uint256 reward = (timeElapsed * rewardRate * userStake[_user]) / totalStaked;
            userRewards[_user] += reward;
            userLastUpdateTime[_user] = block.timestamp;
        }
    }
}

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
