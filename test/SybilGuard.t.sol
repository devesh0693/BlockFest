// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/SybilGuard.sol";

contract SybilGuardTest is Test {
    SybilGuard public sybilGuard;
    address public user1 = address(0x123);
    address public user2 = address(0x456);
    address public owner = address(0xABC);

    uint256 public validSybilScore = 50;
    uint256 public invalidSybilScore = 120; // Invalid score (greater than 100)

    function setUp() public {
        vm.prank(owner);
        sybilGuard = new SybilGuard(owner);
    }

    function testSetSybilScoreSuccess() public {
        vm.startPrank(owner);
        sybilGuard.setSybilScore(user1, validSybilScore);
        vm.stopPrank();

        assertEq(sybilGuard.getSybilScore(user1), validSybilScore, "The Sybil score should be updated correctly.");
    }

    function testSetSybilScoreFail() public {
        vm.startPrank(owner);
        vm.expectRevert("Score must be between 0 and 100");
        sybilGuard.setSybilScore(user1, invalidSybilScore);
        vm.stopPrank();
    }

    function testBlacklistSuccess() public {
        vm.startPrank(owner);
        sybilGuard.blacklist(user1);
        vm.stopPrank();

        assertTrue(sybilGuard.isBlacklisted(user1), "The user should be blacklisted.");
    }

    function testWhitelistSuccess() public {
        vm.startPrank(owner);
        sybilGuard.blacklist(user1);
        sybilGuard.whitelist(user1);
        vm.stopPrank();

        assertFalse(sybilGuard.isBlacklisted(user1), "The user should be whitelisted.");
    }

    function testBlacklistFail() public {
        vm.startPrank(owner);
        vm.expectRevert("Invalid address");
        sybilGuard.blacklist(address(0));
        vm.stopPrank();
    }

    function testWhitelistFail() public {
        vm.startPrank(owner);
        vm.expectRevert("Invalid address");
        sybilGuard.whitelist(address(0));
        vm.stopPrank();
    }

    function testSetSybilScoreOnlyOwner() public {
        vm.startPrank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        sybilGuard.setSybilScore(user2, validSybilScore);
        vm.stopPrank();
    }
}
