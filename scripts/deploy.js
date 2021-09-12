async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy('My NFT Marketplace');
    console.log("Marketplace address:", marketplace.address);

    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    const nftCollection = await NFTCollection.deploy();
    console.log("NFT Collection address:", nftCollection.address);

    const ERC20 = await ethers.getContractFactory("ERC20");
    const erc20 = await ERC20.deploy(1000000, 'Hugo Token', 'XHG');
    console.log("ERC20 Token address:", erc20.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });