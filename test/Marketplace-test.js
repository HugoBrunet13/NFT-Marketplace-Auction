const { expect } = require('chai');
const { ethers } = require('hardhat');


describe('Marketplace contract', () => {
    beforeEach(async () => {
        // Deploy Marketplace contract
        MarketplaceContract = await ethers.getContractFactory('Marketplace');
        Marketplace = await MarketplaceContract.deploy("My NFT Marketplace");
        [ownerMarketPlace, USER1, USER2, _] = await ethers.getSigners();
    });

    describe('Deployment', () => {
        it('Should set the correct name', async () => {
            expect(await Marketplace.name()).to.equal("My NFT Marketplace");
        });

        it('Should intialize auction sequence to 0', async () => {
            expect(await Marketplace.index()).to.equal(0);
        })
    });


    describe('Transactions - Create Auction', () => {

        beforeEach(async () => {
            // Deploy NFTCollection contract
            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, _, _, _] = await ethers.getSigners();

            // Deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, _, _, _] = await ethers.getSigners();

            // Mint new NFT
            await NFTCollection.mintNFT("Test NFT", "test.uri.domain.io")
        });

        describe('Create Auction - Failure', () => {
            let endAuction = Math.floor(Date.now() / 1000) + 10000;

            it('Should reject Auction because the NFT collection contract address is invalid', async () => {
                await expect(Marketplace.createAuction(USER1.address, PaymentToken.address, 0, 50, endAuction))
                    .to.be.revertedWith('Invalid NFT Collection contract address');
            })

            it('Should reject Auction because the Payment token contract address is invalid', async () => {
                await expect(Marketplace.createAuction(NFTCollection.address, USER1.address, 0, 50, endAuction))
                    .to.be.revertedWith('Invalid Payment Token contract address');
            })

            it('Should reject Auction because the end date of the auction is invalid', async () => {
                let invalidEndAuction = 1111111111
                await expect(Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, invalidEndAuction))
                    .to.be.revertedWith('Invalid end date for auction');
            })

            it('Should reject Auction because the initial bid price is invalid', async () => {
                await expect(Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 1, 0, endAuction))
                    .to.be.revertedWith('Invalid initial bid price');
            })

            it('Should reject Auction because caller is not the owner of the NFT', async () => {
                let endAuction = Math.floor(Date.now() / 1000) + 10000;
                await expect(Marketplace.connect(USER1).createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction))
                    .to.be.revertedWith('Caller is not the owner of the NFT');
            })

            it('Should reject Auction because owner of the NFT hasnt approved ownership transfer', async () => {
                let endAuction = Math.floor(Date.now() / 1000) + 10000;
                await expect(Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction))
                    .to.be.revertedWith('Require NFT ownership transfer approval');
            })
        });

        describe('Create Auction - Success', () => {
            beforeEach(async () => {
                // Approve NFT Transfer by Marketplace
                await NFTCollection.approve(Marketplace.address, 0)
            });
            let endAuction = Math.floor(Date.now() / 1000) + 10000;

            it('Check if auction is created', async () => {
                await Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction)
                const currentBid = await Marketplace.getCurrentBid(0)
                expect(currentBid).to.equal(50)
            })

            it('Owner of NFT should be the marketplace contract ', async () => {
                await Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction)
                const ownerNFT = await NFTCollection.ownerOf(0)
                expect(ownerNFT).to.equal(Marketplace.address)
            })
        });

    })

    describe('Transactions - Place new Bid on auction', () => {

        beforeEach(async () => {
            // Deploy NFTCollection contract
            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, _, _, _] = await ethers.getSigners();

            // Deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, _, _, _] = await ethers.getSigners();

            // Mint new NFT
            await NFTCollection.mintNFT("Test NFT", "test.uri.domain.io")
            
            // Approve NFT transfer by the marketplace
            await NFTCollection.approve(Marketplace.address, 0)

            // Create new auction
            let endAuction = Math.floor(Date.now() / 1000) + 10000;
            await Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction)
        });

        describe('Place new Bid on an auction - Failure', () => {

            it('Should reject new Bid because the auction index is invalid', async () => {
                await expect(Marketplace.connect(USER1).bid(4545, 100))
                    .to.be.revertedWith('Invalid auction index');
            })

            it('Should reject new Bid because the new bid amount is invalid', async () => {
                await expect(Marketplace.connect(USER1).bid(0, 25))
                    .to.be.revertedWith('New bid price must be higher than the current bid');
            })

            it('Should reject new Bid because caller is the creator of the auction', async () => {
                await expect(Marketplace.bid(0, 60))
                    .to.be.revertedWith('Creator of the auction cannot place new bid');
            })

            it('Should reject new Bid because marketplace contract has no approval for token transfer', async () => {
                await expect(Marketplace.connect(USER1).bid(0, 60))
                    .to.be.revertedWith('Invalid allowance');
            })

            it('Should reject new Bid because new bider has not enought balances', async () => {

                await PaymentToken.connect(USER1).approve(Marketplace.address, 10000)

                await expect(Marketplace.connect(USER1).bid(0, 60))
                    .to.be.reverted;
            })

        });

        describe('Place new Bid on an auction - Success', () => {
            beforeEach(async () => {
                // Allow marketplace contract to transfer token of USER1
                await PaymentToken.connect(USER1).approve(Marketplace.address, 10000)
                // credit USER1 balance with tokens
                await PaymentToken.transfer(USER1.address, 10000)
                // Place new bid with USER1
                await Marketplace.connect(USER1).bid(0, 500)
            });

            it('Token balance of new bider must be debited with the bid amount', async () => {
                let USER1Bal = await PaymentToken.balanceOf(USER1.address)
                expect(USER1Bal).to.equal(9500)
            })

            it('Token balance of Marketplace contract must be updated with new bid amount', async () => {
                let marketplaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketplaceBal).to.equal(500)
            })

            it('Auction info are correctly updated', async () => {
                let currentBidOwner = await Marketplace.getCurrentBidOwner(0)
                expect(currentBidOwner).to.equal(USER1.address)
                let currentBid = await Marketplace.getCurrentBid(0)
                expect(currentBid).to.equal(500)
            })

            it('Current bid owner must be refunded after a new successful bid is placed', async () => {
                // Allow marketplace contract to tranfer token of USER2
                await PaymentToken.connect(USER2).approve(Marketplace.address, 20000)
                // Credit USER2 balance with some tokens
                await PaymentToken.transfer(USER2.address, 20000)
                // Place new bid with USER2
                await Marketplace.connect(USER2).bid(0, 1000)

                let USER1Bal = await PaymentToken.balanceOf(USER1.address)
                expect(USER1Bal).to.equal(10000)

                let USER2Bal = await PaymentToken.balanceOf(USER2.address)
                expect(USER2Bal).to.equal(19000)

                let marketplaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketplaceBal).to.equal(1000)

                let currentBidOwner = await Marketplace.getCurrentBidOwner(0)
                expect(currentBidOwner).to.equal(USER2.address)
                let currentBid = await Marketplace.getCurrentBid(0)
                expect(currentBid).to.equal(1000)
            })
        });
    })

    describe('Transactions - Claim NFT', () => {

        beforeEach(async () => {
            // Deploy NFTCollection contract
            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, _, _, _] = await ethers.getSigners();

            // Deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, _, _, _] = await ethers.getSigners();
        });

        describe('Claim NFT - Failure', () => {
            it('Should reject because auction is still open', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 5000, USER2)

                await expect(Marketplace.connect(USER2).claimNFT(0))
                    .to.be.revertedWith('Auction is still open');

            })

            it('Should reject because caller is not the current bid owner', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 5000, USER2)

                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [6000])
                await network.provider.send("evm_mine")

                await expect(Marketplace.connect(USER1).claimNFT(0))
                    .to.be.revertedWith('NFT can be claimed only by the current bid owner');
            })
        });

        describe('Claim NFT - Success', () => {

            it('Winner of the auction must be the new owner of the NFT', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 9000, USER2)
                
                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [10000])
                await network.provider.send("evm_mine")

                await Marketplace.connect(USER2).claimNFT(0)

                let newOwnerNFT = await NFTCollection.ownerOf(0)
                expect(newOwnerNFT).to.equal(USER2.address)
            })

            it('Creator of the auction must have his token balance credited with the highest bid amount', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 20000, USER2)
                
                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [22000])
                await network.provider.send("evm_mine")
                
                await Marketplace.connect(USER2).claimNFT(0)

                let auctionCreatorBal = await PaymentToken.balanceOf(USER1.address)
                expect(auctionCreatorBal).to.equal(500)

                let marketPlaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketPlaceBal).to.equal(0)
            })

            it('Winner of the auction should not be able to claim NFT more than one time', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 50000, USER2)

                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [55000])
                await network.provider.send("evm_mine")

                await Marketplace.connect(USER2).claimNFT(0)
                await expect(Marketplace.connect(USER2).claimNFT(0)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved')
            })
        });
    })


    describe('Transactions - Claim Token', () => {

        beforeEach(async () => {
            // Deploy NFTCollection contract
            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, _, _, _] = await ethers.getSigners();

            // Deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, _, _, _] = await ethers.getSigners();
        });

        describe('Claim Token - Failure', () => {
            it('Should reject because auction is still open', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 1000000, USER2)

                await expect(Marketplace.connect(USER1).claimToken(0))
                    .to.be.revertedWith('Auction is still open');
            })

            it('Should reject because caller is not the creator of the auction', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 1020000, USER2)

                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [1050000])
                await network.provider.send("evm_mine")

                await expect(Marketplace.connect(USER2).claimToken(0))
                    .to.be.revertedWith('Tokens can be claimed only by the creator of the auction');
            })
        });

        describe('Claim Token - Success', () => {

            it('Winner of the auction must be the new owner of the NFT', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 1950000, USER2)
                
                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [2000000])
                await network.provider.send("evm_mine")

                await Marketplace.connect(USER1).claimToken(0)

                let newOwnerNFT = await NFTCollection.ownerOf(0)
                expect(newOwnerNFT).to.equal(USER2.address)
            })

            it('Creator of the auction must have his token balance credited with the highest bid amount', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 3950000, USER2)
                
                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [4000000])
                await network.provider.send("evm_mine")
                await Marketplace.connect(USER1).claimToken(0)

                let auctionCreatorBal = await PaymentToken.balanceOf(USER1.address)
                expect(auctionCreatorBal).to.equal(500)

                let marketPlaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketPlaceBal).to.equal(0)
            })

            it('Creator of the auction should not be able to claim his token more than one time', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 7950000, USER2)

                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [8000000])
                await network.provider.send("evm_mine")
                
                await Marketplace.connect(USER1).claimToken(0)
                await expect(Marketplace.connect(USER1).claimToken(0)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved')
            })
        });
    })

    describe('Transactions - Refund NFT', () => {

        beforeEach(async () => {
            // Deploy NFTCollection contract
            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, _, _, _] = await ethers.getSigners();

            // Deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, _, _, _] = await ethers.getSigners();
        });

        describe('Refund NFT - Failure', () => {
            it('Should reject because there is already a bider on the auction', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 16050000, USER2)
                
                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [16100000])
                await network.provider.send("evm_mine")

                await expect(Marketplace.connect(USER1).refund(0))
                .to.be.revertedWith('Existing bider for this auction');

            })
        });

        describe('Refund NFT - Success', () => {

            it('Creator of the auction must be again the owner of the NFT', async () => {
                await claimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, USER1, 32010000, false)
                
                // Increase block timestamp
                await network.provider.send("evm_increaseTime", [32050000])
                await network.provider.send("evm_mine")

                await Marketplace.connect(USER1).refund(0)

                let newOwnerNFT = await NFTCollection.ownerOf(0)
                expect(newOwnerNFT).to.equal(USER1.address)
            })
        });
    })
})

/**
 * Method to initialize testing environnement before testing 
 * claimNFT() and claimToken() function
 * Bellow are the steps that this function will complete
 * 1. Mint Token
 * 2. Approve NFT transfer by market place
 * 3. Create auction
 * 4. Approve token transfer by market place
 * 5. Transfer token to bider
 * 6. Create new bid
 */
async function claimFunctionSetUp(Marketplace,
    NFTCollection,
    PaymentToken,
    auctionCreator,
    auctionDuration,
    bider) {
    //mint new NFT
    await NFTCollection.connect(auctionCreator).mintNFT("Test NFT", "test.uri.domain.io")
    // approve NFT transfer by MarketPlace contract
    await NFTCollection.connect(auctionCreator).approve(Marketplace.address, 0)
    // create auction
    let endAuction = Math.floor(Date.now() / 1000) + auctionDuration;
    await Marketplace.connect(auctionCreator).createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction)
    if (bider) {
        // allow marketplace contract to get token
        await PaymentToken.connect(bider).approve(Marketplace.address, 10000)
        // credit USER2 balance with tokens
        await PaymentToken.transfer(bider.address, 20000)
        // place new bid
        await Marketplace.connect(bider).bid(0, 500)
    }
}
