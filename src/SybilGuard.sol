// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SybilGuard is Ownable {
    uint256 public constant MAX_SCORE = 100;

    mapping(address => uint256) private sybilScores;
    mapping(address => bool) private blacklisted;

    event SybilScoreUpdated(address indexed user, uint256 newScore);
    event UserBlacklisted(address indexed user);
    event UserWhitelisted(address indexed user);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setSybilScore(address user, uint256 score) external onlyOwner {
        require(user != address(0), "Invalid address");
        require(score <= MAX_SCORE, "Score must be between 0 and 100");
        sybilScores[user] = score;

        emit SybilScoreUpdated(user, score);
    }

    function getSybilScore(address user) external view returns (uint256) {
        return sybilScores[user];
    }

    function blacklist(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        blacklisted[user] = true;

        emit UserBlacklisted(user);
    }

    function whitelist(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        blacklisted[user] = false;

        emit UserWhitelisted(user);
    }

    function isBlacklisted(address user) external view returns (bool) {
        return blacklisted[user];
    }
}