import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Smart Contract MVP", function () {
    let roleManager: any;
    let treasury: any;
    let archeryItems: any;
    let achievementSBT: any;
    let gameShop: any;
    let owner: SignerWithAddress;
    let minter: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let multisig: SignerWithAddress;
    let backendSigner: SignerWithAddress;

    beforeEach(async function () {
        [owner, minter, user1, user2, multisig, backendSigner] = await ethers.getSigners();

        // 1. Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();

        // 2. Deploy Treasury
        const Treasury = await ethers.getContractFactory("Treasury");
        treasury = await Treasury.deploy(await roleManager.getAddress(), multisig.address);

        // 3. Deploy ArcheryItems1155
        const ArcheryItems = await ethers.getContractFactory("ArcheryItems1155");
        archeryItems = await ArcheryItems.deploy(await roleManager.getAddress(), "https://api.archerydapp.com/metadata/{id}");

        // 4. Deploy AchievementSBT
        const AchievementSBT = await ethers.getContractFactory("AchievementSBT");
        achievementSBT = await AchievementSBT.deploy(await roleManager.getAddress());

        // 5. Deploy GameShop
        const GameShop = await ethers.getContractFactory("GameShop");
        gameShop = await GameShop.deploy(
            await roleManager.getAddress(),
            await treasury.getAddress(),
            await archeryItems.getAddress()
        );

        // Setup Roles
        const MINTER_ROLE = await roleManager.MINTER_ROLE();
        const SIGNER_ROLE = await roleManager.SIGNER_ROLE();

        await roleManager.grantRole(MINTER_ROLE, await gameShop.getAddress());
        await roleManager.grantRole(SIGNER_ROLE, backendSigner.address);
        
        // Setup Shop Item
        await gameShop.updateItem(101, ethers.parseEther("0.05"), 100, true);
    });

    describe("Deployment & RBAC", function () {
        it("Should set the right Multisig in Treasury", async function () {
            expect(await treasury.multisigWallet()).to.equal(multisig.address);
        });

        it("Should grant MINTER_ROLE to GameShop", async function () {
            const MINTER_ROLE = await roleManager.MINTER_ROLE();
            expect(await roleManager.hasRole(MINTER_ROLE, await gameShop.getAddress())).to.be.true;
        });
    });

    describe("GameShop & Treasury & ArcheryItems", function () {
        it("Should allow user to buy an item and forward funds to Treasury", async function () {
            const skuId = 101;
            const price = ethers.parseEther("0.05");
            const quantity = 2;
            const totalCost = ethers.parseEther("0.10");

            const treasuryAddress = await treasury.getAddress();
            const initialTreasuryBalance = await ethers.provider.getBalance(treasuryAddress);

            // User1 buys
            await expect(gameShop.connect(user1).buyItem(skuId, quantity, { value: totalCost }))
                .to.emit(gameShop, "ItemPurchased")
                .withArgs(user1.address, skuId, quantity, price)
                .and.to.emit(treasury, "TreasuryDeposit")
                .withArgs(await gameShop.getAddress(), totalCost);

            // Check Item Balance
            const userBalance = await archeryItems.balanceOf(user1.address, skuId);
            expect(userBalance).to.equal(quantity);

            // Check Treasury Balance
            const finalTreasuryBalance = await ethers.provider.getBalance(treasuryAddress);
            expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(totalCost);
        });

        it("Should revert if supply exceeded", async function () {
            const skuId = 101;
            const totalCost = ethers.parseEther("5.05"); // 101 items

            await expect(
                gameShop.connect(user1).buyItem(skuId, 101, { value: totalCost })
            ).to.be.revertedWithCustomError(gameShop, "SupplyExceeded");
        });

        it("Should allow multisig to withdraw from treasury", async function () {
            const totalCost = ethers.parseEther("0.10");
            await gameShop.connect(user1).buyItem(101, 2, { value: totalCost });

            // Only DEFAULT_ADMIN_ROLE can withdraw
            await expect(
                treasury.connect(user1).withdraw(totalCost)
            ).to.be.revertedWithCustomError(treasury, "Unauthorized");

            // Owner has DEFAULT_ADMIN_ROLE
            const initialMultisigBalance = await ethers.provider.getBalance(multisig.address);
            await treasury.connect(owner).withdraw(totalCost);
            const finalMultisigBalance = await ethers.provider.getBalance(multisig.address);

            expect(finalMultisigBalance - initialMultisigBalance).to.equal(totalCost);
        });
    });

    describe("AchievementSBT", function () {
        it("Should mint SBT with valid backend signature", async function () {
            const achievementId = 1;
            const nonce = 12345;
            
            // Domain Separator data
            const domain = {
                name: "ArcheryGame",
                version: "1",
                chainId: Number((await ethers.provider.getNetwork()).chainId),
                verifyingContract: await achievementSBT.getAddress()
            };

            const types = {
                ClaimAchievement: [
                    { name: "user", type: "address" },
                    { name: "achievementId", type: "uint256" },
                    { name: "nonce", type: "uint256" }
                ]
            };

            const value = {
                user: user1.address,
                achievementId: achievementId,
                nonce: nonce
            };

            // Sign data
            const signature = await backendSigner.signTypedData(domain, types, value);

            // Claim
            await expect(achievementSBT.connect(user1).claimAchievement(achievementId, nonce, signature))
                .to.emit(achievementSBT, "SBTMinted")
                .withArgs(user1.address, achievementId, 1);

            expect(await achievementSBT.hasClaimed(user1.address, achievementId)).to.be.true;
        });

        it("Should prevent transfers (Soulbound)", async function () {
            const achievementId = 1;
            const nonce = 12345;
            
            const domain = {
                name: "ArcheryGame",
                version: "1",
                chainId: Number((await ethers.provider.getNetwork()).chainId),
                verifyingContract: await achievementSBT.getAddress()
            };

            const types = {
                ClaimAchievement: [
                    { name: "user", type: "address" },
                    { name: "achievementId", type: "uint256" },
                    { name: "nonce", type: "uint256" }
                ]
            };

            const value = { user: user1.address, achievementId: achievementId, nonce: nonce };
            const signature = await backendSigner.signTypedData(domain, types, value);
            await achievementSBT.connect(user1).claimAchievement(achievementId, nonce, signature);

            await expect(
                achievementSBT.connect(user1).transferFrom(user1.address, user2.address, 1)
            ).to.be.revertedWithCustomError(achievementSBT, "SoulboundToken");
        });

        it("Should revert Replay Attacks (same nonce)", async function () {
            const achievementId = 1;
            const nonce = 12345;
            
            const domain = {
                name: "ArcheryGame",
                version: "1",
                chainId: Number((await ethers.provider.getNetwork()).chainId),
                verifyingContract: await achievementSBT.getAddress()
            };

            const types = {
                ClaimAchievement: [
                    { name: "user", type: "address" },
                    { name: "achievementId", type: "uint256" },
                    { name: "nonce", type: "uint256" }
                ]
            };

            const value = { user: user1.address, achievementId: achievementId, nonce: nonce };
            const signature = await backendSigner.signTypedData(domain, types, value);
            await achievementSBT.connect(user1).claimAchievement(achievementId, nonce, signature);

            await expect(
                achievementSBT.connect(user1).claimAchievement(achievementId, nonce, signature)
            ).to.be.revertedWithCustomError(achievementSBT, "NonceAlreadyUsed");
        });
    });

    describe("Emergency Pause", function () {
        it("Should pause minting and shop when RoleManager is paused", async function () {
            await roleManager.connect(owner).pause();

            await expect(
                gameShop.connect(user1).buyItem(101, 1, { value: ethers.parseEther("0.05") })
            ).to.be.revertedWithCustomError(gameShop, "ContractPaused");

            await expect(
                archeryItems.connect(owner).mint(user1.address, 101, 1, "0x")
            ).to.be.revertedWithCustomError(archeryItems, "ContractPaused");
        });
    });
});
