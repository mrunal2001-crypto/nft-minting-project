const { ethers } = require("hardhat");

async function main() {
  const [owner, user1] = await ethers.getSigners();

  // paste your deployed address here
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const NFTMint = await ethers.getContractFactory("NFTMint");
  const contract = NFTMint.attach(CONTRACT_ADDRESS);

  console.log("--- Contract Info ---");
  console.log("Max Supply:", await contract.MAX_SUPPLY());
  console.log("Mint Price:", ethers.formatEther(await contract.mintPrice()), "ETH");
  console.log("Total Supply:", await contract.totalSupply());

  console.log("\n--- Minting NFT to user1 ---");
  const mintPrice = await contract.mintPrice();
  const tx = await contract.connect(user1).mint(user1.address, { value: mintPrice });
  const receipt = await tx.wait();
  console.log("✅ Mint successful!");
  console.log("TX Hash:", receipt.hash);
  console.log("Total Supply after mint:", await contract.totalSupply());

  console.log("\n--- Owner withdrawing ---");
  await contract.connect(owner).withdraw();
  console.log("✅ Withdraw successful!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});