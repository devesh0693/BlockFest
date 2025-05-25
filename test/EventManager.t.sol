// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/EventManager.sol";
import "../src/TicketNFT.sol";
import "../src/Staking.sol";
import "../src/ValidatorPoS.sol";
import "../src/SybilGuard.sol";

contract EventManagerTest is Test {
    EventManager public eventManager;
    TicketNFT public ticketNFT;
    Staking public staking;
    ValidatorPoS public validator;
    SybilGuard public sybil;

    address public insider = address(0x1);
    address public outsider = address(0x2);
    address public owner = address(0x3);

    uint256 public ticketPriceInsider = 0.001 ether;
    uint256 public ticketPriceOutsider = 0.0015 ether;

    function setUp() public {
        // Deploy all contracts
        ticketNFT = new TicketNFT(owner);
        staking = new Staking(owner, address(1)); // Mock ERC20 token address
        sybil = new SybilGuard(owner);
        validator = new ValidatorPoS(address(staking), address(sybil), 100, owner);
        eventManager = new EventManager(address(ticketNFT), address(staking), address(validator), address(sybil));

        // Set EventManager address in TicketNFT
        vm.prank(owner);
        ticketNFT.setEventManager(address(eventManager));

        // Fund accounts for testing
        vm.deal(insider, 1 ether);
        vm.deal(outsider, 1 ether);
        vm.deal(owner, 1 ether);
        vm.deal(address(eventManager), 0.1 ether); // Buffer for refunds

        // Initialize event settings
        vm.startPrank(owner);
        eventManager.setTicketPrices(ticketPriceInsider, ticketPriceOutsider);
        eventManager.setEventActive(true);
        vm.stopPrank();
    }

    function testBuyTicketForInsider() public {
        vm.prank(insider);
        eventManager.buyTicket{value: ticketPriceInsider}("uri", "qr", false);
        assertTrue(eventManager.hasTicket(insider));
    }

    function testBuyTicketForOutsider() public {
        vm.prank(outsider);
        eventManager.buyTicket{value: ticketPriceOutsider}("uri", "qr", true);
        assertTrue(eventManager.hasTicket(outsider));
    }

    function testPreventMultipleTicketsForInsider() public {
        vm.prank(insider);
        eventManager.buyTicket{value: ticketPriceInsider}("uri", "qr", false);

        vm.expectRevert("Insiders can buy only one ticket");
        eventManager.buyTicket{value: ticketPriceInsider}("uri", "qr", false);
    }

    function testCancelEvent() public {
        vm.prank(owner);
        eventManager.cancelEvent();
        assertFalse(eventManager.eventActive());
    }

    function testRefundOnEventCancellation() public {
        vm.prank(insider);
        eventManager.buyTicket{value: ticketPriceInsider}("uri", "qr", false);

        uint256 before = insider.balance;

        vm.prank(owner);
        eventManager.cancelEvent();

        uint256 afterBalance = insider.balance;
        assertGt(afterBalance, before); // Should be refunded
    }

    function testRefundTicketWhenSoldBack() public {
        vm.prank(outsider);
        eventManager.buyTicket{value: ticketPriceOutsider}("uri", "qr", true);
        uint256 tokenId = eventManager.ownedTickets(outsider, 0);

        uint256 before = outsider.balance;

        vm.prank(outsider);
        eventManager.sellTicketBack(tokenId);

        uint256 afterBalance = outsider.balance;
        assertEq(afterBalance, before + ticketPriceOutsider);
    }

    function testOwnerWithdraw() public {
        vm.prank(outsider);
        eventManager.buyTicket{value: ticketPriceOutsider}("uri", "qr", true);

        uint256 before = owner.balance;

        vm.prank(owner);
        eventManager.withdrawFunds();

        uint256 afterBalance = owner.balance;
        assertGt(afterBalance, before);
    }
}
