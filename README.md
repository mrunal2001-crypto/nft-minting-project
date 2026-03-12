# NFT Minting Project

A minimal NFT minting system built with Solidity, Node.js, and Express. Includes an ERC-721 smart contract with a fixed supply of 5 NFTs and a backend API to mint NFTs via a simple HTTP request.

---

## Project Structure

```
nft-minting-project/
├── contracts/
│   └── NFTMint.sol          ← ERC-721 smart contract
├── scripts/
│   ├── deploy.js            ← Deployment script
│   └── interact.js          ← Local interaction script
├── test/
│   └── NFTMint.test.js      ← Hardhat test suite
├── api/
│   └── index.js             ← Express API
├── hardhat.config.js
├── .env                     ← Environment variables (never commit this)
└── package.json
```

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org) v18 or higher
- npm (comes with Node.js)
- [Git](https://git-scm.com)

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/mrunal2001-crypto/nft-minting-project.git
cd nft-minting-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your `.env` file

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Or create it manually and add the following:

```
AMOY_RPC_URL=your_alchemy_rpc_url_here
PRIVATE_KEY=your_wallet_private_key_here
CONTRACT_ADDRESS=your_deployed_contract_address_here
PORT=3000
```

> ⚠️ **Never commit your `.env` file. It is already listed in `.gitignore`.**

---

## Environment Variable Configuration

| Variable | Description | Example |
|---|---|---|
| `AMOY_RPC_URL` | RPC URL from Alchemy for Polygon Amoy testnet (or `http://127.0.0.1:8545` for local) | `https://polygon-amoy.g.alchemy.com/v2/xxx` |
| `PRIVATE_KEY` | Private key of the server wallet that pays gas fees | `0xabc123...` |
| `CONTRACT_ADDRESS` | Deployed NFTMint contract address | `0x5FbDB...` |
| `PORT` | Port the Express API runs on | `3000` |

---

## Smart Contract Deployment (Local Hardhat Network)

### Step 1 — Compile the contract

```bash
npx hardhat compile
```

You should see:
```
Compiled 1 Solidity file successfully (evm target: cancun)
```

### Step 2 — Start the local Hardhat blockchain

Open a **new terminal** and run:

```bash
npx hardhat node
```

Leave this terminal running. You will see 20 test wallets with fake ETH printed out.

### Step 3 — Update your `.env` for local network

```
AMOY_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=
PORT=3000
```

> The `PRIVATE_KEY` above is Hardhat's default test account. Safe to use for local testing only.

### Step 4 — Deploy to local Hardhat network

In your **original terminal**, run:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

You will see output like:

```
Deploying with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000.0 ETH
✅ NFTMint deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 5 — Copy the contract address into `.env`

```
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## Running the Tests

Make sure your local Hardhat node is **not** running when you run tests (Hardhat spins up its own temporary network for tests).

```bash
npx hardhat test
```

Expected output:

```
  NFTMint
    Deployment
      ✔ Should set the correct owner
      ✔ Should start with zero supply
      ✔ Should set correct mint price
      ✔ Should set correct max supply
    Minting
      ✔ Should mint NFT to correct address
      ✔ Should increment total supply
      ✔ Should mint to a different address than caller
      ✔ Should emit Minted event with correct args
      ✔ Should assign sequential token IDs
    Supply limit
      ✔ Should allow minting up to max supply of 5
      ✔ Should revert when minting beyond max supply
    Payment validation
      ✔ Should revert if payment is too low
      ✔ Should revert if payment is too high
      ✔ Should revert if no payment sent
    Owner-only functions
      setMintPrice
        ✔ Should allow owner to update mint price
        ✔ Should emit MintPriceUpdated event
        ✔ Should revert if non-owner tries to set price
      withdraw
        ✔ Should allow owner to withdraw balance
        ✔ Should revert if non-owner tries to withdraw
        ✔ Should revert if nothing to withdraw
        ✔ Should emit Withdrawn event

  21 passing (1s)
```

---

## Running the API

### Step 1 — Make sure Hardhat node is running

In a separate terminal:

```bash
npx hardhat node
```

### Step 2 — Start the Express API

```bash
node api/index.js
```

You should see:

```
🚀 API running on http://localhost:3000
```

---

## Minting an NFT via the API

### Using curl

```bash
curl -X POST http://localhost:3000/mint \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\": \"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\"}"
```

### Using Postman

1. Set method to **POST**
2. Set URL to `http://localhost:3000/mint`
3. Go to **Body** → select **raw** → select **JSON**
4. Paste the request body:

```json
{
  "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

5. Click **Send**

### Expected Response

```json
{
  "success": true,
  "txHash": "0xabc123...",
  "tokenId": 1
}
```

---

## Checking Contract Status

### Using curl

```bash
curl http://localhost:3000/status
```

### Expected Response

```json
{
  "totalMinted": 1,
  "maxSupply": 5,
  "mintPrice": "1.0 MATIC",
  "remainingSupply": 4
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/mint` | Mints an NFT to the provided wallet address |
| `GET` | `/status` | Returns current supply, mint price, and remaining NFTs |

### POST /mint

**Request Body:**
```json
{
  "walletAddress": "0x..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "txHash": "0x...",
  "tokenId": 1
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid wallet address"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Max supply reached"
}
```

---

## Smart Contract Details

| Property | Value |
|---|---|
| Standard | ERC-721 |
| Name | MyNFT |
| Symbol | MNFT |
| Max Supply | 5 |
| Mint Price | 1 MATIC |
| Solidity Version | 0.8.28 |
| OpenZeppelin Version | 5.x |

### Security Features

- `ReentrancyGuard` on `mint()` and `withdraw()` functions
- `Ownable` access control for owner-only functions
- Exact payment validation on every mint
- Hard supply cap enforced on-chain

---

## License

MIT