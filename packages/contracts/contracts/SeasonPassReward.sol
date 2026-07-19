// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./RoleManager.sol";
import "./ArcheryItems1155.sol";

contract SeasonPassReward is EIP712 {
    RoleManager public roleManager;
    ArcheryItems1155 public archeryItems;

    // domain name and version for EIP-712
    string private constant _NAME = "ArcheryGame";
    string private constant _VERSION = "1";

    // Track claims to prevent replay attacks (user -> level -> claimed)
    mapping(address => mapping(uint256 => bool)) public hasClaimed;

    // Define the type hash for the ClaimReward struct
    bytes32 private constant CLAIM_REWARD_TYPEHASH = keccak256("ClaimReward(uint256 level,uint256 skuId,uint256 nonce)");

    event RewardClaimed(address indexed user, uint256 level, uint256 skuId);

    constructor(address _roleManager, address _archeryItems) EIP712(_NAME, _VERSION) {
        roleManager = RoleManager(_roleManager);
        archeryItems = ArcheryItems1155(_archeryItems);
    }

    /**
     * @dev Claim a Season Pass NFT reward. Requires a signature from the backend (SYSTEM_ROLE).
     */
    function claimReward(uint256 level, uint256 skuId, uint256 nonce, bytes calldata signature) external {
        require(!hasClaimed[msg.sender][level], "Reward already claimed");

        // Verify Signature
        bytes32 structHash = keccak256(abi.encode(CLAIM_REWARD_TYPEHASH, level, skuId, nonce));
        bytes32 hash = _hashTypedDataV4(structHash);
        
        address signer = ECDSA.recover(hash, signature);
        require(roleManager.hasRole(roleManager.SIGNER_ROLE(), signer), "Invalid signature or unauthorized signer");

        // Mark as claimed
        hasClaimed[msg.sender][level] = true;

        // Mint NFT
        archeryItems.mint(msg.sender, skuId, 1, "");

        emit RewardClaimed(msg.sender, level, skuId);
    }
}
