// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/Staking.sol";
import "../src/SybilGuard.sol";
import "../src/ValidatorPoS.sol";

contract ValidatorPoSTest is Test {
    ValidatorPoS public validatorPoS;
    Staking public staking;
    SybilGuard public sybilGuard;

    address public owner;
    address public user1;
    address public user2;

    uint256 public minStake = 1000;
    uint256 public initialStake = 1500;

    function setUp() public {
        owner = address(this);
        user1 = address(0x123);
        user2 = address(0x456);

        // Deploy SybilGuard
        sybilGuard = new SybilGuard(owner);

        // Deploy Staking with dummy token address (replace with real token or mock if needed)
        staking = new Staking(owner, address(1));

        // Provide test ETH to users
        vm.deal(user1, 5 ether);
        vm.deal(user2, 5 ether);

        // Deploy ValidatorPoS
        validatorPoS = new ValidatorPoS(address(staking), address(sybilGuard), minStake, owner);

        // Stake from user1
        vm.startPrank(user1);
        staking.stake(initialStake);
        vm.stopPrank();

        // Stake from user2
        vm.startPrank(user2);
        staking.stake(initialStake);
        vm.stopPrank();

        // Set Sybil scores (only owner can call)
        vm.startPrank(owner);
        sybilGuard.setSybilScore(user1, 40); // Valid
        sybilGuard.setSybilScore(user2, 60); // Invalid
        vm.stopPrank();
    }

    function testRegisterValidator() public {
        vm.startPrank(user1);
        validatorPoS.registerValidator();
        vm.stopPrank();

        assertTrue(validatorPoS.isActiveValidator(user1), "User1 should be an active validator");
    }

    function testRegisterValidatorWithLowSybilScore() public {
        vm.startPrank(user2);
        vm.expectRevert("High Sybil Score");
        validatorPoS.registerValidator();
        vm.stopPrank();
    }

    function testHeartbeat() public {
        vm.startPrank(user1);
        validatorPoS.registerValidator();
        validatorPoS.heartbeat();
        vm.stopPrank();

        assertTrue(validatorPoS.isActiveValidator(user1), "User1 should still be active after heartbeat");
    }

    function testSlashValidator() public {
        vm.startPrank(user1);
        validatorPoS.registerValidator();
        vm.stopPrank();

        vm.startPrank(owner);
        validatorPoS.slashValidator(user1);
        vm.stopPrank();

        assertFalse(validatorPoS.isActiveValidator(user1), "User1 should be removed after slash");
    }

    function testSlashOnlyOwner() public {
        vm.startPrank(user1);
        validatorPoS.registerValidator();
        vm.stopPrank();

        vm.startPrank(user2); // Not the owner
        vm.expectRevert("Ownable: caller is not the owner");
        validatorPoS.slashValidator(user1);
        vm.stopPrank();
    }

    function testCheckInactivity() public {
        vm.startPrank(user1);
        validatorPoS.registerValidator();
        vm.stopPrank();

        // Move forward in time
        vm.warp(block.timestamp + 2 days);

        bool isInactive = validatorPoS.checkInactivity(user1);
        assertTrue(isInactive, "User1 should be inactive after timeout");
    }

    function testSetMinStakeRequired() public {
        uint256 newMinStake = 2000;

        vm.startPrank(owner);
        validatorPoS.setMinStakeRequired(newMinStake);
        vm.stopPrank();

        assertEq(validatorPoS.minStakeRequired(), newMinStake, "Min stake should be updated");
    }

    function testSetHeartbeatTimeout() public {
        uint256 newTimeout = 2 days;

        vm.startPrank(owner);
        validatorPoS.setHeartbeatTimeout(newTimeout);
        vm.stopPrank();

        assertEq(validatorPoS.heartbeatTimeout(), newTimeout, "Heartbeat timeout should be updated");
    }

    function testDoubleRegisterFails() public {
        vm.startPrank(user1);
        validatorPoS.registerValidator();
        vm.expectRevert("Already registered");
        validatorPoS.registerValidator();
        vm.stopPrank();
    }
}
