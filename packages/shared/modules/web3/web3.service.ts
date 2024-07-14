import { Injectable, Logger } from '@nestjs/common';
import { Provider, Contract } from 'starknet';

@Injectable()
export class Web3Service {
  logger = new Logger(Web3Service.name);

  getProvider(rpc: string) {
    const provider = new Provider({ nodeUrl: rpc });

    return provider;
  }

  async getContractInstance(
    abi: any,
    contractAddress: string,
    rpc: string,
  ): Promise<Contract> {
    const provider = this.getProvider(rpc);
    const contractInstance = new Contract(abi, contractAddress, provider);
    return contractInstance;
  }

  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('latest');
    return block.timestamp;
  }
}
