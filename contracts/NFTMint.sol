// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMint is ERC721, Ownable, ReentrancyGuard {

    uint256 public totalSupply;          
    uint256 public constant MAX_SUPPLY = 5;
    uint256 public mintPrice = 1 ether;
    string private _baseTokenURI;

    event Minted(address indexed to, uint256 indexed tokenId);
    event MintPriceUpdated(uint256 newPrice);
    event Withdrawn(address indexed owner, uint256 amount);

    constructor(string memory baseURI) ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    // ─── Public Mint ───────────────────────────────────────────
    function mint(address to) external payable nonReentrant returns (uint256) {
        require(totalSupply < MAX_SUPPLY, "Max supply reached");
        require(msg.value == mintPrice, "Incorrect payment amount");

        totalSupply++;                    // ← simple increment
        uint256 tokenId = totalSupply;
        _safeMint(to, tokenId);

        emit Minted(to, tokenId);
        return tokenId;
    }

    // ─── Owner Functions ───────────────────────────────────────
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawn(owner(), balance);
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // ─── View Functions ────────────────────────────────────────
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}