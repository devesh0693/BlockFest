// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/TicketNFT.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract TicketNFTTest is Test {
    TicketNFT public ticketNFT;
    address public owner;
    address public eventManager;
    address public user1;
    address public user2;

    string public tokenURI = "https://example.com/token/1";
    string public qrHash = "QRMETADATA123456";

    uint256 public tokenId;

    // Re-declare event for log checking
    event TicketMinted(address indexed to, uint256 indexed tokenId, string tokenURI, string qrHash);
    event TicketBurned(address indexed user, uint256 indexed tokenId);
    event EventManagerSet(address indexed newManager);

    function setUp() public {
        owner = address(this);
        eventManager = address(0x123);
        user1 = address(0x456);
        user2 = address(0x789);

        ticketNFT = new TicketNFT(owner);
        ticketNFT.setEventManager(eventManager);
    }

    function testMintTicketSuccess() public {
        vm.startPrank(eventManager);
        tokenId = ticketNFT.mintTicket(user1, tokenURI, qrHash);
        vm.stopPrank();

        assertEq(ticketNFT.ownerOf(tokenId), user1, "The minted ticket should belong to user1");
        assertEq(ticketNFT.getQRHash(tokenId), qrHash, "QR hash should match");
    }

    function testMintTicketFailNotEventManager() public {
        vm.startPrank(user1);
        vm.expectRevert("Not authorized");
        ticketNFT.mintTicket(user2, tokenURI, qrHash);
        vm.stopPrank();
    }

    function testBurnTicketSuccess() public {
        vm.startPrank(eventManager);
        tokenId = ticketNFT.mintTicket(user1, tokenURI, qrHash);
        vm.stopPrank();

        vm.startPrank(user1);
        ticketNFT.burn(tokenId);
        vm.stopPrank();

        bool exists = _exists(tokenId);
        assertFalse(exists, "The ticket should be burned and no longer exist");
    }

    function testQRHashDeletedOnBurn() public {
        vm.startPrank(eventManager);
        tokenId = ticketNFT.mintTicket(user1, tokenURI, qrHash);
        vm.stopPrank();

        vm.startPrank(user1);
        ticketNFT.burn(tokenId);
        vm.stopPrank();

        string memory storedQR = ticketNFT.getQRHash(tokenId);
        assertEq(bytes(storedQR).length, 0, "QR hash should be deleted after burn");
    }

    function testBurnTicketFailNotOwnerOrEventManager() public {
        vm.startPrank(eventManager);
        tokenId = ticketNFT.mintTicket(user1, tokenURI, qrHash);
        vm.stopPrank();

        vm.startPrank(user2);
        vm.expectRevert("Not authorized to burn");
        ticketNFT.burn(tokenId);
        vm.stopPrank();
    }

    function testSetEventManager() public {
        vm.startPrank(owner);
        address newManager = address(0x999);
        ticketNFT.setEventManager(newManager);
        vm.stopPrank();

        assertEq(ticketNFT.eventManager(), newManager, "The event manager should be updated");
    }

    function testSetEventManagerFailNotOwner() public {
        vm.startPrank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        ticketNFT.setEventManager(address(0x999));
        vm.stopPrank();
    }

    // Use try/catch to avoid revert when checking if token exists
    function _exists(uint256 tokenIdarg) internal view returns (bool) {
        try ticketNFT.ownerOf(tokenIdarg) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
}
