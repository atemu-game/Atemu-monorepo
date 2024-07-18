import { Provider } from 'starknet';
import { Web3Service } from '../web3.service';
import chain from './mocks/chain.json';
import { ChainDocument } from '@app/shared/models';

describe('Web3Service', () => {
  let web3Service: Web3Service;
  let provider: Provider;

  beforeEach(() => {
    web3Service = new Web3Service();
    provider = web3Service.getProvider(chain.rpc);
  });

  it('getReturnValuesEvent', async () => {
    const txReceipt = await provider.getTransactionReceipt(
      '0x07c4d7640a11d08967a1a0d286264fdb72465aee07e2423635fef4ec1670a505',
    );

    const block = await provider.getBlock(79018);
    const returnValues = web3Service.getReturnValuesEvent(
      txReceipt,
      chain as ChainDocument,
      block.timestamp,
    );

    console.log(returnValues[0]);
  });
});
