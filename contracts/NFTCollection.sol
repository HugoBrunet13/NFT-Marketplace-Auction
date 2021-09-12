pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTCollection is ERC721 {
    struct NFT {
        string name;
        string URI;
    }

    event Mint(uint256 index, address indexed mintedBy);

    NFT[] private allNFTs;

    constructor() ERC721("NFT Collection", "NFTC") {}

    // Mint a new NFT for Sale
    function mintNFT(string memory _nftName, string memory _nftURI)
        external
        returns (uint256)
    {
        allNFTs.push(NFT({name: _nftName, URI: _nftURI}));

        uint256 index = allNFTs.length - 1;

        _safeMint(msg.sender, index);

        emit Mint(index, msg.sender);
        return index;
    }

    function transferNFTFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual returns (bool) {
        safeTransferFrom(from, to, tokenId);
        return true;
    }
}
