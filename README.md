    # NFT-Marketplace

    Basic **NFT Marketplace** which enables users to **list an ERC721 NFT for sales** by creation **new auctions**.   
    The creator of the auction must specify the ERC20 token he wants buyers to place new bids. 

    **Bayers can bid** on available auctions and when the auction period is over, the **winner can claim his token**. 

    Most of the scenarios supported by this auction contract are covered in the testing file `test/Marketplace-test.js`. (see bellow an overvoew of the tests). 

    ## Structure of the project
    ### 1. Smart contracts - `contract/` 
    Smart contract are implemented with **Solidity** and require the **version 0.8.0** of the compiler. 
    1. `ERC20.sol`   
    Basic ERC20 Token contract that will be used by buyers to place new bid on an auction

    2. `NFTCollection.sol`  
    ERC721 Token contract inherited from the openZepplin library: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol
    This contract will be use to mint new NFT, that will then be referenced in the auction created on the marketplace

    3. `Marketplace.sol`  
    The Marketplace where owner of NFTs will be able to create new auction and buyer will be able to place new big on existing auction.  
    All the logic of the market place is defined on this contract. 

    ### 2. Tests - `test/`
    Unit tests for `NFTCollection.sol` and `Marketplace.sol` contracts. 

    ### 3. Artifact - `artifacts/`
    Artifact files for each contracts 

    ## How to run?
    ### Stack
    * NodeJS 
    * npm 
    * Hardhat 
    * Solidity (v0.8.0)

    ### Install dependencies and run tests
    1. ` npm install`
    2. `npx hardhat compile` (to compile contracts)
    3. `npx hardhat test` (to run existing unit tests)
    ## Testing

    Marketplace and NFTCollection contract have been tested using **Hardhat** framework and **Chai** library.   
    To run the test, please make sure all dependencies are installed please type: `npx hardhat test`.

    Bellow on overview of the tests for `Marketplace.sol` contract

    ```
    Marketplace contract
        Deployment
        √ Should set the correct name (38ms)
        √ Should intialize auction sequence to 0
        Transactions - Create Auction
        Create Auction - Failure
            √ Should reject Auction because the NFT collection contract address is invalid (55ms)
            √ Should reject Auction because the Payment token contract address is invalid
            √ Should reject Auction because the end date of the auction is invalid
            √ Should reject Auction because the initial bid price is invalid
            √ Should reject Auction because caller is not the owner of the NFT
            √ Should reject Auction because owner of the NFT hasnt approved ownership transfer
        Create Auction - Success
            √ Check if auction is created
            √ Owner of NFT should be the marketplace contract 
        Transactions - Place new Bid on an auction
        Place new Bid on an auction - Failure
            √ Should reject new Bid because the auction index is invalid
            √ Should reject new Bid because the new bid amount is invalid
            √ Should reject new Bid because caller is the creator of the auction
            √ Should reject new Bid because marketplace contract has no approval for token transfer
            √ Should reject new Bid because new bider has not enought balances (40ms)
        Place new Bid on an auction - Success
            √ Token balance of new bider must be debited with the bid amount
            √ Token balance of Marketplace contract must be updated with new bid amount
            √ Auction info are correctly updated
            √ Current bid owner must be refunded after a new successful bid is placed (72ms)
        Transactions - Claim NFT
        Claim NFT - Failure
            √ Should reject because auction is still open (109ms)
            √ Should reject because caller is not the current bid owner (128ms)
        Claim NFT - Success
            √ Winner of the auction must be the new owner of the NFT (150ms)
            √ Creator of the auction must have his token balance credited with the highest bid amount (153ms)
            √ Winner of the auction should not be able to claim NFT more than one time (144ms)
        Transactions - Claim Token
        Claim Token - Failure
            √ Should reject because auction is still open (127ms)
            √ Should reject because caller is not the creator of the auction (111ms)
        Claim Token - Success
            √ Winner of the auction must be the new owner of the NFT (135ms)
            √ Creator of the auction must have his token balance credited with the highest bid amount (154ms)
            √ Creator of the auction should not be able to claim his token more than one time (172ms)


    29 passing (8s)
    ```

    ## Documentation
    * Hardhat tutorials: https://hardhat.org/tutorial/