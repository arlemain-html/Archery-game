// SPDX-License-Identifier: MIT
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
