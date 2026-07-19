export interface ShopItem {
  id: string;
  equipmentId: string;
  price: string;
  currency: 'GOLD' | 'TOKEN';
  stock: number;
}
