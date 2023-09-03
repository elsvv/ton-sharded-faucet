import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type FaucetItemConfig = {};

export function faucetItemConfigToCell(config: FaucetItemConfig): Cell {
  return beginCell().endCell();
}

export class FaucetItem implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

  static createFromAddress(address: Address) {
    return new FaucetItem(address);
  }

  static createFromConfig(config: FaucetItemConfig, code: Cell, workchain = 0) {
    const data = faucetItemConfigToCell(config);
    const init = { code, data };
    return new FaucetItem(contractAddress(workchain, init), init);
  }

  async sendDDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  static requestPayload() {
    return beginCell().storeUint(0, 32).storeStringTail('Get faucet jettons').endCell();
  }

  async sendFaucetRequest(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: FaucetItem.requestPayload(),
    });
  }

  async getFaucetItemData(provider: ContractProvider) {
    const { stack } = await provider.get('get_faucet_item_data', []);
    return {
      master_addr: stack.readAddress(),
      user_addr: stack.readAddress(),
      faucet_requests: stack.readNumber(),
    };
  }
}
