// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    address public eventManager;
    mapping(uint256 => string) public qrHashes;

    event TicketMinted(address indexed to, uint256 indexed tokenId, string tokenURI, string qrHash);
    event TicketBurned(address indexed user, uint256 indexed tokenId);
    event EventManagerSet(address indexed newManager);

    constructor(address initialOwner) ERC721("BlockFestTicket", "BFT") Ownable(initialOwner) {}

    modifier onlyEventManager() {
        require(msg.sender == eventManager, "Not authorized");
        _;
    }

    function setEventManager(address _eventManager) external onlyOwner {
        require(_eventManager != address(0), "Invalid event manager address");
        eventManager = _eventManager;

        emit EventManagerSet(_eventManager);
    }

    function mintTicket(address to, string memory tokenURI, string memory qrHash)
        external
        onlyEventManager
        returns (uint256)
    {
        uint256 tokenId = nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        qrHashes[tokenId] = qrHash;

        emit TicketMinted(to, tokenId, tokenURI, qrHash);
        return tokenId;
    }

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == eventManager, "Not authorized to burn");

        delete qrHashes[tokenId]; // Clean up before burn
        _burn(tokenId);

        emit TicketBurned(msg.sender, tokenId);
    }

    function getQRHash(uint256 tokenId) external view returns (string memory) {
        return qrHashes[tokenId];
    }
}