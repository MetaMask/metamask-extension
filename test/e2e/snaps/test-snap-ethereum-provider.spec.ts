import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures } from '../helpers';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockEthereumProviderSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import {
  approveAccount,
  approvePersonalSignMessage,
} from '../page-objects/flows/snap-permission.flow';

describe('Test Snap ethereum_provider', function () {
  it('can use the ethereum_provider endowment', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockEthereumProviderSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Navigate to test snaps page, connect Ethereum provider example Snap, complete installation and validate
        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(
          driver,
          'ethereumProviderConnectButton',
        );
        await testSnaps.checkInstallationComplete(
          'ethereumProviderConnectButton',
          'Reconnect to Ethereum Provider Snap',
        );

        await testSnaps.scrollAndClickButton('getVersionButton');
        await testSnaps.checkMessageResultSpan(
          'providerVersionResultSpan',
          '0x1',
        );

        // Test getting accounts.
        await testSnaps.scrollAndClickButton('getAccountsButton');
        await approveAccount(driver);
        await testSnaps.checkMessageResultSpan(
          'addressResultSpan',
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );

        // Test `personal_sign`.
        await testSnaps.fillMessage('personalSignMessageInput', 'foo');
        await testSnaps.scrollAndClickButton('personalSignButton');
        await approvePersonalSignMessage(driver);
        await testSnaps.checkMessageResultSpan(
          'personalSignResultSpan',
          '"0xf63c587cd42e7775e2e815a579f9744ea62944f263b3e69fad48535ba98a5ea107bc878088a99942733a59a89ef1d590eafdb467d59cf76564158d7e78351b751b"',
        );

        // Test `eth_signTypedData_v4`.
        await testSnaps.fillMessage('signTypedDataMessageInput', 'bar');
        await testSnaps.scrollAndClickButton('signTypedDataButton');
        await approvePersonalSignMessage(driver);
        await testSnaps.checkMessageResultSpan(
          'signTypedDataResultSpan',
          '"0x7024dc071a7370eee444b2a3edc08d404dd03393694403cdca864653a7e8dd7c583419293d53602666cbe77faa8819fba04f8c57e95df2d4c0190968eece28021c"',
        );

        // Check other networks.
        await testSnaps.scrollAndSelectNetwork('networkDropDown', 'Ethereum');
        await testSnaps.clickButton('getVersionButton');
        await testSnaps.checkMessageResultSpan(
          'providerVersionResultSpan',
          '0x1',
        );

        await testSnaps.scrollAndSelectNetwork('networkDropDown', 'Linea');
        await testSnaps.clickButton('getVersionButton');
        await testSnaps.checkMessageResultSpan(
          'providerVersionResultSpan',
          '0xe708',
        );

        await testSnaps.scrollAndSelectNetwork('networkDropDown', 'Sepolia');
        await testSnaps.clickButton('getVersionButton');
        await testSnaps.checkMessageResultSpan(
          'providerVersionResultSpan',
          '0xaa36a7',
        );
      },
    );
  });
});
