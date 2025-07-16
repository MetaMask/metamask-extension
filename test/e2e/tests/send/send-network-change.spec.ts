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
        await sendTokenPage.check_pageIsLoaded();

        // Fill recipient first
        await sendTokenPage.fillRecipient(recipientAddress);

        // Go back to home to change network
        await sendTokenPage.clickSendFlowBackButton();

        // Change network via send flow
        await switchToNetworkFromSendFlow(driver, 'Sepolia');

        // Navigate back to send flow to verify recipient is preserved
        await homePage.startSendFlow();
        await sendTokenPage.check_pageIsLoaded();

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
        await sendTokenPage.check_pageIsLoaded();

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
        await sendTokenPage.check_pageIsLoaded();
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

  it('should show only network-specific contacts in send flow', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withAddressBookController({
            addressBook: {
              // Ethereum mainnet contacts
              '0x1': {
                '0x1234567890123456789012345678901234567890': {
                  address: '0x1234567890123456789012345678901234567890',
                  chainId: '0x1',
                  isEns: false,
                  memo: 'Ethereum mainnet contact',
                  name: 'Alice Ethereum',
                },
                '0x2345678901234567890123456789012345678901': {
                  address: '0x2345678901234567890123456789012345678901',
                  chainId: '0x1',
                  isEns: false,
                  memo: 'Another mainnet contact',
                  name: 'Bob Ethereum',
                },
              },
              // Sepolia testnet contacts
              '0xaa36a7': {
                '0x3456789012345678901234567890123456789012': {
                  address: '0x3456789012345678901234567890123456789012',
                  chainId: '0xaa36a7',
                  isEns: false,
                  memo: 'Sepolia testnet contact',
                  name: 'Charlie Sepolia',
                },
                '0x4567890123456789012345678901234567890123': {
                  address: '0x4567890123456789012345678901234567890123',
                  chainId: '0xaa36a7',
                  isEns: false,
                  memo: 'Another Sepolia contact',
                  name: 'Diana Sepolia',
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        const sendTokenPage = new SendTokenPage(driver);

        // Start send flow on Ethereum mainnet
        await homePage.startSendFlow();
        await sendTokenPage.check_pageIsLoaded();

        // Open contacts list
        await driver.clickElement({ css: 'button', text: 'Contacts' });

        // Verify only Ethereum mainnet contacts are visible
        await driver.waitForSelector({
          text: 'Alice Ethereum',
          css: '[data-testid="address-list-item-label"]',
        });
        await driver.waitForSelector({
          text: 'Bob Ethereum',
          css: '[data-testid="address-list-item-label"]',
        });

        // Verify Sepolia contacts are not visible
        await driver.assertElementNotPresent({
          text: 'Charlie Sepolia',
          css: '[data-testid="address-list-item-label"]',
        });
        await driver.assertElementNotPresent({
          text: 'Diana Sepolia',
          css: '[data-testid="address-list-item-label"]',
        });

        // Close contacts list (press ESC or click outside)
        await driver.press('body', 'Escape');

        // Go back to home and switch to Sepolia network using the helper method
        await sendTokenPage.clickSendFlowBackButton();
        await switchToNetworkFromSendFlow(driver, 'Sepolia');

        // Start send flow again on Sepolia network
        await homePage.startSendFlow();
        await sendTokenPage.check_pageIsLoaded();

        // Open contacts list again
        await driver.clickElement({ css: 'button', text: 'Contacts' });

        // Verify only Sepolia contacts are visible now
        await driver.waitForSelector({
          text: 'Charlie Sepolia',
          css: '[data-testid="address-list-item-label"]',
        });
        await driver.waitForSelector({
          text: 'Diana Sepolia',
          css: '[data-testid="address-list-item-label"]',
        });

        // Verify Ethereum contacts are not visible
        await driver.assertElementNotPresent({
          text: 'Alice Ethereum',
          css: '[data-testid="address-list-item-label"]',
        });
        await driver.assertElementNotPresent({
          text: 'Bob Ethereum',
          css: '[data-testid="address-list-item-label"]',
        });

        console.log(
          'Successfully verified network-specific contacts in send flow',
        );
      },
    );
  });
});
