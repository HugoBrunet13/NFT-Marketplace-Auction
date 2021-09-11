pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import './ERC20.sol';


contract NFTAuction is ERC721 {

        // Structure to summarize NFT properties
    struct NFT {
        uint256 nftId;                   //ID of NFT
        string nftName;               // Name of NFT
        string nftURI;                // URI of NFT
        address payable mintedBy;     // Creator of the NFT
        address payable currentOwner; // Current owner of the NFT
        address payable currentBidOwner; // Address of the current bider
        uint256 bidPrice;               // Minimum bid price
        uint256 endAuction;               // End of auction period (Timestamp)
        uint256 bidCount;              // Number of bids
    }

    // map NFT's id with a NFT structure
    mapping(uint256 => NFT) public allNFTs;
    // NFT id sequence, initialised to 0
    uint256 public nftSequenceId = 0;

    // Address of the contract of the ERC20 Token 
    // used by buyers to place new bids
    address public paymentTokenAddress;

    constructor (address _paymentTokenAddress) ERC721("NFT Marketplace", "NFTMKT") {
        paymentTokenAddress = _paymentTokenAddress;
    }
}