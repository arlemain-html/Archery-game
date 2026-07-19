import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ethers } from 'ethers';
import { contractAddresses, abis } from '@archery/contracts';

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private provider!: ethers.JsonRpcProvider;
  private gameShopContract!: ethers.Contract;
  private readonly logger = new Logger(IndexerService.name);

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    if (!rpcUrl) {
      this.logger.error('RPC_URL not configured');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    const gameShopAddress = contractAddresses.base_mainnet.GameShop;

    if (!gameShopAddress) {
      this.logger.error('GameShop contract address not found in @archery/contracts');
      return;
    }

    this.gameShopContract = new ethers.Contract(gameShopAddress, abis.GameShop, this.provider);

    this.startListening();
  }

  private startListening() {
    this.logger.log(`Listening to GameShop events at ${this.gameShopContract.target}`);

    this.gameShopContract.on('ItemPurchased', (buyer, skuId, quantity, event) => {
      this.logger.log(`ItemPurchased event detected: Buyer=${buyer}, SKU=${skuId}, Qty=${quantity}`);
      
      this.eventEmitter.emit('purchase.detected', {
        buyer,
        skuId: skuId.toString(),
        quantity: Number(quantity),
        txHash: event.log.transactionHash,
      });
    });
  }

  onModuleDestroy() {
    if (this.gameShopContract) {
      this.gameShopContract.removeAllListeners();
    }
  }
}
