const { expect } = require('chai');
const { ethers } = require('hardhat');


describe('Marketplace contract', () => {
    let MarketplaceContract, Marketplace, ownerMarketPlace, addr1, addr2;

    beforeEach(async () => {
        MarketplaceContract = await ethers.getContractFactory('Marketplace');
        Marketplace = await MarketplaceContract.deploy("My NFT Marketplace");
        [ownerMarketPlace, addr1, addr2, _] = await ethers.getSigners();
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
            //deploy NFTCollection contract

            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, addr3, addr4, _] = await ethers.getSigners();

            //deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, addr5, addr6, _] = await ethers.getSigners();

            //mint new NFT
            await NFTCollection.mintNFT("Test NFT", "test.uri.domain.io")
        });

        describe('Create Auction - Failure', () => {
            let endAuction = Math.floor(Date.now() / 1000) + 10000;

            it('Should reject Auction because the NFT collection contract address is invalid', async () => {
                await expect(Marketplace.createAuction(addr1.address, PaymentToken.address, 0, 50, endAuction))
                    .to.be.revertedWith('Invalid NFT Collection contract address');
            })

            it('Should reject Auction because the Payment token contract address is invalid', async () => {
                await expect(Marketplace.createAuction(NFTCollection.address, addr1.address, 0, 50, endAuction))
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
                await expect(Marketplace.connect(addr1).createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction))
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



    describe('Transactions - Place new Bid on an auction', () => {

        beforeEach(async () => {
            //deploy NFTCollection contract

            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, addr3, addr4, _] = await ethers.getSigners();

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
            await Marketplace.createAuction(NFTCollection.address, PaymentToken.address, 0, 50, endAuction)
        });

        describe('Place new Bid on an auction - Failure', () => {

            it('Should reject new Bid because the auction index is invalid', async () => {
                await expect(Marketplace.connect(addr1).bid(4545, 100))
                    .to.be.revertedWith('Invalid auction index');
            })

            it('Should reject new Bid because the new bid amount is invalid', async () => {
                await expect(Marketplace.connect(addr1).bid(0, 25))
                    .to.be.revertedWith('New bid price must be higher than the current bid');
            })

            it('Should reject new Bid because caller is the creator of the auction', async () => {
                await expect(Marketplace.bid(0, 60))
                    .to.be.revertedWith('Creator of the auction cannot place new bid');
            })

            it('Should reject new Bid because marketplace contract has no approval for token transfer', async () => {
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

            it('Token balance of new bider must be debited with the bid amount', async () => {
                let addr1Bal = await PaymentToken.balanceOf(addr1.address)
                expect(addr1Bal).to.equal(9500)
            })

            it('Token balance of Marketplace contract must be updated with new bid amount', async () => {
                let marketplaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketplaceBal).to.equal(500)
            })

            it('Auction info are correctly updated', async () => {
                let currentBidOwner = await Marketplace.getCurrentBidOwner(0)
                expect(currentBidOwner).to.equal(addr1.address)
                let currentBid = await Marketplace.getCurrentBid(0)
                expect(currentBid).to.equal(500)
            })

            it('Current bid owner must be refunded after a new successful bid is placed', async () => {
                // allow marketplace contract to get token
                await PaymentToken.connect(addr2).approve(Marketplace.address, 20000)
                // credit addr2 balance with tokens
                await PaymentToken.transfer(addr2.address, 20000)
                // place new bid
                await Marketplace.connect(addr2).bid(0, 1000)

                let addr1Bal = await PaymentToken.balanceOf(addr1.address)
                expect(addr1Bal).to.equal(10000)

                let addr2Bal = await PaymentToken.balanceOf(addr2.address)
                expect(addr2Bal).to.equal(19000)

                let marketplaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketplaceBal).to.equal(1000)

                let currentBidOwner = await Marketplace.getCurrentBidOwner(0)
                expect(currentBidOwner).to.equal(addr2.address)
                let currentBid = await Marketplace.getCurrentBid(0)
                expect(currentBid).to.equal(1000)
            })



        });

    })

    describe('Transactions - Claim NFT', () => {

        beforeEach(async () => {
            //deploy NFTCollection contract

            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, addr3, addr4, _] = await ethers.getSigners();

            //deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, addr5, addr6, _] = await ethers.getSigners();
        });

        describe('Claim NFT - Failure', () => {
            it('Should reject because auction is still open', async () => {
                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 5000, addr2)

                await expect(Marketplace.connect(addr2).claimNFT(0))
                    .to.be.revertedWith('Auction is still open');

            })

            it('Should reject because caller is not the current bid owner', async () => {
                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 5000, addr2)

                await network.provider.send("evm_increaseTime", [6000])
                await network.provider.send("evm_mine")

                await expect(Marketplace.connect(addr1).claimNFT(0))
                    .to.be.revertedWith('NFT can be claimed only by the current bid owner');
            })
        });

        describe('Claim NFT - Success', () => {

            it('Winner of the auction must be the new owner of the NFT', async () => {

                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 9000, addr2)
                await network.provider.send("evm_increaseTime", [10000])
                await network.provider.send("evm_mine")

                await Marketplace.connect(addr2).claimNFT(0)

                let newOwnerNFT = await NFTCollection.ownerOf(0)
                expect(newOwnerNFT).to.equal(addr2.address)
            })

            it('Creator of the auction must have his token balance credited with the highest bid amount', async () => {
                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 20000, addr2)
                await network.provider.send("evm_increaseTime", [22000])
                await network.provider.send("evm_mine")
                await Marketplace.connect(addr2).claimNFT(0)

                let auctionCreatorBal = await PaymentToken.balanceOf(addr1.address)
                expect(auctionCreatorBal).to.equal(500)

                let marketPlaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketPlaceBal).to.equal(0)
            })

            it('Winner of the auction should not be able to claim NFT more than one time', async () => {
                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 50000, addr2)

                await network.provider.send("evm_increaseTime", [55000])
                await network.provider.send("evm_mine")
                await Marketplace.connect(addr2).claimNFT(0)
                await expect(Marketplace.connect(addr2).claimNFT(0)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved')
            })

        });

    })


    describe('Transactions - Claim Token', () => {

        beforeEach(async () => {
            //deploy NFTCollection contract

            NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
            NFTCollection = await NFTCollectionContract.deploy();
            [ownerNFTCollection, addr3, addr4, _] = await ethers.getSigners();

            //deploy payment token contract
            PaymentTokenContract = await ethers.getContractFactory('ERC20');
            PaymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
            [ownerPaymentToken, addr5, addr6, _] = await ethers.getSigners();
        });

        describe('Claim Token - Failure', () => {
            it('Should reject because auction is still open', async () => {
                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 1000000, addr2)

                await expect(Marketplace.connect(addr1).claimToken(0))
                    .to.be.revertedWith('Auction is still open');

            })

            it('Should reject because caller is not the creator of the auction', async () => {
                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 1020000, addr2)

                await network.provider.send("evm_increaseTime", [1050000])
                await network.provider.send("evm_mine")

                await expect(Marketplace.connect(addr2).claimToken(0))
                    .to.be.revertedWith('Tokens can be claimed only by the creator of the auction');
            })
        });

        describe('Claim Token - Success', () => {

            it('Winner of the auction must be the new owner of the NFT', async () => {

                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 1950000, addr2)
                await network.provider.send("evm_increaseTime", [2000000])
                await network.provider.send("evm_mine")

                await Marketplace.connect(addr1).claimToken(0)

                let newOwnerNFT = await NFTCollection.ownerOf(0)
                expect(newOwnerNFT).to.equal(addr2.address)
            })

            it('Creator of the auction must have his token balance credited with the highest bid amount', async () => {
                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 3950000, addr2)
                await network.provider.send("evm_increaseTime", [4000000])
                await network.provider.send("evm_mine")
                await Marketplace.connect(addr1).claimToken(0)

                let auctionCreatorBal = await PaymentToken.balanceOf(addr1.address)
                expect(auctionCreatorBal).to.equal(500)

                let marketPlaceBal = await PaymentToken.balanceOf(Marketplace.address)
                expect(marketPlaceBal).to.equal(0)
            })

            it('Creator of the auction should not be able to claim his token more than one time', async () => {
                await testClaimFunctionSetUp(Marketplace, NFTCollection, PaymentToken, addr1, 7950000, addr2)

                await network.provider.send("evm_increaseTime", [8000000])
                await network.provider.send("evm_mine")
                await Marketplace.connect(addr1).claimToken(0)
                await expect(Marketplace.connect(addr1).claimToken(0)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved')
            })

        });

    })
})

/**
 * Method to initialize testing environnement for Claiming
 * 1. Mint Token
 * 2. Approve NFT transfer by market place
 * 3. Create auction
 * 4. Approve token transfer by market place
 * 5. Transfer token to bider
 * 6. Create new bid
 */
async function testClaimFunctionSetUp(Marketplace,
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
    // allow marketplace contract to get token
    await PaymentToken.connect(bider).approve(Marketplace.address, 10000)
    // credit addr2 balance with tokens
    await PaymentToken.transfer(bider.address, 20000)
    // place new bid
    await Marketplace.connect(bider).bid(0, 500)
}
