import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployNFTCollectionFixture() {
  const [ownerNFTCollection, USER1, USER2] = await ethers.getSigners();
  const NFTCollectionFactory = await ethers.getContractFactory("NFTCollection");
  const NFTCollection = await NFTCollectionFactory.deploy();

  return { NFTCollection, ownerNFTCollection, USER1, USER2 };
}

describe("NFT Collection contract", () => {
  describe("Mint NFT - Success", () => {
    it("Can mint new NFT ", async () => {
      const { NFTCollection, ownerNFTCollection } = await loadFixture(
        deployNFTCollectionFixture
      );
      await NFTCollection.mintNFT("NFTName", "nft.uri");

      expect(await NFTCollection.ownerOf(0)).to.equal(
        ownerNFTCollection.address
      );
    });
  });

  describe("transferNFTFrom - Success", () => {
    it("Can mint and transfer an NFT from one address to another ", async () => {
      const { NFTCollection, ownerNFTCollection, USER1, USER2 } =
        await loadFixture(deployNFTCollectionFixture);

      await NFTCollection.mintNFT("NFTName", "nft.uri");

      expect(await NFTCollection.ownerOf(0)).to.equal(
        ownerNFTCollection.address
      );

      await NFTCollection.approve(USER2.address, 0);
      await NFTCollection.connect(USER2).transferNFTFrom(
        ownerNFTCollection.address,
        USER1.address,
        0
      );
      let ownerNFTAfterTransfer = await NFTCollection.ownerOf(0);
      expect(ownerNFTAfterTransfer).to.equal(USER1.address);
    });
  });
});
