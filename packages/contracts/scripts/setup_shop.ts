import { ethers } from "hardhat";
import { contractAddresses } from "../src/index";

async function main() {
  console.log("Setting up GameShop and ArcheryItems1155...");

  const roleManagerAddress = contractAddresses.base_mainnet.RoleManager;
  const shopAddress = contractAddresses.base_mainnet.GameShop;
  const itemsAddress = contractAddresses.base_mainnet.ArcheryItems1155;

  const RoleManager = await ethers.getContractAt("RoleManager", roleManagerAddress);
  const ArcheryItems = await ethers.getContractAt("ArcheryItems1155", itemsAddress);
  const GameShop = await ethers.getContractAt("GameShop", shopAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // 1. Grant MINTER_ROLE to GameShop
  console.log("Granting MINTER_ROLE to GameShop...");
  const MINTER_ROLE = await RoleManager.MINTER_ROLE();
  await RoleManager.grantRole(MINTER_ROLE, shopAddress);
  console.log("MINTER_ROLE granted!");

  // 2. Setup Catalog
  console.log("Configuring GameShop catalog...");

  // skuId mapping:
  // 1 = Hunter Bow ($0.49 = 0.00027 ETH)
  // 2 = Knight Bow ($0.99 = 0.00055 ETH)
  // 3 = Inferno Bow ($1.99 = 0.0011 ETH)
  // 4 = Steel Arrow ($0.19 = 0.0001 ETH)
  // 5 = Glacier Arrow ($0.39 = 0.00021 ETH)
  // 6 = Stardust Trail ($0.29 = 0.00016 ETH)

  const catalog = [
    { id: 1, price: ethers.parseEther("0.00027"), maxSupply: 100000 },
    { id: 2, price: ethers.parseEther("0.00055"), maxSupply: 50000 },
    { id: 3, price: ethers.parseEther("0.0011"), maxSupply: 10000 },
    { id: 4, price: ethers.parseEther("0.0001"), maxSupply: 1000000 },
    { id: 5, price: ethers.parseEther("0.00021"), maxSupply: 500000 },
    { id: 6, price: ethers.parseEther("0.00016"), maxSupply: 500000 },
  ];

  for (const item of catalog) {
    const tx = await GameShop.updateItem(item.id, item.price, item.maxSupply, true);
    await tx.wait();
    console.log(`Configured SKU ${item.id} with price ${ethers.formatEther(item.price)} ETH`);
  }

  console.log("Shop setup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
