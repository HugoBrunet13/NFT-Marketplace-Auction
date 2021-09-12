const { expect } = require('chai');
const { ethers } = require('hardhat');




describe('NFT Collection contract', () => {

    beforeEach(async () => {
        NFTCollectionContract = await ethers.getContractFactory('NFTCollection');
        NFTCollection = await NFTCollectionContract.deploy();
        [ownerNFTCollection, USER1, USER2, _] = await ethers.getSigners();

    })

    describe('Mint NFT - Success', () => {
        it('Can min new NFT ', async () => {
            await NFTCollection.mintNFT("Test", "test.io.io.io.com")
                        
            let ownerNFT = await NFTCollection.ownerOf(0)
            expect(ownerNFT).to.equal(ownerNFTCollection.address)
        })
    })

    describe('transferNFTFrom - Success', () => {
        it('Can mint and transfer an NFT from one address to another ', async () => {
            await NFTCollection.mintNFT("Test", "test.io.io.io.com")
                        
            let ownerNFT = await NFTCollection.ownerOf(0)
            expect(ownerNFT).to.equal(ownerNFTCollection.address)

            await NFTCollection.approve(USER2.address, 0)    
            await NFTCollection.connect(USER2).transferNFTFrom(ownerNFTCollection.address,
                                                USER1.address,
                                                0)
            let ownerNFTAfterTransfer = await NFTCollection.ownerOf(0)
            expect(ownerNFTAfterTransfer).to.equal(USER1.address)
        })
    })



    
})