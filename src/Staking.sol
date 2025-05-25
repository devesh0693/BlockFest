// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    IERC20 public token;

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => StakeInfo) public stakes;
    address[] public stakers;

    uint256 public totalStaked;
    uint256 public minStakeAmount;
    uint256 public maxStakePercent; // Max % stake allowed (e.g., 30%)
    uint256 public inactivityThreshold; // Seconds of inactivity
    uint256 public penaltyRate; // % to slash

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Slashed(address indexed user, uint256 amount);
    event HashGenerated(bytes32 hash);

    constructor(address _token, address _owner) Ownable(_owner) {
    token = IERC20(_token);
    minStakeAmount = 1e18;
    maxStakePercent = 30;
    inactivityThreshold = 30 days;
    penaltyRate = 10;
}


    function stake(uint256 _amount) external {
        require(_amount >= minStakeAmount, "Amount below minimum stake");
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        uint256 newStakeAmount = stakes[msg.sender].amount + _amount;
        uint256 newTotalStaked = totalStaked + _amount;
        require((newStakeAmount * 100) / newTotalStaked <= maxStakePercent, "Stake exceeds allowed limit");

        if (stakes[msg.sender].amount == 0) {
            stakers.push(msg.sender);
        }

        stakes[msg.sender].amount = newStakeAmount;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked = newTotalStaked;

        emit Staked(msg.sender, _amount);
    }
    function getStake(address _user) external view returns (uint256) {
    return stakes[_user].amount;
}


    function unstake(uint256 _amount) external {
        require(stakes[msg.sender].amount >= _amount, "Insufficient staked amount");

        stakes[msg.sender].amount -= _amount;
        totalStaked -= _amount;

        // Optional: Remove from stakers array if amount is now 0
        // Not gas-efficient for on-chain iteration but noted

        require(token.transfer(msg.sender, _amount), "Transfer failed");

        emit Unstaked(msg.sender, _amount);
    }

    function slashInactiveStaker(address _staker) external onlyOwner {
        StakeInfo storage stakeInfo = stakes[_staker];
        require(stakeInfo.amount > 0, "Nothing to slash");
        require(block.timestamp - stakeInfo.timestamp > inactivityThreshold, "Staker still active");

        uint256 slashAmount = (stakeInfo.amount * penaltyRate) / 100;
        stakeInfo.amount -= slashAmount;
        totalStaked -= slashAmount;

        emit Slashed(_staker, slashAmount);
    }

    function getStakePercentage(address _user) public view returns (uint256) {
        if (totalStaked == 0) return 0;
        return (stakes[_user].amount * 100) / totalStaked;
    }

    function getStakerCount() external view returns (uint256) {
        return stakers.length;
    }

    function setMinStakeAmount(uint256 _amount) external onlyOwner {
        minStakeAmount = _amount;
    }

    function setMaxStakePercent(uint256 _percent) external onlyOwner {
        require(_percent <= 100, "Invalid percent");
        maxStakePercent = _percent;
    }

    function setInactivityThreshold(uint256 _threshold) external onlyOwner {
        inactivityThreshold = _threshold;
    }

    function setPenaltyRate(uint256 _rate) external onlyOwner {
        require(_rate <= 100, "Invalid rate");
        penaltyRate = _rate;
    }

    // Hashing utility for verification or logging
    function hashData(address _user, uint256 _amount, uint256 _timestamp) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_user, _amount, _timestamp));
    }

    function hashString(string memory _input) external  returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(_input));
        emit HashGenerated(hash);
        return hash;
    }
    function pureHashString(string memory _input) external pure returns (bytes32) {
    return keccak256(abi.encodePacked(_input));
}


    function hashTransaction(address _from, address _to, uint256 _amount, uint256 _nonce) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_from, _to, _amount, _nonce));
    }

    // Sybil resistance: require minimum stake before performing sensitive actions
    modifier onlySybilResistant() {
        require(stakes[msg.sender].amount >= minStakeAmount, "Stake required for access");
        _;
    }

    function protectedFunction() external onlySybilResistant {
        // logic only accessible to real stakers
    }
}