const { expect } = require('chai');
const { ethers } = require('hardhat');




describe('NFT Collection contract', () => {

    beforeEach(async () => {
        NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
        NFTCollection = await NFTCollectionContract.deploy();
        [ownerNFTCollection, addr3, addr4, _] = await ethers.getSigners();

    })

    describe('Deployment', () => {
        it('Tests ', async () => {
            expect(0).to.equal(0);
        })
    })

    describe('Transaction - Mint Token', () => {

        describe('Mint Token - Failure', () => {
            it('Tests ', async () => {
                expect(0).to.equal(0);
            })
        })

        describe('Mint Token - Success', () => {
            it('Tests ', async () => {
                expect(0).to.equal(0);
            })
        })
    })

    describe('Transaction - transferNFTFrom', () => {

        describe('transferNFTFrom - Failure', () => {
            it('Tests ', async () => {
                expect(0).to.equal(0);
            })
        })

        describe('transferNFTFrom - SUccess', () => {
            it('Tests ', async () => {
               await NFTCollection.mintNFT("Test", "test.io.io.io.com")
                          
                let ownerNFT = await NFTCollection.ownerOf(0)
                expect(ownerNFT).to.equal(ownerNFTCollection.address)

                await NFTCollection.approve(addr4.address, 0)    
                await NFTCollection.connect(addr4).transferNFTFrom(ownerNFTCollection.address,
                                                    addr3.address,
                                                    0)
                let ownerNFTAfterTransfer = await NFTCollection.ownerOf(0)
                expect(ownerNFTAfterTransfer).to.equal(addr3.address)
            })
        })
    })



    
})