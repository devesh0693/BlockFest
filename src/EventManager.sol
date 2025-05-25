// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TicketNFT.sol";
import "./Staking.sol";
import "./ValidatorPoS.sol";
import "./SybilGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventManager is Ownable {
    TicketNFT public ticketNFT;
    Staking public staking;
    ValidatorPoS public validator;
    SybilGuard public sybil;

    uint256 public ticketPriceInsider;
    uint256 public ticketPriceOutsider;
    uint256 public maxTickets;
    uint256 public ticketCount;
    bool public eventActive = true;

    mapping(address => bool) public hasTicket;
    mapping(address => bool) public isOutsider;
    mapping(address => uint256[]) public ownedTickets;
    mapping(uint256 => bool) public refunded;
    uint256[] public issuedTickets; // Track all minted tokenIds

    event TicketPurchased(address indexed buyer, uint256 tokenId);
    event TicketRefunded(address indexed holder, uint256 tokenId);

    constructor(
        address _ticketNFT,
        address _staking,
        address _validator,
        address _sybil
    ) Ownable(msg.sender) {
        ticketNFT = TicketNFT(_ticketNFT);
        staking = Staking(_staking);
        validator = ValidatorPoS(_validator);
        sybil = SybilGuard(_sybil);
        ticketPriceInsider = 0.001 ether;
        ticketPriceOutsider = (ticketPriceInsider * 3) / 2;
        maxTickets = 100;
    }

    modifier onlyWhenActive() {
        require(eventActive, "Event is not active");
        _;
    }

    modifier onlyTicketOwner(uint256 tokenId) {
        require(ticketNFT.ownerOf(tokenId) == msg.sender, "Not ticket owner");
        _;
    }

    function buyTicket(string memory tokenURI, string memory qrHash, bool outsider) external payable onlyWhenActive {
        require(ticketCount < maxTickets, "Tickets sold out");
        if (!outsider) require(!hasTicket[msg.sender], "Insiders can buy only one ticket");

        uint256 price = outsider ? ticketPriceOutsider : ticketPriceInsider;
        require(msg.value == price, "Incorrect ETH sent");

        uint256 tokenId = ticketNFT.mintTicket(msg.sender, tokenURI, qrHash);
        ticketCount++;
        hasTicket[msg.sender] = true;
        isOutsider[msg.sender] = outsider;
        ownedTickets[msg.sender].push(tokenId);
        issuedTickets.push(tokenId); // Track tokenId

        emit TicketPurchased(msg.sender, tokenId);
    }

    function sellTicketBack(uint256 tokenId) external onlyTicketOwner(tokenId) {
        require(eventActive, "Event was canceled");
        require(!refunded[tokenId], "Ticket already refunded");

        refunded[tokenId] = true; // Effects before transfer
        ticketNFT.transferFrom(msg.sender, owner(), tokenId);
        payable(msg.sender).transfer(isOutsider[msg.sender] ? ticketPriceOutsider : ticketPriceInsider);

        emit TicketRefunded(msg.sender, tokenId);
    }

    function cancelEvent() external onlyOwner {
        eventActive = false;

        for (uint256 i = 0; i < issuedTickets.length; i++) {
            uint256 tokenId = issuedTickets[i];
            if (!refunded[tokenId]) {
                address holder = ticketNFT.ownerOf(tokenId);
                refunded[tokenId] = true;
                payable(holder).transfer(isOutsider[holder] ? ticketPriceOutsider : ticketPriceInsider);
                emit TicketRefunded(holder, tokenId);
            }
        }
    }

    function refillTickets(uint256 amount) external onlyOwner {
        maxTickets += amount;
    }

    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function isValidator(address user) public view returns (bool) {
        return validator.isActiveValidator(user);
    }

    function getSybilScore(address user) public view returns (uint256) {
        return sybil.getSybilScore(user);
    }

    function getStakedAmount(address user) public view returns (uint256) {
        return staking.getStake(user);
    }

    function setEventActive(bool active) external onlyOwner {
        eventActive = active;
    }

    function setTicketPrices(uint256 insiderPrice, uint256 outsiderPrice) external onlyOwner {
        ticketPriceInsider = insiderPrice;
        ticketPriceOutsider = outsiderPrice;
    }

    function totalSupply() public view returns (uint256) {
        return ticketCount;
    }

    function getOwnedTickets(address user) public view returns (uint256[] memory) {
        return ownedTickets[user];
    }
}