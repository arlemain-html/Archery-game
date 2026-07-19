export const contractAddresses = {
  localhost: {
    RoleManager: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    Treasury: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    ArcheryItems1155: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    AchievementSBT: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    GameShop: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  },
  base_mainnet: {
    RoleManager: "0xb0ce803aD38d052E214a4e932ef26B4bDf0c0BEe",
    Treasury: "0xae5a22D2a62A87BDB445EB241Bf31A1fF2976058",
    ArcheryItems1155: "0x7ea75767dd338296fc77DCa6b1033699fD8618c2",
    AchievementSBT: "0x756645f84048ce8E4b045d6331E0AaAcF007123f",
    GameShop: "0x261d24bE1B21fdfe489b7b7FE6677883d3CA3E98",
    SeasonPassReward: "0x429DADa8162C7c6a4aE28dA2BEf0F4948B52DA7e",
  }
};

// @ts-ignore
import RoleManagerJson from "../artifacts/contracts/RoleManager.sol/RoleManager.json" with { type: 'json' };
// @ts-ignore
import TreasuryJson from "../artifacts/contracts/Treasury.sol/Treasury.json" with { type: 'json' };
// @ts-ignore
import ArcheryItems1155Json from "../artifacts/contracts/ArcheryItems1155.sol/ArcheryItems1155.json" with { type: 'json' };
// @ts-ignore
import AchievementSBTJson from "../artifacts/contracts/AchievementSBT.sol/AchievementSBT.json" with { type: 'json' };
// @ts-ignore
import GameShopJson from "../artifacts/contracts/GameShop.sol/GameShop.json" with { type: 'json' };

export const abis = {
  RoleManager: RoleManagerJson.abi,
  Treasury: TreasuryJson.abi,
  ArcheryItems1155: ArcheryItems1155Json.abi,
  AchievementSBT: AchievementSBTJson.abi,
  GameShop: GameShopJson.abi,
};
