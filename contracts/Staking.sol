// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    IERC20 public stakingToken;
    uint public rewardRate = 100; // Reward rate per block
    uint public lastUpdateBlock;
    mapping(address => uint) public rewards;
    mapping(address => uint) public stakedBalances;
    mapping(address => uint) public userRewardPerTokenPaid;

    uint private _totalSupply;

    constructor(IERC20 _stakingToken) Ownable(msg.sender) {
        stakingToken = _stakingToken;
        lastUpdateBlock = block.number;
    }

    function stake(uint _amount) external {
        _updateReward(msg.sender);
        _totalSupply += _amount;
        stakedBalances[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(uint _amount) external {
        require(stakedBalances[msg.sender] >= _amount, "Insufficient balance");
        _updateReward(msg.sender);
        _totalSupply -= _amount;
        stakedBalances[msg.sender] -= _amount;
        stakingToken.transfer(msg.sender, _amount);
    }

    function claimReward() external {
        _updateReward(msg.sender);
        uint reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        stakingToken.transfer(msg.sender, reward);
    }

    function _updateReward(address _account) internal {
        uint blockReward = rewardRate * (block.number - lastUpdateBlock);
        lastUpdateBlock = block.number;
        rewards[_account] += stakedBalances[_account] * blockReward / _totalSupply;
        userRewardPerTokenPaid[_account] = rewards[_account];
    }

    function getReward(address _account) external view returns (uint) {
        uint blockReward = rewardRate * (block.number - lastUpdateBlock);
        uint totalReward = rewards[_account] + (stakedBalances[_account] * blockReward / _totalSupply);
        return totalReward;
    }
}

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
