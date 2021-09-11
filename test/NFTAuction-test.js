const { expect } = require('chai');
const { ethers } = require('hardhat');




describe('NFT Marketplace contract', () => {
    let NFTMarketPlaceContract, NFTMarketPlace, ownerMarketPlaceContract, addr1, addr2;

    beforeEach(async () => {
        PaymentTokenContract = await ethers.getContractFactory('ERC20');
        paymentToken = await PaymentTokenContract.deploy(1000000, "Test Token", "XTS");
        [ownerPaymentToken, addr1, addr2, _] = await ethers.getSigners();

        NFTMarketPlaceContract = await ethers.getContractFactory('NFTAuction');
        NFTMarketPlace = await NFTMarketPlaceContract.deploy(paymentToken.address);
        [ownerMarketPlaceContract, addr1, addr2, _] = await ethers.getSigners();

    });

    describe('Deployment', () => {
        it('Should set the right Name and Symbol', async () => {
            expect(await NFTMarketPlace.name()).to.equal("NFT Marketplace");
            expect(await NFTMarketPlace.symbol()).to.equal("NFTMKT");
        });

        it('Should intialize NFT sequence ID to 0', async () => {
            expect(await NFTMarketPlace.nftSequenceId()).to.equal(0);
        })

        it('Should intialize Marketplace contract with payment token address', async () => {
            expect(await NFTMarketPlace.paymentTokenAddress()).to.equal(paymentToken.address);
        })
    });
})