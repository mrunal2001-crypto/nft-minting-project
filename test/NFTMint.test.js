const { expect } = require("chai");
const ethers = require("ethers");
const { ethers: hardhatEthers } = require("hardhat");

describe("NFTMint", function () {
  let nft;
  let owner;
  let addr1;
  let addr2;
  let MINT_PRICE;

  const BASE_URI = "https://my-metadata.com/";

  beforeEach(async function () {
    MINT_PRICE = ethers.parseEther("1");
    [owner, addr1, addr2] = await hardhatEthers.getSigners();
    const NFTMintFactory = await hardhatEthers.getContractFactory("NFTMint");
    nft = await NFTMintFactory.deploy(BASE_URI);
    await nft.waitForDeployment();
  });

  // ── Deployment ───────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should start with zero supply", async function () {
      expect(await nft.totalSupply()).to.equal(0);
    });

    it("Should set correct mint price", async function () {
      expect(await nft.mintPrice()).to.equal(MINT_PRICE);
    });

    it("Should set correct max supply", async function () {
      expect(await nft.MAX_SUPPLY()).to.equal(5);
    });
  });

  // ── Successful Mint ──────────────────────────────────────────
  describe("Minting", function () {
    it("Should mint NFT to correct address", async function () {
      await nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE });
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should increment total supply", async function () {
      await nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE });
      expect(await nft.totalSupply()).to.equal(1);
    });

    it("Should mint to a different address than caller", async function () {
      await nft.connect(addr1).mint(addr2.address, { value: MINT_PRICE });
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should emit Minted event with correct args", async function () {
      await expect(
        nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE })
      )
        .to.emit(nft, "Minted")
        .withArgs(addr1.address, 1);
    });

    it("Should assign sequential token IDs", async function () {
      await nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE });
      await nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE });
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.ownerOf(2)).to.equal(addr1.address);
    });
  });

  // ── Supply Limit ─────────────────────────────────────────────
  describe("Supply limit", function () {
    it("Should allow minting up to max supply of 5", async function () {
      for (let i = 0; i < 5; i++) {
        await nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE });
      }
      expect(await nft.totalSupply()).to.equal(5);
    });

    it("Should revert when minting beyond max supply", async function () {
      for (let i = 0; i < 5; i++) {
        await nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE });
      }
      await expect(
        nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE })
      ).to.be.revertedWith("Max supply reached");
    });
  });

  // ── Payment Validation ───────────────────────────────────────
  describe("Payment validation", function () {
    it("Should revert if payment is too low", async function () {
      await expect(
        nft.connect(addr1).mint(addr1.address, {
          value: ethers.parseEther("0.5"),
        })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should revert if payment is too high", async function () {
      await expect(
        nft.connect(addr1).mint(addr1.address, {
          value: ethers.parseEther("2"),
        })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should revert if no payment sent", async function () {
      await expect(
        nft.connect(addr1).mint(addr1.address, { value: 0 })
      ).to.be.revertedWith("Incorrect payment amount");
    });
  });

  // ── Owner Permissions ────────────────────────────────────────
  describe("Owner-only functions", function () {
    describe("setMintPrice", function () {
      it("Should allow owner to update mint price", async function () {
        await nft.connect(owner).setMintPrice(ethers.parseEther("2"));
        expect(await nft.mintPrice()).to.equal(ethers.parseEther("2"));
      });

      it("Should emit MintPriceUpdated event", async function () {
        await expect(
          nft.connect(owner).setMintPrice(ethers.parseEther("2"))
        )
          .to.emit(nft, "MintPriceUpdated")
          .withArgs(ethers.parseEther("2"));
      });

      it("Should revert if non-owner tries to set price", async function () {
        await expect(
          nft.connect(addr1).setMintPrice(ethers.parseEther("2"))
        ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
      });
    });

    describe("withdraw", function () {
      it("Should allow owner to withdraw balance", async function () {
        await nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE });
        const before = await hardhatEthers.provider.getBalance(owner.address);
        await nft.connect(owner).withdraw();
        const after = await hardhatEthers.provider.getBalance(owner.address);
        expect(after).to.be.gt(before);
      });

      it("Should revert if non-owner tries to withdraw", async function () {
        await expect(
          nft.connect(addr1).withdraw()
        ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
      });

      it("Should revert if nothing to withdraw", async function () {
        await expect(
          nft.connect(owner).withdraw()
        ).to.be.revertedWith("Nothing to withdraw");
      });

      it("Should emit Withdrawn event", async function () {
        await nft.connect(addr1).mint(addr1.address, { value: MINT_PRICE });
        await expect(nft.connect(owner).withdraw()).to.emit(nft, "Withdrawn");
      });
    });
  });
});