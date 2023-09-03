import { Address, toNano } from 'ton-core';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { FaucetMaster } from '../wrappers';

export async function run(provider: NetworkProvider) {
  const jettonMaster = Address.parse('');
  const faucetMaster = provider.open(
    FaucetMaster.createFromConfig(
      { admin: provider.sender().address!, jetton_wallet: jettonMaster, faucet_item_code: await compile('FaucetItem') },
      await compile('FaucetMaster')
    )
  );

  const jetton_wallet = Address.parse('');
  await faucetMaster.sendDeploy(provider.sender(), toNano('0.05'), {
    amount_per_request: 1000n * BigInt(10e5),
    jetton_wallet,
    max_faucet_requests: 1,
  });

  await provider.waitForDeploy(faucetMaster.address);
}
