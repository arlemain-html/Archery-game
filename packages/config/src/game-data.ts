export const SHOP_ITEMS = [
  { skuId: 1, id: 'bow_hunter', category: 'bow', name: 'Hunter Bow', rarity: 'Common', priceEth: '0.00027', priceLabel: '$0.49', modelUrl: '/assets/models/hunter_bow.glb', thumbnailUrl: '/assets/thumbnails/bow_hunter_thumb.png', description: 'A reliable bow for survival in the wilderness.' },
  { skuId: 2, id: 'bow_knight', category: 'bow', name: 'Knight Bow', rarity: 'Rare', priceEth: '0.00055', priceLabel: '$0.99', modelUrl: '/assets/models/knight_bow.glb', thumbnailUrl: '/assets/thumbnails/bow_knight_thumb.png', description: 'Heavy steel bow used by the royal guard.' },
  { skuId: 3, id: 'bow_fire', category: 'bow', name: 'Inferno Bow', rarity: 'Legendary', priceEth: '0.0011', priceLabel: '$1.99', modelUrl: '/assets/models/fire_bow.glb', thumbnailUrl: '/assets/thumbnails/bow_fire_thumb.png', description: 'A bow forged in the deepest volcanos.' },
  { skuId: 4, id: 'arrow_steel', category: 'arrow', name: 'Steel Arrow', rarity: 'Common', priceEth: '0.0001', priceLabel: '$0.19', modelUrl: '/assets/models/steel_arrow.glb', thumbnailUrl: '/assets/thumbnails/arrow_steel_thumb.png', description: 'Sharp and sturdy, cuts through wind.' },
  { skuId: 5, id: 'arrow_ice', category: 'arrow', name: 'Glacier Arrow', rarity: 'Rare', priceEth: '0.00021', priceLabel: '$0.39', modelUrl: '/assets/models/ice_arrow.glb', thumbnailUrl: '/assets/thumbnails/arrow_ice_thumb.png', description: 'Freezes the air as it travels.' },
  { skuId: 6, id: 'trail_star', category: 'trail', name: 'Stardust Trail', rarity: 'Common', priceEth: '0.00016', priceLabel: '$0.29', modelUrl: '/assets/models/trail_star.glb', thumbnailUrl: '/assets/thumbnails/trail_star_thumb.png', description: 'Leaves a trail of cosmic dust.' }
];

export const ACHIEVEMENTS = [
  { id: 1, title: 'First Win', description: 'Win your first Casual or Ranked match.', imageUrl: '/assets/achievements/first_win.png', rarity: 'Common' },
  { id: 2, title: 'Sharpshooter', description: 'Score a perfect 10 in 3 consecutive arrows.', imageUrl: '/assets/achievements/sharpshooter.png', rarity: 'Rare' },
  { id: 3, title: 'Veteran', description: 'Play 100 matches in any mode.', imageUrl: '/assets/achievements/veteran.png', rarity: 'Epic' },
  { id: 4, title: 'Web3 Pioneer', description: 'Connect your wallet to the dApp.', imageUrl: '/assets/achievements/web3.png', rarity: 'Common' }
];

export const SEASON_PASS_LEVELS = [
  { level: 1, xp: 0, reward: '500 Gold', icon: '💰', isWeb3: false, description: 'Starter funds for your journey.', rewardId: 'gold_500' },
  { level: 2, xp: 1000, reward: 'Profile Banner', icon: '🖼️', isWeb3: false, description: 'Show off on the leaderboard.', rewardId: 'banner_season1' },
  { level: 3, xp: 2000, reward: 'Steel Arrow NFT', icon: '🏹', isWeb3: true, description: 'True Web3 ownership.', rewardId: 'arrow_steel', skuId: 4 },
  { level: 4, xp: 3000, reward: '1000 Gold', icon: '💎', isWeb3: false, description: 'A massive pile of wealth.', rewardId: 'gold_1000' },
  { level: 5, xp: 4000, reward: 'Glacier Arrow NFT', icon: '❄️', isWeb3: true, description: 'Legendary frozen arrow.', rewardId: 'arrow_ice', skuId: 5 }
];
