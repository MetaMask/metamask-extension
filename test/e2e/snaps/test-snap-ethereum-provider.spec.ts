import { Mockttp } from 'mockttp';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixtures/fixture-builder';
import { withFixtures } from '../helpers';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockEthereumProviderSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import {
  approveAccount,
  approvePersonalSignMessage,
} from '../page-objects/flows/snap-permission.flow';
import { DAPP_PATH } from '../constants';

// Mock real genesis blocks for the chains to not require hitting the network.
async function mockGenesisBlocks(mockServer: Mockttp) {
  await mockServer
    .forPost('https://mainnet.infura.io/v3/00000000000000000000000000000000')
    .withJsonBodyIncluding({
      method: 'eth_getBlockByNumber',
      params: ['0x0', false],
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        result: {
          difficulty: '0x400000000',
          extraData:
            '0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa',
          gasLimit: '0x1388',
          gasUsed: '0x0',
          hash: '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
          logsBloom:
            '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          miner: '0x0000000000000000000000000000000000000000',
          mixHash:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          nonce: '0x0000000000000042',
          number: '0x0',
          parentHash:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          receiptsRoot:
            '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
          sha3Uncles:
            '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
          size: '0x21c',
          stateRoot:
            '0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544',
          timestamp: '0x0',
          transactions: [],
          transactionsRoot:
            '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
          uncles: [],
        },
      },
    }));

  await mockServer
    .forPost(
      'https://linea-mainnet.infura.io/v3/00000000000000000000000000000000',
    )
    .withJsonBodyIncluding({
      method: 'eth_getBlockByNumber',
      params: ['0x0', false],
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        result: {
          number: '0x0',
          hash: '0xb6762a65689107b2326364aefc18f94cda413209fab35c00d4af51eaa20ffbc6',
          mixHash:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          parentHash:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          nonce: '0x0000000000000000',
          sha3Uncles:
            '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
          logsBloom:
            '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          transactionsRoot:
            '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
          stateRoot:
            '0x716659ad8045834538750b4c0885b6759b6b096e14a0ccda4e301e49de97987f',
          receiptsRoot:
            '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
          miner: '0x0000000000000000000000000000000000000000',
          difficulty: '0x1',
          totalDifficulty: '0x1',
          extraData:
            '0x00000000000000000000000000000000000000000000000000000000000000008f81e2e3f8b46467523463835f965ffe476e1c9e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          baseFeePerGas: '0x8',
          size: '0x274',
          gasLimit: '0x3a2c940',
          gasUsed: '0x0',
          timestamp: '0x6391bff3',
          uncles: [],
          transactions: [],
        },
      },
    }));

  await mockServer
    .forPost('https://sepolia.infura.io/v3/00000000000000000000000000000000')
    .withJsonBodyIncluding({
      method: 'eth_getBlockByNumber',
      params: ['0x0', false],
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        result: {
          baseFeePerGas: '0x3b9aca00',
          difficulty: '0x20000',
          extraData:
            '0x5365706f6c69612c20417468656e732c204174746963612c2047726565636521',
          gasLimit: '0x1c9c380',
          gasUsed: '0x0',
          hash: '0x25a5cc106eea7138acab33231d7160d69cb777ee0c2c553fcddf5138993e6dd9',
          logsBloom:
            '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          miner: '0x0000000000000000000000000000000000000000',
          mixHash:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          nonce: '0x0000000000000000',
          number: '0x0',
          parentHash:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          receiptsRoot:
            '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
          sha3Uncles:
            '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
          size: '0x225',
          stateRoot:
            '0x5eb6e371a698b8d68f665192350ffcecbbbf322916f4b51bd79bb6887da3f494',
          timestamp: '0x6159af19',
          transactions: [],
          transactionsRoot:
            '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
          uncles: [],
        },
      },
    }));
}

describe('Test Snap ethereum_provider', function () {
  it('can use the ethereum_provider endowment', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockEthereumProviderSnap(mockServer);
          await mockGenesisBlocks(mockServer);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Navigate to test snaps page, connect Ethereum provider example Snap, complete installation and validate
        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectEthereumProviderButton',
        );
        await testSnaps.checkConnectEthereumProviderButtonText(
          'Reconnect to Ethereum Provider Snap',
        );

        await testSnaps.clickGetVersionButton();
        await testSnaps.checkAddressResult('0x1');

        // Test getting accounts.
        await testSnaps.clickGetAccountsButton();
        await approveAccount(driver);
        await testSnaps.checkAddressResult(
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );

        // Test `personal_sign`.
        await testSnaps.fillPersonalSignMessageInput('foo');
        await testSnaps.clickPersonalSignButton();
        await approvePersonalSignMessage(driver);
        await testSnaps.checkPersonalSignResult(
          '"0xf63c587cd42e7775e2e815a579f9744ea62944f263b3e69fad48535ba98a5ea107bc878088a99942733a59a89ef1d590eafdb467d59cf76564158d7e78351b751b"',
        );

        // Test `eth_signTypedData_v4`.
        await testSnaps.fillSignTypedDataMessageInput('bar');
        await testSnaps.clickSignTypedDataButton();
        await approvePersonalSignMessage(driver);
        await testSnaps.checkSignTypedDataResult(
          '"0x7024dc071a7370eee444b2a3edc08d404dd03393694403cdca864653a7e8dd7c583419293d53602666cbe77faa8819fba04f8c57e95df2d4c0190968eece28021c"',
        );

        // Check other networks.
        await testSnaps.selectNetwork('Ethereum');
        await testSnaps.clickSendGenesisBlockEthProviderButton();
        await testSnaps.checkAddressResultIncludes(
          '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
        );

        await testSnaps.selectNetwork('Linea');
        await testSnaps.clickSendGenesisBlockEthProviderButton();
        await testSnaps.checkAddressResultIncludes(
          '0xb6762a65689107b2326364aefc18f94cda413209fab35c00d4af51eaa20ffbc6',
        );

        await testSnaps.selectNetwork('Sepolia');
        await testSnaps.clickSendGenesisBlockEthProviderButton();
        await testSnaps.checkAddressResultIncludes(
          '0x25a5cc106eea7138acab33231d7160d69cb777ee0c2c553fcddf5138993e6dd9',
        );
      },
    );
  });
});
