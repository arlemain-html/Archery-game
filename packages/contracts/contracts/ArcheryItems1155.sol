// SPDX-License-Identifier: MIT
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
