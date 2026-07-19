// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./RoleManager.sol";

contract AchievementSBT is ERC721 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    RoleManager public immutable roleManager;
    uint256 private _nextTokenId = 1;
    
    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant CLAIM_TYPEHASH = keccak256("ClaimAchievement(address user,uint256 achievementId,uint256 nonce)");
    
    mapping(uint256 => bool) public usedNonces;
    // Mapping from user => achievementId => bool
    mapping(address => mapping(uint256 => bool)) public hasClaimed;
    // Mapping from tokenId => achievementId
    mapping(uint256 => uint256) public tokenAchievementIds;

    event SBTMinted(address indexed user, uint256 indexed achievementId, uint256 tokenId);

    error SoulboundToken();
    error InvalidSignature();
    error NonceAlreadyUsed();
    error AchievementAlreadyClaimed();
    error ContractPaused();

    constructor(address _roleManager) ERC721("Archery Achievement SBT", "AA-SBT") {
        roleManager = RoleManager(_roleManager);
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("ArcheryGame")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    modifier whenNotPaused() {
        if (roleManager.paused()) revert ContractPaused();
        _;
    }

    function claimAchievement(uint256 achievementId, uint256 nonce, bytes calldata signature) external whenNotPaused {
        if (usedNonces[nonce]) revert NonceAlreadyUsed();
        if (hasClaimed[msg.sender][achievementId]) revert AchievementAlreadyClaimed();

        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, msg.sender, achievementId, nonce));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        if (!roleManager.hasRole(roleManager.SIGNER_ROLE(), signer)) revert InvalidSignature();

        usedNonces[nonce] = true;
        hasClaimed[msg.sender][achievementId] = true;

        uint256 tokenId = _nextTokenId++;
        tokenAchievementIds[tokenId] = achievementId;
        _safeMint(msg.sender, tokenId);

        emit SBTMinted(msg.sender, achievementId, tokenId);
    }
    
    function _hashTypedDataV4(bytes32 structHash) internal view virtual returns (bytes32) {
        return MessageHashUtils.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
    }

    // SBT Logic: Override transfer methods to prevent transfers
    function transferFrom(address, address, uint256) public virtual override {
        revert SoulboundToken();
    }

    function approve(address, uint256) public virtual override {
        revert SoulboundToken();
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert SoulboundToken();
    }
}
