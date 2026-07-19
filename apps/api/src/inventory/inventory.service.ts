import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async grantItem(userId: string, itemId: string, amount: number, isNft: boolean = false, tokenId?: string, contractAddress?: string) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      return await this.prisma.$transaction(async (tx: any) => {
        // 1. Log transaction
        await tx.inventoryTransaction.create({
          data: {
            user_id: userId,
            item_id: itemId,
            amount,
            transaction_type: 'Grant',
          },
        });

        // 2. Update Inventory
        let inventoryItem = await tx.inventory.findFirst({
          where: { user_id: userId, item_id: itemId, token_id: tokenId },
        });

        if (inventoryItem) {
          inventoryItem = await tx.inventory.update({
            where: { id: inventoryItem.id },
            data: { quantity: inventoryItem.quantity + amount },
          });
        } else {
          inventoryItem = await tx.inventory.create({
            data: {
              user_id: userId,
              item_id: itemId,
              token_id: tokenId,
              quantity: amount,
              is_nft: isNft,
              contract_address: contractAddress,
            },
          });
        }

        // Emit Event
        this.eventEmitter.emit('inventory.updated', {
          userId,
          itemId,
          amount,
          newQuantity: inventoryItem.quantity,
        });

        return inventoryItem;
      });
    } catch (e) {
      throw new InternalServerErrorException('Failed to grant item');
    }
  }

  async consumeItem(userId: string, itemId: string, amount: number, tokenId?: string) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      return await this.prisma.$transaction(async (tx: any) => {
        const inventoryItem = await tx.inventory.findFirst({
          where: { user_id: userId, item_id: itemId, token_id: tokenId },
        });

        if (!inventoryItem || inventoryItem.quantity < amount) {
          throw new Error('Insufficient item balance');
        }

        await tx.inventoryTransaction.create({
          data: {
            user_id: userId,
            item_id: itemId,
            amount: -amount,
            transaction_type: 'Consume',
          },
        });

        const updatedItem = await tx.inventory.update({
          where: { id: inventoryItem.id },
          data: { quantity: inventoryItem.quantity - amount },
        });

        this.eventEmitter.emit('inventory.updated', {
          userId,
          itemId,
          amount: -amount,
          newQuantity: updatedItem.quantity,
        });

        return updatedItem;
      });
    } catch (e: any) {
      throw new Error(e.message || 'Failed to consume item');
    }
  }
}
