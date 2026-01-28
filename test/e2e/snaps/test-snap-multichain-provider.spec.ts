import { Mockttp } from 'mockttp';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixtures/fixture-builder';
import { withFixtures } from '../helpers';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockMultichainProviderSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import {
  approveAccount,
  approvePersonalSignMessage,
} from '../page-objects/flows/snap-permission.flow';
import { DAPP_PATH } from '../constants';
import { mockGenesisBlocks } from './mocks';

describe('Test Snap multichain provider', function () {
  it('can use the multichain-provider endowment', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockMultichainProviderSnap(mockServer);
          await mockGenesisBlocks(mockServer);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectMultichainProviderButton',
        );

        await testSnaps.checkInstallationComplete(
          'connectMultichainProviderButton',
          'Reconnect to Multichain Provider Snap',
        );

        await testSnaps.scrollAndClickButton('sendCreateSessionButton');
        await approveAccount(driver);

        const chains = [
          {
            name: 'Ethereum' as const,
            chainId: '0x1',
            genesisHash:
              '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
            account: 'eip155:1:0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            signMessageSignature:
              '"0xf63c587cd42e7775e2e815a579f9744ea62944f263b3e69fad48535ba98a5ea107bc878088a99942733a59a89ef1d590eafdb467d59cf76564158d7e78351b751b"',
            signTypedDataSignature:
              '"0x7024dc071a7370eee444b2a3edc08d404dd03393694403cdca864653a7e8dd7c583419293d53602666cbe77faa8819fba04f8c57e95df2d4c0190968eece28021c"',
          },
          {
            name: 'Sepolia' as const,
            chainId: '0xaa36a7',
            genesisHash:
              '0x25a5cc106eea7138acab33231d7160d69cb777ee0c2c553fcddf5138993e6dd9',
            account:
              'eip155:11155111:0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            signMessageSignature:
              '"0xf63c587cd42e7775e2e815a579f9744ea62944f263b3e69fad48535ba98a5ea107bc878088a99942733a59a89ef1d590eafdb467d59cf76564158d7e78351b751b"',
            signTypedDataSignature:
              '"0x35bb09b05a3f7e4a0965fbf35b48d9d51efa5f7d030bdf4c18f4ad958941d20213a3e0ef731c1ee7619248331f5c259829581da38e9112624c1f8639e954572d1c"',
          },
          {
            name: 'Solana' as const,
            genesisHash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
            account:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
            signMessageSignature:
              '"5RH4BJB99CvWqPhXAtUwLQGJePeeXFLQKbztFbiasAe4mEGmr4moV2g2XEEwWMSsZKQGiV1UHxVGuVMenXAcfKfi"',
          },
        ];

        for (const chain of chains) {
          await testSnaps.scrollAndSelectNetwork(
            'multichainNetworkDropdown',
            chain.name,
          );

          if (chain.chainId) {
            // Test getting chain ID (EVM only).
            await testSnaps.scrollAndClickButton('sendMultichainChainIdButton');

            await testSnaps.checkMessageResultSpan(
              'multichainProviderResultSpan',
              chain.chainId,
            );
          }

          // Test getting genesis hash ID.
          await testSnaps.scrollAndClickButton(
            'sendMultichainGetGenesisHashButton',
          );

          await testSnaps.checkMessageResultSpan(
            'multichainProviderResultSpan',
            chain.genesisHash,
          );

          // Test getting accounts.
          await testSnaps.scrollAndClickButton(
            'sendMultichainGetAccountsButton',
          );
          await testSnaps.checkMessageResultSpan(
            'multichainProviderResultSpan',
            chain.account,
          );

          // Test signing a message.
          await testSnaps.fillMessage('signMessageMultichainInput', 'foo');
          await testSnaps.scrollAndClickButton('signMessageMultichainButton');
          await approvePersonalSignMessage(driver);
          await testSnaps.checkMessageResultSpan(
            'signMessageMultichainResultSpan',
            chain.signMessageSignature,
          );

          if (chain.signTypedDataSignature) {
            // Test signing typed data.
            await testSnaps.fillMessage('signTypedDataMultichainInput', '');
            await testSnaps.fillMessage('signTypedDataMultichainInput', 'bar');
            await testSnaps.scrollAndClickButton(
              'signTypedDataMultichainButton',
            );
            await approvePersonalSignMessage(driver);
            await testSnaps.checkMessageResultSpan(
              'signTypedDataMultichainResultSpan',
              chain.signTypedDataSignature,
            );
          }
        }
      },
    );
  });
});
