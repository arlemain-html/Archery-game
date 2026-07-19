const fs = require('fs');
const path = require('path');

const contractsDir = path.join(__dirname, 'packages', 'contracts', 'contracts');
fs.mkdirSync(contractsDir, { recursive: true });

const roleManagerCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract RoleManager is AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
`;

const treasuryCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Treasury is ReentrancyGuard {
    RoleManager public immutable roleManager;
    address payable public multisigWallet;

    event TreasuryDeposit(address indexed sender, uint256 amount);
    event TreasuryWithdraw(address indexed admin, uint256 amount);
    event MultisigUpdated(address indexed oldWallet, address indexed newWallet);

    error Unauthorized();
    error TransferFailed();

    constructor(address _roleManager, address payable _multisigWallet) {
        roleManager = RoleManager(_roleManager);
        multisigWallet = _multisigWallet;
    }

    receive() external payable {
        emit TreasuryDeposit(msg.sender, msg.value);
    }

    function deposit() external payable {
        emit TreasuryDeposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (!roleManager.hasRole(roleManager.DEFAULT_ADMIN_ROLE(), msg.sender)) {
            revert Unauthorized();
        }
        
        (bool success, ) = multisigWallet.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit TreasuryWithdraw(msg.sender, amount);
    }

    function setMultisigWallet(address payable _newWallet) external {
        if (!roleManager.hasRole(roleManager.DEFAULT_ADMIN_ROLE(), msg.sender)) {
            revert Unauthorized();
        }
        emit MultisigUpdated(multisigWallet, _newWallet);
        multisigWallet = _newWallet;
    }
}
`;

const archeryItems1155Code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "./RoleManager.sol";

contract ArcheryItems1155 is ERC1155, ERC1155Supply, ERC1155Burnable {
    RoleManager public immutable roleManager;
    string public name = "GameFi Archery Items";
    string public symbol = "GFAI";

    error Unauthorized();
    error ContractPaused();

    event ItemMinted(address indexed to, uint256 indexed id, uint256 amount);
    event ItemBurned(address indexed from, uint256 indexed id, uint256 amount);

    constructor(address _roleManager, string memory _baseURI) ERC1155(_baseURI) {
        roleManager = RoleManager(_roleManager);
    }

    modifier whenNotPaused() {
        if (roleManager.paused()) revert ContractPaused();
        _;
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        whenNotPaused
    {
        if (!roleManager.hasRole(roleManager.MINTER_ROLE(), msg.sender)) {
            revert Unauthorized();
        }
        _mint(account, id, amount, data);
        emit ItemMinted(account, id, amount);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        whenNotPaused
    {
        if (!roleManager.hasRole(roleManager.MINTER_ROLE(), msg.sender)) {
            revert Unauthorized();
        }
        _mintBatch(to, ids, amounts, data);
        for (uint i = 0; i < ids.length; i++) {
            emit ItemMinted(to, ids[i], amounts[i]);
        }
    }

    function setURI(string memory newuri) public {
        if (!roleManager.hasRole(roleManager.DEFAULT_ADMIN_ROLE(), msg.sender)) {
            revert Unauthorized();
        }
        _setURI(newuri);
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        if (roleManager.paused() && from != address(0) && to != address(0)) revert ContractPaused();
        super._update(from, to, ids, values);
    }
}
`;

const achievementSBTCode = `// SPDX-License-Identifier: MIT
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
`;

const gameShopCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";
import "./Treasury.sol";
import "./ArcheryItems1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GameShop is ReentrancyGuard {
    RoleManager public immutable roleManager;
    Treasury public immutable treasury;
    ArcheryItems1155 public immutable archeryItems;

    struct ItemConfig {
        uint256 price;
        uint256 maxSupply;
        uint256 currentSupply;
        bool active;
    }

    mapping(uint256 => ItemConfig) public shopCatalog;

    event ItemPurchased(address indexed buyer, uint256 indexed skuId, uint256 qty, uint256 price);
    event CatalogUpdated(uint256 indexed skuId, uint256 price, uint256 maxSupply, bool active);

    error Unauthorized();
    error ContractPaused();
    error InvalidSKU();
    error InsufficientFunds(uint256 required, uint256 provided);
    error SupplyExceeded(uint256 requested, uint256 remaining);

    constructor(address _roleManager, address _treasury, address _archeryItems) {
        roleManager = RoleManager(_roleManager);
        treasury = Treasury(payable(_treasury));
        archeryItems = ArcheryItems1155(_archeryItems);
    }

    modifier whenNotPaused() {
        if (roleManager.paused()) revert ContractPaused();
        _;
    }

    function updateItem(uint256 skuId, uint256 price, uint256 maxSupply, bool active) external {
        if (!roleManager.hasRole(roleManager.DEFAULT_ADMIN_ROLE(), msg.sender)) {
            revert Unauthorized();
        }
        shopCatalog[skuId].price = price;
        shopCatalog[skuId].maxSupply = maxSupply;
        shopCatalog[skuId].active = active;

        emit CatalogUpdated(skuId, price, maxSupply, active);
    }

    function buyItem(uint256 skuId, uint256 quantity) external payable whenNotPaused nonReentrant {
        ItemConfig storage config = shopCatalog[skuId];
        
        if (!config.active) revert InvalidSKU();
        if (config.currentSupply + quantity > config.maxSupply) {
            revert SupplyExceeded(quantity, config.maxSupply - config.currentSupply);
        }

        uint256 totalPrice = config.price * quantity;
        if (msg.value != totalPrice) {
            revert InsufficientFunds(totalPrice, msg.value);
        }

        config.currentSupply += quantity;

        // Forward funds to treasury
        treasury.deposit{value: msg.value}();

        // Mint item to buyer
        archeryItems.mint(msg.sender, skuId, quantity, "");

        emit ItemPurchased(msg.sender, skuId, quantity, config.price);
    }

    function getItemInfo(uint256 skuId) external view returns (uint256 price, uint256 supply, uint256 maxSupply, bool active) {
        ItemConfig memory config = shopCatalog[skuId];
        return (config.price, config.currentSupply, config.maxSupply, config.active);
    }
}
`;

fs.writeFileSync(path.join(contractsDir, 'RoleManager.sol'), roleManagerCode);
fs.writeFileSync(path.join(contractsDir, 'Treasury.sol'), treasuryCode);
fs.writeFileSync(path.join(contractsDir, 'ArcheryItems1155.sol'), archeryItems1155Code);
fs.writeFileSync(path.join(contractsDir, 'AchievementSBT.sol'), achievementSBTCode);
fs.writeFileSync(path.join(contractsDir, 'GameShop.sol'), gameShopCode);

console.log('Smart Contracts created successfully.');
