require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const contractABI = require("../artifacts/contracts/NFTMint.sol/NFTMint.json").abi;

const app = express();
app.use(express.json());

// ─── Setup provider, signer and contract ──────────────────────
const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  signer
);

// ─── POST /mint ────────────────────────────────────────────────
app.post("/mint", async (req, res) => {
  const { walletAddress } = req.body;

  // Validate wallet address
  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      error: "walletAddress is required",
    });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: "Invalid wallet address",
    });
  }

  try {
    // Get current mint price from contract
    const mintPrice = await contract.mintPrice();

    // Call the mint function on the contract
    const tx = await contract.mint(walletAddress, { value: mintPrice });
    console.log("Transaction sent:", tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction mined:", receipt.hash);

    // Extract tokenId from the Minted event
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "Minted") {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch {
        // skip logs that don't match
      }
    }

    return res.status(200).json({
      success: true,
      txHash: receipt.hash,
      tokenId: tokenId,
    });

  } catch (err) {
    console.error("Mint error:", err);

    // Send clean error message back
    const message =
      err?.reason ||
      err?.shortMessage ||
      err?.message ||
      "Mint failed";

    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// ─── GET /status ───────────────────────────────────────────────
app.get("/status", async (req, res) => {
  try {
    const totalSupply = await contract.totalSupply();
    const mintPrice = await contract.mintPrice();
    const maxSupply = await contract.MAX_SUPPLY();

    return res.status(200).json({
      totalMinted: Number(totalSupply),
      maxSupply: Number(maxSupply),
      mintPrice: ethers.formatEther(mintPrice) + " MATIC",
      remainingSupply: Number(maxSupply) - Number(totalSupply),
    });
  } catch (err) {
    console.error("Status error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch contract status",
    });
  }
});

// ─── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});

module.exports = app;
