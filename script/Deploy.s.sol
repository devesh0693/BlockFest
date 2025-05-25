// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/TicketNFT.sol";
import "../src/Staking.sol";
import "../src/SybilGuard.sol";
import "../src/ValidatorPoS.sol";
import "../src/EventManager.sol";

// Mock ERC20 staking token
contract StakingToken is ERC20 {
    constructor() ERC20("StakeToken", "STK") {
        _mint(msg.sender, 1_000_000 ether);
    }
}

contract Deploy is Script {
    function run() external {
        address deployer = vm.envAddress("DEPLOYER");
        uint256 validatorMinStake = 2 ether;

        vm.startBroadcast();

        // 1. Deploy STK token
        StakingToken stakingToken = new StakingToken();

        // 2. Deploy Staking (passing token address and owner)
        Staking staking = new Staking(address(stakingToken), deployer);

        // 3. Deploy SybilGuard
        SybilGuard sybil = new SybilGuard(deployer);

        // 4. Deploy ValidatorPoS
        ValidatorPoS validator = new ValidatorPoS(
            address(staking),
            address(sybil),
            validatorMinStake,
            deployer
        );

        // 5. Deploy EventManager first
        EventManager eventManager = new EventManager(
            address(0),
            address(staking),
            address(validator),
            address(sybil)
        );

        // 6. Deploy TicketNFT 
        TicketNFT ticketNFT = new TicketNFT(deployer);
        
        // 7. Set the event manager in TicketNFT
        ticketNFT.setEventManager(address(eventManager));

        // Logs
        console.log("StakingToken deployed at:", address(stakingToken));
        console.log("Staking deployed at:", address(staking));
        console.log("SybilGuard deployed at:", address(sybil));
        console.log("ValidatorPoS deployed at:", address(validator));
        console.log("TicketNFT deployed at:", address(ticketNFT));
        console.log("EventManager deployed at:", address(eventManager));

        vm.stopBroadcast();
    }
}
