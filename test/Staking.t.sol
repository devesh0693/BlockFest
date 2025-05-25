// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    uint256 public minStakeAmount = 1e18; // 1 token
    uint256 public maxStakePercent = 30; // 30% max stake
    uint256 public inactivityThreshold = 30 days;
    uint256 public penaltyRate = 10; // 10% penalty

    mapping(address => uint256) public stakes;
    uint256 public totalStaked;

    constructor() Ownable(msg.sender) {}

    // Function to stake tokens
    function stake(uint256 _amount) external {
        require(_amount >= minStakeAmount, "Amount below minimum stake");
        require(stakes[msg.sender] + _amount <= (totalStaked * maxStakePercent) / 100, "Stake exceeds allowed limit");

        stakes[msg.sender] += _amount;
        totalStaked += _amount;
    }

    // Function to unstake tokens
    function unstake(uint256 _amount) external {
        require(stakes[msg.sender] >= _amount, "Insufficient stake to unstake");
        
        stakes[msg.sender] -= _amount;
        totalStaked -= _amount;
    }

    // Function to set staking limits (for testing purposes)
    function setLimits(uint256 _minStakeAmount, uint256 _maxStakePercent) external onlyOwner {
        minStakeAmount = _minStakeAmount;
        maxStakePercent = _maxStakePercent;
    }

    // Function to slash an inactive staker
    function slashInactiveStaker(address _staker) external {
        require(block.timestamp > inactivityThreshold, "Staker is not inactive");

        uint256 stakedAmount = stakes[_staker];
        uint256 slashAmount = (stakedAmount * penaltyRate) / 100;

        stakes[_staker] -= slashAmount;
        totalStaked -= slashAmount;
    }

    // Function to check if a user is eligible for a protected function
    function protectedFunction() external view {
        require(stakes[msg.sender] > 0, "Stake required for access");
    }

    // Function to hash a string
    function hashString(string memory _data) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_data));
    }
}