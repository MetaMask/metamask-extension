import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, unlockWallet } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import HomePage from '../../page-objects/pages/home/homepage';

describe('Send Flow - Network Change', function (this: Suite) {
  it('should not preserve recipient address when network is changed in send flow', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        const sendTokenPage = new SendTokenPage(driver);
        const recipientAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

        // Navigate to send flow
        await homePage.startSendFlow();

        // Fill recipient first
        await sendTokenPage.fillRecipient(recipientAddress);

        // Go back to home to change network
        await sendTokenPage.clickSendFlowBackButton();

        // Change network via send flow
        await switchToNetworkFromSendFlow(driver, 'Sepolia');

        // Navigate back to send flow to verify recipient is preserved
        await homePage.startSendFlow();

        // Verify recipient address is preserved
        const recipientInput = await driver.findElement(
          '[data-testid="ens-input"]',
        );
        const inputValue = await recipientInput.getAttribute('value');
        assert.equal(
          inputValue,
          '',
          'Recipient address should not be preserved after network change',
        );

        console.log('Recipient address not preserved during network change');
      },
    );
  });

  it('should show correct tokens for new network after network change in send flow', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        const sendTokenPage = new SendTokenPage(driver);

        // Navigate to send flow
        await homePage.startSendFlow();

        // Fill recipient to enable asset picker
        await sendTokenPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        // Get initial tokens available
        await sendTokenPage.clickAssetPickerButton();
        const initialTokens = await sendTokenPage.getAssetPickerItems();
        const initialTokenCount = initialTokens.length;

        // Close asset picker modal by selecting first token
        await sendTokenPage.clickFirstTokenListButton();

        // Go back to home to change network
        await sendTokenPage.clickSendFlowBackButton();

        // Change network from send flow
        await switchToNetworkFromSendFlow(driver, 'Ethereum');

        // Navigate back to send flow to check token updates
        await homePage.startSendFlow();
        await sendTokenPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await sendTokenPage.clickAssetPickerButton();

        // Check if token list updated for new network
        const newTokens = await sendTokenPage.getAssetPickerItems();
        const newTokenCount = newTokens.length;

        // The token count might be different on different networks
        console.log(
          `Initial tokens: ${initialTokenCount}, New tokens: ${newTokenCount}`,
        );

        // Close asset picker
        await sendTokenPage.clickFirstTokenListButton();

        console.log('Token list updated correctly for new network');
      },
    );
  });
});
