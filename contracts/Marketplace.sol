pragma solidity  ^0.8.0;

import './ERC20.sol';
import './NFTCollection.sol';

import 'hardhat/console.sol';



contract Marketplace  {

    // Name of the marketplace
    string public name;

    // total number of auctions
    uint public auctionSequence = 0;
    
    // Structure to define auction properties
    struct Auction {
        uint256 auctionSequence;
        address addressNFTCollection;                  
        address addressPaymentToken;
        uint256 nftId;
        address auctionCreator;     
        address payable currentBidOwner;
        uint256 currentbidPrice;        
        uint256 endAuction;             
        uint256 bidCount;          
    }

    // Array will all auctions
    Auction[] private allAuctions;

    // map with all nftId that has been listed on the marketplace
    // for auction and the status of the auction
    mapping(uint256 => Auction) public listedNFTs;

    enum Status { active, finished }

    // Public event to notify that a new auction has been created
    event NewAuction(
        uint256 auctionSequence,
        address addressNFTCollection,                 
        address addressPaymentToken,
        uint256 nftId,
        address mintedBy,     
        address currentBidOwner,
        uint256 currentbidPrice,
        uint256 endAuction,             
        uint256 bidCount     
    );

    constructor (string memory _name) {
        name = _name;
    }

    function isContract(address addr) private view returns (bool) {
        uint size;
        assembly { size := extcodesize(addr) }
        return size > 0;
    }

    // Create new auction
    function createAuction(address _addressNFTCollection,                 
                           address _addressPaymentToken,
                           uint256 _nftId,
                           uint256 _initialBid,
                           uint256 _endAuction) external returns (uint256) {
        //Check addresses 
        require(isContract(_addressNFTCollection), 'Invalid NFT Collection contract address');
        require(isContract(_addressPaymentToken), 'Invalid Payment Token contract address');
        
        // Get NFT collection
        NFTCollection nftCollection = NFTCollection(_addressNFTCollection);
        
        // Check if the endAuction time is valid
        require(_endAuction > block.timestamp, 'Invalid end date for auction');

        // Check if the initial bid price is > 0
        require(_initialBid > 0, 'Invalid initial bid price');


        // Make sure the sender that wants to create a new auction 
        // for a specific NFT is the owner of this NFT
        require(nftCollection.ownerOf(_nftId) == msg.sender, "Caller is not the owner of the NFT");

        // Make sure the owner of the NFT approved that the MarketPlace contract
        // is allowed to change ownership of the NFT XXX TODO
        require(nftCollection.getApproved(_nftId) == address(this), "Require NFT ownership transfer approval");

        // Check if there is not already an existing active auction
        // for the given NFT
        // XXX TODO

        
        // increment auction sequence
        auctionSequence ++;

        //Casting from address to address payable
        address payable currentBidOwner = payable(address(0));

        // Create new Auction object
        Auction memory newAuction = Auction({
            auctionSequence: auctionSequence,
            addressNFTCollection: _addressNFTCollection,              
            addressPaymentToken: _addressPaymentToken,
            nftId: _nftId,
            auctionCreator: msg.sender, 
            currentBidOwner: currentBidOwner,
            currentbidPrice: _initialBid,
            endAuction: _endAuction,
            bidCount: 0
        });

        //update lists
        allAuctions.push(newAuction);
        listedNFTs[_nftId] = newAuction;
    
    
        // Trigger event
        emit NewAuction(auctionSequence, _addressNFTCollection,_addressPaymentToken, _nftId, msg.sender,currentBidOwner, _initialBid, _endAuction, 0);
        return auctionSequence;
    }

    // bid()
    // claim() 
    // getAuctionStatus()
    


}