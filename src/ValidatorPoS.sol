// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Staking.sol";
import "./SybilGuard.sol";

contract ValidatorPoS is Ownable {
    struct Validator {
        bool active;
        uint256 lastHeartbeat;
        uint256 stakeAmount;
    }

    mapping(address => Validator) public validators;
    address[] public validatorList;

    Staking public staking;
    SybilGuard public sybilGuard;
    uint256 public heartbeatTimeout = 1 days;
    uint256 public minStakeRequired;

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event Heartbeat(address indexed validator);
    event MinStakeUpdated(uint256 newStake);
    event HeartbeatTimeoutUpdated(uint256 newTimeout);

    constructor(address _staking, address _sybilGuard, uint256 _minStake, address initialOwner)
        Ownable(initialOwner)
    {
        require(_staking != address(0), "Invalid staking contract");
        require(_sybilGuard != address(0), "Invalid sybil guard");
        require(initialOwner != address(0), "Invalid owner");

        staking = Staking(_staking);
        sybilGuard = SybilGuard(_sybilGuard);
        minStakeRequired = _minStake;
    }

    function registerValidator() external {
        require(!validators[msg.sender].active, "Already a validator");

        uint256 stake = staking.getStake(msg.sender);
        require(stake >= minStakeRequired, "Not enough stake");

        uint256 sybilScore = sybilGuard.getSybilScore(msg.sender);
        require(sybilScore <= 50, "High Sybil Score");

        validators[msg.sender] = Validator(true, block.timestamp, stake);
        validatorList.push(msg.sender);

        emit ValidatorAdded(msg.sender);
    }

    function heartbeat() external {
        require(validators[msg.sender].active, "Not active");
        validators[msg.sender].lastHeartbeat = block.timestamp;
        emit Heartbeat(msg.sender);
    }

    function slashValidator(address validator) external onlyOwner {
        require(validators[validator].active, "Not a validator");
        validators[validator].active = false;
        emit ValidatorRemoved(validator);
        // Optionally: remove from validatorList if needed
    }

    function checkInactivity(address validator) external view returns (bool) {
        return block.timestamp > validators[validator].lastHeartbeat + heartbeatTimeout;
    }

    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }

    function isActiveValidator(address validator) external view returns (bool) {
        return validators[validator].active;
    }

    function getValidatorStake(address validator) external view returns (uint256) {
        return validators[validator].stakeAmount;
    }

    function setMinStakeRequired(uint256 _minStake) external onlyOwner {
        minStakeRequired = _minStake;
        emit MinStakeUpdated(_minStake);
    }

    function setHeartbeatTimeout(uint256 timeout) external onlyOwner {
        heartbeatTimeout = timeout;
        emit HeartbeatTimeoutUpdated(timeout);
    }
}