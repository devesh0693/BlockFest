// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/TicketNFT.sol";

contract SetEventManagerScript is Script {
    function run() external {
        address ticketNFTAddr = 0xf17EE599E9FEcAb3Cbf37f8D7710f3D948D5bfC5;
        address eventManagerAddr = 0xa0B0aC4868f721cA6f579E7069CFA9FdcF6bED1f;

        vm.startBroadcast();
        TicketNFT(ticketNFTAddr).setEventManager(eventManagerAddr);
        vm.stopBroadcast();
    }
}
