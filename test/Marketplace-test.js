const { expect } = require('chai');
const { ethers } = require('hardhat');



describe('NFT Auction contract', () => {
    let MarketplaceContract, Marketplace, ownerMarketPlace, addr1, addr2;

    beforeEach(async () => {
        MarketplaceContract = await ethers.getContractFactory('Marketplace');
        Marketplace = await MarketplaceContract.deploy("My NFT Marketplace");
        [ownerMarketPlace, addr1, addr2, _] = await ethers.getSigners(); 
    });

    describe('Deployment', () => {
        it('Should set the correct Name', async () => {
            expect(await Marketplace.name()).to.equal("My NFT Marketplace");
        });

        it('Should intialize auction sequence to 0', async () => {
            expect(await Marketplace.auctionSequence()).to.equal(0);
        })
    });


    describe('Transactions - Create Auction', () => {
        
        beforeEach(async () => {
            //deploy NFTCollection contract

            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollectionContract, addr3, addr4, _] = await ethers.getSigners();

            //deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, addr5, addr6, _] = await ethers.getSigners();

            //mint new NFT
            await NFTCollection.mintNFT("Test NFT", "test.uri.domain.io")
        });

        describe('Create Auction - Failure', () => {
            let endAuction = Math.floor(Date.now() / 1000) + 10000;

            it('Should reject Auction because invalid NFT collection contract address', async () => {
                await expect(Marketplace.createAuction(addr1.address, PaymentToken.address, 0, 50, endAuction ))
                    .to.be.revertedWith('Invalid NFT Collection contract address');
            })

            it('Should reject Auction because invalid Payment token contract address', async () => {
                await expect(Marketplace.createAuction(NFTCollection.address, addr1.address, 0, 50, endAuction ))
                    .to.be.revertedWith('Invalid Payment Token contract address');
            })

            it('Should reject Auction because invalid end date for auction', async () => {
                let invalidEndAuction = 1111111111
                await expect(Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, invalidEndAuction ))
                    .to.be.revertedWith('Invalid end date for auction');
            })

            it('Should reject Auction because invalid initial bid price', async () => {
                await expect(Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 1, 0, endAuction ))
                    .to.be.revertedWith('Invalid initial bid price');
            })

            it('Should reject Auction because caller is not the owner of the NFT', async () => {
                let endAuction = Math.floor(Date.now() / 1000) + 10000;
                await expect(Marketplace.connect(addr1).createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction ))
                    .to.be.revertedWith('Caller is not the owner of the NFT');
            })

            it('Should reject Auction because owner of the NFT hasnt approve ownership transfer', async () => {
                let endAuction = Math.floor(Date.now() / 1000) + 10000;
                await expect(Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction ))
                    .to.be.revertedWith('Require NFT ownership transfer approval');
            })
        });

        describe('Create Auction - Success', () => {
            beforeEach(async () => {
                await NFTCollection.approve(Marketplace.address, 0)
            });
            let endAuction = Math.floor(Date.now() / 1000) + 10000;

            it('Check if auction if correctly created ', async () => {
                await Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction )
                const auction = await Marketplace.listedNFTs(0)
                expect(auction.auctionSequence).to.equal('0')
                expect(auction.addressNFTCollection).to.equal(NFTCollection.address)
                expect(auction.addressPaymentToken).to.equal(PaymentToken.address)
                expect(auction.nftId).to.equal('0')
                expect(auction.auctionCreator).to.equal(ownerMarketPlace.address)
                expect(auction.currentBidOwner).to.equal('0x0000000000000000000000000000000000000000');
                expect(auction.endAuction).to.equal(endAuction)
                expect(auction.bidCount).to.equal(0)
            })

         
        });
       
    })



    describe('Transactions - Place new Bid on an auction', () => {
        
        beforeEach(async () => {
            //deploy NFTCollection contract

            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollectionContract, addr3, addr4, _] = await ethers.getSigners();

            //deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, addr5, addr6, _] = await ethers.getSigners();

            //mint new NFT
            await NFTCollection.mintNFT("Test NFT", "test.uri.domain.io")
            // approve NFT transfer
            await NFTCollection.approve(Marketplace.address, 0)
            // create auction
            let endAuction = Math.floor(Date.now() / 1000) + 10000;
            await Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction )
        });

        describe('Place new Bid on an auction - Failure', () => {
            
            it('Should reject new Bid because the auction index is invalid', async () => {
                await expect(Marketplace.connect(addr1).bid(4545, 100))
                    .to.be.revertedWith('Invalid auction index');
            })

            it('Should reject new Bid because the new bid is invalid', async () => {
                await expect(Marketplace.connect(addr1).bid(0, 25))
                    .to.be.revertedWith('New bid price must be higher than the current bid');
            })

            // XXX Todo, test on an expired auction

            it('Should reject new Bid because marketplace contract hasnt approval for token transfer', async () => {
                await expect(Marketplace.connect(addr1).bid(0, 60))
                    .to.be.revertedWith('Invalid allowance');
            })

            it('Should reject new Bid because new bider has not enought balances', async () => {
                
                await PaymentToken.connect(addr1).approve(Marketplace.address, 10000)

                await expect(Marketplace.connect(addr1).bid(0, 60))
                    .to.be.reverted;
            })

        });

        describe('Place new Bid on an auction - Success', () => {
            beforeEach(async () => {
                // allow marketplace contract to get token
                await PaymentToken.connect(addr1).approve(Marketplace.address, 10000)
                
                // credit addr1 balance with tokens
                await PaymentToken.transfer(addr1.address, 10000)
                
                // place new bid
                await Marketplace.connect(addr1).bid(0, 500)
            });

            it('Token balance of new bider must be updated', async () => {
                let addr1Bal = await PaymentToken.balanceOf(addr1.address)
                expect(addr1Bal).to.equal(9500)
            })

            it('Token balance of Marketplace contract must be updated', async () => {
                let marketplaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketplaceBal).to.equal(500)
            })

        });

       
       
    })
})