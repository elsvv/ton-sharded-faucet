import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export const FaucetOpcodes = {
  change_faucet_settings: 0x6b7f2a2c,
  change_faucet_admin: 0x6284c85c,
  request_faucet_withdraw: 0x97f9ed56,
};

export type FaucetMasterData = {
  amount_per_request: bigint;
  admin: Address;
  jetton_wallet: Address;
  max_faucet_requests: number;
  faucet_item_code: Cell;
};

export type FaucetMasterConfig = Pick<FaucetMasterData, 'admin' | 'jetton_wallet' | 'faucet_item_code'>;

export function faucetMasterConfigToCell(config: FaucetMasterConfig): Cell {
  return beginCell()
    .storeCoins(0)
    .storeAddress(config.admin)
    .storeAddress(config.jetton_wallet)
    .storeUint(0, 32)
    .storeRef(config.faucet_item_code)
    .endCell();
}

export class FaucetMaster implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

  static createFromAddress(address: Address) {
    return new FaucetMaster(address);
  }

  static createFromConfig(config: FaucetMasterConfig, code: Cell, workchain = 0) {
    const data = faucetMasterConfigToCell(config);
    const init = { code, data };
    return new FaucetMaster(contractAddress(workchain, init), init);
  }

  static changeSettingsPayload(
    opts: Pick<FaucetMasterData, 'amount_per_request' | 'jetton_wallet' | 'max_faucet_requests'>
  ) {
    // var (new_amount_per_request, new_jetton_wallet, new_max_faucet_requests) =
    // (in_msg_body~load_coins(), in_msg_body~load_msg_addr(), in_msg_body.preload_uint(32));
    return beginCell()
      .storeUint(FaucetOpcodes.change_faucet_settings, 32)
      .storeCoins(opts.amount_per_request)
      .storeAddress(opts.jetton_wallet)
      .storeUint(opts.max_faucet_requests, 32)
      .endCell();
  }

  async sendDeploy(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    deployOpts: Pick<FaucetMasterData, 'amount_per_request' | 'jetton_wallet' | 'max_faucet_requests'>
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: FaucetMaster.changeSettingsPayload(deployOpts),
    });
  }

  async sendChangeSettings(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    deployOpts: Pick<FaucetMasterData, 'amount_per_request' | 'jetton_wallet' | 'max_faucet_requests'>
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: FaucetMaster.changeSettingsPayload(deployOpts),
    });
  }

  static changeAdminPayload(newAdmin: Address) {
    return beginCell().storeUint(FaucetOpcodes.change_faucet_admin, 32).storeAddress(newAdmin).endCell();
  }

  async sendChangeAdmin(provider: ContractProvider, via: Sender, value: bigint, newAdmin: Address) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: FaucetMaster.changeAdminPayload(newAdmin),
    });
  }

  async getFaucetItemAddress(provider: ContractProvider, userAddress: Address) {
    const { stack } = await provider.get('get_faucet_item_stateinit_and_address', [
      {
        type: 'slice',
        cell: beginCell().storeAddress(userAddress).endCell(),
      },
    ]);
    return {
      address: stack.readAddress(),
      stateinit: stack.readCell(),
    };
  }

  async getFaucetData(provider: ContractProvider) {
    const { stack } = await provider.get('get_faucet_master_data', []);
    // return (amount_per_request, admin, jetton_wallet, max_faucet_requests);
    return {
      amount_per_request: stack.readBigNumber(),
      admin: stack.readAddress(),
      jetton_wallet: stack.readAddress(),
      max_faucet_requests: stack.readNumber(),
    };
  }
}
