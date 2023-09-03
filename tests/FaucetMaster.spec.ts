import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { FaucetMaster } from '../wrappers/FaucetMaster';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('FaucetMaster', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('FaucetMaster');
    });

    let blockchain: Blockchain;
    let faucetMaster: SandboxContract<FaucetMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        faucetMaster = blockchain.openContract(FaucetMaster.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await faucetMaster.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: faucetMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and faucetMaster are ready to use
    });
});
