import { Address, OpenedContract, toNano } from 'ton-core';
import { TonClient, TonClient4 } from 'ton';
import { FaucetMaster } from '../wrappers/FaucetMaster';
import { FaucetItem } from '../wrappers/FaucetItem';

export class ShardedFaucet {
  faucetMaster: OpenedContract<FaucetMaster>;

  constructor(readonly client: TonClient4 | TonClient, faucetAddress: Address) {
    this.faucetMaster = client.open(FaucetMaster.createFromAddress(faucetAddress));
  }

  private async isContractDeployed(addr: Address): Promise<boolean> {
    if (this.client instanceof TonClient) {
      return this.client.isContractDeployed(addr);
    } else {
      const { last } = await this.client.getLastBlock();
      return this.client.isContractDeployed(last.seqno, addr);
    }
  }

  async requestJettons(myAddress: Address) {
    const { address, stateinit } = await this.faucetMaster.getFaucetItemAddress(myAddress);

    if (await this.isContractDeployed(address)) {
      return { value: toNano('0.1'), to: address, body: FaucetItem.requestPayload() };
    } else {
      return { value: toNano('0.1'), to: address, body: FaucetItem.requestPayload(), init: stateinit };
    }
  }
}
