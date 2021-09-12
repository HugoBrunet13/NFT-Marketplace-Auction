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
        address creator;     
        address payable currentBidOwner;
        uint256 currentBidPrice;        
        uint256 endAuction;             
        uint256 bidCount;
        bool isClaimed;        
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
        uint256 currentBidPrice,
        uint256 endAuction,             
        uint256 bidCount     
    );

    event NewBidOnAuction(
        uint256 auctionIndex, 
        uint256 newBid
    );

    event NFTClaimed(
        uint256 auctionIndex, 
        uint256 nftId, 
        address claimedBy
    );

    event TokensClaimed(
        uint256 auctionIndex, 
        uint256 nftId, 
        address claimedBy
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


        //Casting from address to address payable
        address payable currentBidOwner = payable(address(0));

        // Create new Auction object
        Auction memory newAuction = Auction({
            auctionSequence: auctionSequence,
            addressNFTCollection: _addressNFTCollection,              
            addressPaymentToken: _addressPaymentToken,
            nftId: _nftId,
            creator: msg.sender, 
            currentBidOwner: currentBidOwner,
            currentBidPrice: _initialBid,
            endAuction: _endAuction,
            bidCount: 0,
            isClaimed: false
        });

        //update lists
        allAuctions.push(newAuction);
        listedNFTs[_nftId] = newAuction;

        // increment auction sequence
        auctionSequence ++;
    
        // Trigger event
        emit NewAuction(auctionSequence, _addressNFTCollection,_addressPaymentToken, _nftId, msg.sender,currentBidOwner, _initialBid, _endAuction, 0);
        return auctionSequence;
    }

    function isOpen(uint256 auctionIndex) public view returns (bool) {
        Auction storage auction = allAuctions[auctionIndex];
        if(block.timestamp >= auction.endAuction)
            return false;
        return true;
    }

    function getCurrentBidOwner(uint256 auctionIndex) public view returns (address) {
        require(auctionIndex < allAuctions.length, "Invalid auction index");
        return allAuctions[auctionIndex].currentBidOwner;
    }

    function getCurrentBid(uint256 auctionIndex) public view returns (uint256) {
        require(auctionIndex < allAuctions.length, "Invalid auction index");
        return allAuctions[auctionIndex].currentBidPrice;
    }

    /**
     * Place new bid on a given auction
     * @param auctionIndex Index of auction
     * @param newBid New bid price
     */
    function bid(uint256 auctionIndex, uint256 newBid) external returns (bool) {
        require(auctionIndex < allAuctions.length, 'Invalid auction index'); // XXX Optimize
        Auction storage auction = allAuctions[auctionIndex];
        // check if auction exist
        require(auction.creator != address(0), 'Invalid auction');
        // check if auction is still open
        require(isOpen(auctionIndex), "Auction is not open");
        
        // check if new bid price is higher than the current one
        require(newBid>auction.currentBidPrice, 'New bid price must be higher than the current bid');
            
        //check if new bidder is not the owner ??
        // XXX todo

        // get ERC20 token contract
        ERC20 paymentToken = ERC20(auction.addressPaymentToken);
        
        // new bid is better than current bid!
        
        // transfer token from newbider account to the marketplace account 
        // to lock the tokens
        require(paymentToken.transferFrom(msg.sender, address(this), newBid), 'Tranfer of token failed');
        
        //new bid is correct so must refund the current bid owner (if there is one!)
        if(auction.bidCount > 0) { 
            paymentToken.transfer(auction.currentBidOwner, auction.currentBidPrice);
        }
        
        // update auction info 
        address payable newBidOwner = payable(msg.sender);
        auction.currentBidOwner = newBidOwner;
        auction.currentBidPrice = newBid;
        auction.bidCount++;

        // XXX ToDO update mapp?

        emit NewBidOnAuction(auctionIndex, newBid);

        return true;
        
    }  

    function claimNFT(uint256 auctionIndex) external {
        require(auctionIndex < allAuctions.length, 'Invalid auction index'); // XXX Optimize
        require(!isOpen(auctionIndex), 'Auction is still open');

        Auction storage auction = allAuctions[auctionIndex];
        
        require(!auction.isClaimed, 'Funds and NFT already released');
        require(auction.currentBidOwner == msg.sender, "NFT can be claimed only by the current bid owner");

        NFTCollection nftCollection = NFTCollection(auction.addressNFTCollection);
        require(nftCollection.transferNFTFrom(auction.creator, auction.currentBidOwner, 0));

        ERC20 paymentToken = ERC20(auction.addressPaymentToken);
        require(paymentToken.transfer(auction.creator, auction.currentBidPrice));

        auction.isClaimed = true;
        emit NFTClaimed(auctionIndex, auction.nftId, msg.sender);
    }



}