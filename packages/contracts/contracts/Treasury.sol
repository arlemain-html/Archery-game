// SPDX-License-Identifier: MIT
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
