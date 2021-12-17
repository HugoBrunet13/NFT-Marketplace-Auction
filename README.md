# NFT-Marketplace

Basic **NFT Marketplace** which enables NFT owners to **list an ERC721 NFT for sales** by creating **new auctions**.   
The creator of the auction must specify in which currency (ERC20 token) he wants buyers to place new bids on his auction.

**Buyers can bid** on available auctions. **Their tokens will then be locked on the Marketplace contract**.   
When the auction period is over, the **winner can claim his reward (the NFT)**. This  will also trigger the transfer of the money locked in the marketplace contract into the wallet of the creator of the auction.  

When an auction is created for an NFT, **the ownership of this NFT will be transfered from the creator of the auction to the Marketplace wallet**.   
In case an auction **ends without any new bid**, the creator of the auction can **be refunded**.     
If an auction is over but **the winner hasn't claimed his NFT yet**, the creator of the auction **can claim for his money**.  
The payment tokens will then be transfered to the creator of the auction and the NFT will be sent to the winner of the auction.  
 
Most of the scenarios supported by this auction contract are covered in the testing file `test/Marketplace-test.js`. (see bellow an overview of the tests). 

## Structure of the project
### 1. Smart contracts - `contract/` 
Smart contract are implemented with **Solidity** and require the **version 0.8.0** of the compiler. 
1. `ERC20.sol`   
Basic ERC20 Token contract that will be used by buyers to place new bid on an auction

2. `NFTCollection.sol`  
ERC721 Token contract inherited from the openZepplin library: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol  
This contract will be used to **mint new NFT**, that will then be **referenced in the auction created on the marketplace**

3. `Marketplace.sol`  
The Marketplace contract, main file of the project, where owners of NFTs can create new auctions and buyers will be able to place new bid.

### 2. Tests - `test/`
Unit tests for `NFTCollection.sol` and `Marketplace.sol` contracts. 

### 3. Scripts - `scripts/`
Deployment scripts

## How to run?
### Stack
* NodeJS (v >= 12.0.0)
* npm 
* Hardhat 
* Solidity (v0.8.0)

### Install dependencies and run tests
1. ` npm install`
2. `npx hardhat compile` (to compile contracts and generate artifacts)
3. `npx hardhat test` (to run existing unit tests)  

**NB:** Run  `npx hardhat test .\test\Marketplace-test.js` to only run test cases of the `Marketplace.sol` contract   

## Next steps?
* Give more control on an existing auction to his creator. Example:
    * Update endtime of an existing auction 
    * Cancel auction with automatic refund
* Enable auction creator to accept multiple ERC20 Token for payment
* Build DApp to interact with the marketplace 
* Improve ERC721 implementation
* Optmize unit tests of marketplace contract

## Testing

Marketplace and NFTCollection contracts have been tested using **Hardhat** framework and **Chai** library.   
To run the test, please make sure all dependencies are installed and use the following command: `npx hardhat test`.

Below an overview of the tests for the `Marketplace.sol` contract

```
Marketplace contract
    Deployment
      √ Should set the correct name
      √ Should intialize auction sequence to 0
    Transactions - Create Auction
      Create Auction - Failure
        √ Should reject Auction because the NFT collection contract address is invalid
        √ Should reject Auction because the Payment token contract address is invalid
        √ Should reject Auction because the end date of the auction is invalid
        √ Should reject Auction because the initial bid price is invalid
        √ Should reject Auction because caller is not the owner of the NFT
        √ Should reject Auction because owner of the NFT hasnt approved ownership transfer
      Create Auction - Success
        √ Check if auction is created (61ms)
        √ Owner of NFT should be the marketplace contract 
    Transactions - Place new Bid on auction
      Place new Bid on an auction - Failure
        √ Should reject new Bid because the auction index is invalid
        √ Should reject new Bid because the new bid amount is invalid
        √ Should reject new Bid because caller is the creator of the auction
        √ Should reject new Bid because marketplace contract has no approval for token transfer
        √ Should reject new Bid because new bider has not enought balances (39ms)
      Place new Bid on an auction - Success
        √ Token balance of new bider must be debited with the bid amount
        √ Token balance of Marketplace contract must be updated with new bid amount
        √ Auction info are correctly updated
        √ Current bid owner must be refunded after a new successful bid is placed (72ms)
    Transactions - Claim NFT
      Claim NFT - Failure
        √ Should reject because auction is still open (125ms)
        √ Should reject because caller is not the current bid owner (111ms)
      Claim NFT - Success
        √ Winner of the auction must be the new owner of the NFT (152ms)
        √ Creator of the auction must have his token balance credited with the highest bid amount (151ms)
        √ Winner of the auction should not be able to claim NFT more than one time (158ms)
    Transactions - Claim Token
      Claim Token - Failure
        √ Should reject because auction is still open (127ms)
        √ Should reject because caller is not the creator of the auction (125ms)
      Claim Token - Success
        √ Winner of the auction must be the new owner of the NFT (152ms)
        √ Creator of the auction must have his token balance credited with the highest bid amount (151ms)
        √ Creator of the auction should not be able to claim his token more than one time (158ms)
    Transactions - Refund NFT
      Refund NFT - Failure
        √ Should reject because there is already a bider on the auction (140ms)
      Refund NFT - Success
        √ Creator of the auction must be again the owner of the NFT (89ms)


  31 passing (9s)
```

## Deployment

The 3 contracts are deployed on Ropsten network:
- **Marketplace:**  0x7DfA07f05d465ab73B536BfA493AEC7fed98ECE9
https://ropsten.etherscan.io/address/0x7DfA07f05d465ab73B536BfA493AEC7fed98ECE9
- **NFTCollection:** 0x37b97895638B00871c09602e2B7Cce062e9E0dCE
https://ropsten.etherscan.io/address/0x37b97895638B00871c09602e2B7Cce062e9E0dCE
- **ERC20 Token:** 0xA5264207375B3202B22401c8A08f7C152354E9a2
https://ropsten.etherscan.io/address/0xA5264207375B3202B22401c8A08f7C152354E9a2


To deploy, you need to edit the file `scripts/deploy.js` and add your personal KEY:
```   
const ALCHEMY_API_KEY = ""; // PUT YOUR KEY HERE
const ROPSTEN_PRIVATE_KEY = ""; //PUT YOUR PRIVATE KEY HERE
```
You must also uncomment the commented lines:
```
  // networks: {
  //   ropsten: {
  //     url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
  //     accounts: [`0x${ROPSTEN_PRIVATE_KEY}`],
  //   },
  // },
```
Then, you can run this command: `npx hardhat run scripts/deploy.js --network ropsten`  
For more information, please check this tutorial: https://hardhat.org/tutorial/deploying-to-a-live-network.html 

## Documentation
* Hardhat tutorials: https://hardhat.org/tutorial/
* OpenZepplin contracts: https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token
