export interface Equipment {
  id: string;
  name: string;
  type: 'BOW' | 'ARROW' | 'ACCESSORY';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  stats: Record<string, number>;
}
