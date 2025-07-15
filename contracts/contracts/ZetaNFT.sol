// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ZetaNFT
 * @dev ERC721 NFT contract with cross-chain capabilities for ZetaVault
 * Supports minting, transferring, and metadata management
 */
contract ZetaNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    uint256 private _currentTokenId;
    
    // Mapping from token ID to additional metadata
    mapping(uint256 => string) private _tokenMetadata;
    mapping(uint256 => uint256) private _tokenChainOrigin;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId, string metadataURI, uint256 chainId);
    event NFTTransferredSameChain(address indexed from, address indexed to, uint256 indexed tokenId);
    event MetadataUpdated(uint256 indexed tokenId, string newMetadataURI);

    constructor() ERC721("ZetaNFT", "ZNFT") Ownable(msg.sender) {
        _currentTokenId = 0;
    }

    /**
     * @dev Mint new NFT with metadata
     * @param to Address to mint NFT to
     * @param metadataURI Metadata URI for the NFT
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, string calldata metadataURI) external onlyOwner nonReentrant returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        
        uint256 tokenId = _currentTokenId;
        _currentTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _tokenMetadata[tokenId] = metadataURI;
        _tokenChainOrigin[tokenId] = block.chainid;
        
        emit NFTMinted(to, tokenId, metadataURI, block.chainid);
        
        return tokenId;
    }

    /**
     * @dev Transfer NFT within the same chain
     * @param from Current owner of the NFT
     * @param to Address to transfer NFT to
     * @param tokenId Token ID to transfer
     */
    function transferNFTSameChain(address from, address to, uint256 tokenId) external nonReentrant {
        require(to != address(0), "Cannot transfer to zero address");
        require(from != to, "Cannot transfer to self");
        require(_ownerOf(tokenId) == from, "From address is not the owner");
        require(
            _isAuthorized(from, msg.sender, tokenId) || 
            msg.sender == from || 
            msg.sender == owner(),
            "Not authorized to transfer this token"
        );
        
        // Use the standard ERC721 transfer function
        _transfer(from, to, tokenId);
        
        emit NFTTransferredSameChain(from, to, tokenId);
    }

    /**
     * @dev Update metadata URI for existing token
     * @param tokenId Token ID to update
     * @param newMetadataURI New metadata URI
     */
    function updateMetadata(uint256 tokenId, string calldata newMetadataURI) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(bytes(newMetadataURI).length > 0, "Metadata URI cannot be empty");
        
        _setTokenURI(tokenId, newMetadataURI);
        _tokenMetadata[tokenId] = newMetadataURI;
        
        emit MetadataUpdated(tokenId, newMetadataURI);
    }

    /**
     * @dev Get current token ID (next token to be minted)
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Get total number of minted tokens
     */
    function getTotalMinted() external view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Get chain origin of a token
     * @param tokenId Token ID to query
     * @return chainId Chain ID where token was originally minted
     */
    function getTokenChainOrigin(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenChainOrigin[tokenId];
    }

    /**
     * @dev Get all tokens owned by an address
     * @param owner Address to query
     * @return tokenIds Array of token IDs owned by the address
     */
    function getTokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    /**
     * @dev Check if token exists
     * @param tokenId Token ID to check
     * @return bool Whether token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Get metadata for a token
     * @param tokenId Token ID to query
     * @return metadataURI The metadata URI for the token
     */
    function getTokenMetadata(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenMetadata[tokenId];
    }

    // Required overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}