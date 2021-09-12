/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");

const ALCHEMY_API_KEY = ""; // PUT YOUR KEY HERE
const ROPSTEN_PRIVATE_KEY = ""; //PUT YOUR PRIVATE KEY HERE

module.exports = {
  solidity: "0.8.0",
  // networks: {
  //   ropsten: {
  //     url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
  //     accounts: [`0x${ROPSTEN_PRIVATE_KEY}`],
  //   },
  // },
};
