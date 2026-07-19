import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEquipmentStore } from '../stores/equipment.store';
import { gameBridge } from '../game/GameBridge';
import { useAccount, useReadContracts } from 'wagmi';
import { contractAddresses, abis } from '@archery/contracts';

const SHOP_ITEMS = [
  { skuId: 1, id: 'bow_hunter', category: 'bow', name: 'Hunter Bow', rarity: 'Common', modelUrl: '/assets/models/hunter_bow.glb', thumbnailUrl: '/assets/thumbnails/bow_hunter_thumb.png', description: 'A reliable bow for survival in the wilderness.' },
  { skuId: 2, id: 'bow_knight', category: 'bow', name: 'Knight Bow', rarity: 'Rare', modelUrl: '/assets/models/knight_bow.glb', thumbnailUrl: '/assets/thumbnails/bow_knight_thumb.png', description: 'Heavy steel bow used by the royal guard.' },
  { skuId: 3, id: 'bow_fire', category: 'bow', name: 'Inferno Bow', rarity: 'Legendary', modelUrl: '/assets/models/fire_bow.glb', thumbnailUrl: '/assets/thumbnails/bow_fire_thumb.png', description: 'A bow forged in the deepest volcanos.' },
  { skuId: 4, id: 'arrow_steel', category: 'arrow', name: 'Steel Arrow', rarity: 'Common', modelUrl: '/assets/models/steel_arrow.glb', thumbnailUrl: '/assets/thumbnails/arrow_steel_thumb.png', description: 'Sharp and sturdy, cuts through wind.' },
  { skuId: 5, id: 'arrow_ice', category: 'arrow', name: 'Glacier Arrow', rarity: 'Rare', modelUrl: '/assets/models/ice_arrow.glb', thumbnailUrl: '/assets/thumbnails/arrow_ice_thumb.png', description: 'Freezes the air as it travels.' },
  { skuId: 6, id: 'trail_star', category: 'trail', name: 'Stardust Trail', rarity: 'Common', modelUrl: '/assets/models/trail_star.glb', thumbnailUrl: '/assets/thumbnails/trail_star_thumb.png', description: 'Leaves a trail of cosmic dust.' }
];

// Always grant default wood items even without NFT
const DEFAULT_ITEMS = [
  { id: 'bow_wood', category: 'bow', name: 'Wooden Bow', rarity: 'common', modelUrl: '/assets/models/default_bow.glb', thumbnailUrl: '/assets/thumbnails/bow_wood_thumb.png' },
  { id: 'arrow_wood', category: 'arrow', name: 'Wooden Arrow', rarity: 'common', modelUrl: '/assets/models/default_arrow.glb', thumbnailUrl: '/assets/thumbnails/arrow_wood_thumb.png' }
];

export function useEquipment() {
  const queryClient = useQueryClient();
  const setInventoryData = useEquipmentStore((state) => state.setInventoryData);
  const equipItemLocally = useEquipmentStore((state) => state.equipItemLocally);
  const storeLoadout = useEquipmentStore((state) => state.loadout);
  const localOwnedItems = useEquipmentStore((state) => state.ownedItems);
  const { address } = useAccount();

  // Read NFT Balances directly from Blockchain
  const { data: balances, isLoading: isBalancesLoading } = useReadContracts({
    contracts: SHOP_ITEMS.map((item) => ({
      address: contractAddresses.base_mainnet.ArcheryItems1155 as `0x${string}`,
      abi: abis.ArcheryItems1155,
      functionName: 'balanceOf',
      args: [address || '0x0000000000000000000000000000000000000000', BigInt(item.skuId)],
    })),
    query: {
      enabled: !!address,
    }
  });

  // Calculate dynamic inventory based on NFT balances
  const web3Inventory = [...DEFAULT_ITEMS];
  
  if (balances) {
    balances.forEach((result, index) => {
      if (result.status === 'success' && (result.result as bigint) > BigInt(0)) {
        web3Inventory.push(SHOP_ITEMS[index]);
      }
    });
  }

  // Merge with locally acquired free items
  localOwnedItems.forEach((localItem) => {
    if (!web3Inventory.some(item => item.id === localItem.id)) {
      web3Inventory.push(localItem as any);
    }
  });

  // Temporary: In a full backend setup, loadout would be fetched from Postgres.
  // For now, we mock the loadout fetch here.
  const { data: loadout, isLoading: isLoadoutLoading } = useQuery({
    queryKey: ['loadout', address],
    queryFn: async () => {
      return {
        bow: 'bow_wood',
        arrow: 'arrow_wood',
        trail: 'trail_default',
        banner: 'banner_default'
      };
    },
    staleTime: Infinity
  });

  const equipMutation = useMutation({
    mutationFn: async ({ category, itemId, modelUrl }: { category: string, itemId: string, modelUrl: string }) => {
      // In a real app, this updates Postgres
      gameBridge.emit('EquipmentChanged', { playerId: 'local', category, itemId, url: modelUrl });
      return { success: true };
    },
    onMutate: async ({ category, itemId }) => {
      equipItemLocally(category, itemId);
    }
  });

  return {
    inventory: web3Inventory,
    loadout: storeLoadout,
    isLoading: isBalancesLoading || isLoadoutLoading,
    error: null,
    equipItem: (category: string, itemId: string, modelUrl: string) => equipMutation.mutate({ category, itemId, modelUrl }),
    isEquipping: equipMutation.isPending
  };
}
