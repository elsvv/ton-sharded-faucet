import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { FaucetItem } from '../wrappers/FaucetItem';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('FaucetItem', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('FaucetItem');
    });

    let blockchain: Blockchain;
    let faucetItem: SandboxContract<FaucetItem>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        faucetItem = blockchain.openContract(FaucetItem.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await faucetItem.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: faucetItem.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and faucetItem are ready to use
    });
});
