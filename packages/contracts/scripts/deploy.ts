import hre from "hardhat";
const { ethers } = hre;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Use a placeholder address for multisig if not in mainnet
  const multisigAddress = process.env.MULTISIG_ADDRESS || deployer.address;
  const backendSignerAddress = process.env.BACKEND_SIGNER_ADDRESS || deployer.address;

  // 1. Deploy RoleManager
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await RoleManager.deploy();
  await roleManager.waitForDeployment();
  const roleManagerAddress = await roleManager.getAddress();
  console.log("RoleManager deployed to:", roleManagerAddress);
  await sleep(5000);

  // 2. Deploy Treasury
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(roleManagerAddress, multisigAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);
  await sleep(5000);

  // 3. Deploy ArcheryItems1155
  const ArcheryItems = await ethers.getContractFactory("ArcheryItems1155");
  const archeryItems = await ArcheryItems.deploy(roleManagerAddress, "https://api.archerydapp.com/metadata/{id}");
  await archeryItems.waitForDeployment();
  const archeryItemsAddress = await archeryItems.getAddress();
  console.log("ArcheryItems1155 deployed to:", archeryItemsAddress);
  await sleep(5000);

  // 4. Deploy AchievementSBT
  const AchievementSBT = await ethers.getContractFactory("AchievementSBT");
  const achievementSBT = await AchievementSBT.deploy(roleManagerAddress);
  await achievementSBT.waitForDeployment();
  const achievementSBTAddress = await achievementSBT.getAddress();
  console.log("AchievementSBT deployed to:", achievementSBTAddress);
  await sleep(5000);

  // 5. Deploy GameShop
  const GameShop = await ethers.getContractFactory("GameShop");
  const gameShop = await GameShop.deploy(roleManagerAddress, treasuryAddress, archeryItemsAddress);
  await gameShop.waitForDeployment();
  const gameShopAddress = await gameShop.getAddress();
  console.log("GameShop deployed to:", gameShopAddress);
  await sleep(5000);

  // Setup Roles
  console.log("Configuring Roles...");
  const MINTER_ROLE = await roleManager.MINTER_ROLE();
  const SIGNER_ROLE = await roleManager.SIGNER_ROLE();

  await roleManager.grantRole(MINTER_ROLE, gameShopAddress);
  await sleep(3000);
  await roleManager.grantRole(SIGNER_ROLE, backendSignerAddress);
  await sleep(3000);

  console.log("Deployment and Configuration Complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
