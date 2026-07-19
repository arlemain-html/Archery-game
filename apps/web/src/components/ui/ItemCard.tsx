import React from 'react';
import { motion } from 'framer-motion';

interface ItemCardProps {
  item: {
    id: string;
    name: string;
    rarity: string;
    category: string;
    price?: number;
    description?: string;
    thumbnailUrl?: string;
  };
  onClick: () => void;
  isEquipped?: boolean;
  actionText?: string;
}

const rarityColors: Record<string, string> = {
  common: 'border-gray-500 shadow-gray-500/20',
  rare: 'border-blue-500 shadow-blue-500/40',
  epic: 'border-purple-500 shadow-purple-500/60 text-purple-400',
  legendary: 'border-yellow-500 shadow-yellow-500/80 text-yellow-400'
};

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick, isEquipped, actionText }) => {
  const rarityClass = rarityColors[item.rarity.toLowerCase()] || rarityColors.common;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative cursor-pointer flex flex-col bg-black/60 backdrop-blur-md rounded-2xl p-4 border-2 transition-all ${rarityClass} overflow-hidden`}
    >
      {isEquipped && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10 shadow-lg">
          EQUIPPED
        </div>
      )}
      
      <div className="h-32 w-full flex items-center justify-center bg-white/5 rounded-xl mb-4 relative overflow-hidden group">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <span className="text-white/20 font-black text-xl tracking-widest">{item.category.toUpperCase()}</span>
        )}
      </div>

      <h3 className="text-white font-bold text-lg">{item.name}</h3>
      <p className="text-white/50 text-xs capitalize mb-4">{item.rarity}</p>

      {item.price !== undefined ? (
        <div className="mt-auto flex justify-between items-center">
          <span className="text-yellow-400 font-bold">{item.price} Gold</span>
          <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm text-white font-bold">
            {actionText || 'Buy'}
          </button>
        </div>
      ) : (
        <div className="mt-auto">
          <button className={`w-full py-2 rounded-lg text-sm font-bold ${isEquipped ? 'bg-white/10 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
            {actionText || (isEquipped ? 'Unequip' : 'Equip')}
          </button>
        </div>
      )}
    </motion.div>
  );
};
