import { ethers } from "hardhat";

export async function deploy(contractName: string, params: any[]) {
  const ContractArtifact = await ethers.getContractFactory(contractName);
  const gasPrice = await ContractArtifact.signer.getGasPrice();
  console.log(`Current gas price: ${gasPrice}`);

  const estimatedGas = await ContractArtifact.signer.estimateGas(
    ContractArtifact.getDeployTransaction(...params)
  );
  console.log(
    contractName + "contract deployment " + `estimated gas: ${estimatedGas}`
  );

  const deploymentPrice = gasPrice.mul(estimatedGas);
  const deployerBalance = await ContractArtifact.signer.getBalance();
  console.log(
    contractName +
      ` Deployment price:  ${ethers.utils.formatEther(deploymentPrice)}`
  );
  console.log(
    `Deployer balance:  ${ethers.utils.formatEther(deployerBalance)}`
  );

  if (deployerBalance.lt(deploymentPrice)) {
    throw new Error(
      `Insufficient funds. Top up your account balance by ${ethers.utils.formatEther(
        deploymentPrice.sub(deployerBalance)
      )}`
    );
  }
  const Contract = await ContractArtifact.deploy(...params);

  await Contract.deployed();

  console.log(contractName + `contract deployed to ${Contract.address}`);
}
