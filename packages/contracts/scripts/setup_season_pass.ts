import { ethers } from "hardhat";
import { contractAddresses } from "../src/index";

async function main() {
    console.log("Deploying and Setting up SeasonPassReward...");

    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    const roleManagerAddress = contractAddresses.base_mainnet.RoleManager;
    const archeryItemsAddress = contractAddresses.base_mainnet.ArcheryItems1155;

    // Deploy SeasonPassReward
    const SeasonPassReward = await ethers.getContractFactory("SeasonPassReward");
    const seasonPassReward = await SeasonPassReward.deploy(roleManagerAddress, archeryItemsAddress);
    await seasonPassReward.waitForDeployment();
    
    const seasonPassAddress = await seasonPassReward.getAddress();
    console.log("SeasonPassReward deployed to:", seasonPassAddress);

    // Grant MINTER_ROLE to SeasonPassReward in ArcheryItems1155
    const archeryItems = await ethers.getContractAt("ArcheryItems1155", archeryItemsAddress);
    
    // First need to get the role manager to grant MINTER_ROLE
    const roleManager = await ethers.getContractAt("RoleManager", roleManagerAddress);
    const MINTER_ROLE = await roleManager.MINTER_ROLE();

    console.log("Granting MINTER_ROLE to SeasonPassReward...");
    const tx = await roleManager.grantRole(MINTER_ROLE, seasonPassAddress);
    await tx.wait();
    console.log("MINTER_ROLE granted!");

    console.log("\nSetup Complete!");
    console.log(`Add this address to frontend/backend config: SEASON_PASS_REWARD=${seasonPassAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
