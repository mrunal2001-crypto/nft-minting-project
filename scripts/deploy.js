const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const NFTMint = await ethers.getContractFactory("NFTMint");
  const contract = await NFTMint.deploy("https://my-metadata.com/");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ NFTMint deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});