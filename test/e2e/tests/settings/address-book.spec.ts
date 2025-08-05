import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import FixtureBuilder from '../../fixture-builder';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import ContactsPage from '../../page-objects/pages/settings/contacts-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import AssetPicker from '../../page-objects/pages/asset-picker';
import NetworkManager from '../../page-objects/pages/network-manager';
import { TOKENS_API_MOCK_RESULT } from '../../../data/mock-data';

async function mockTokenList(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://swap.api.cx.metamask.io/networks/59144/tokens')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: TOKENS_API_MOCK_RESULT,
      };
    });
}

describe('Address Book', function (this: Suite) {
  it('Sends to an address book entry', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAddressBookController({
            addressBook: {
              '0x539': {
                '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                  address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  chainId: '0x539',
                  isEns: false,
                  memo: '',
                  name: 'Test Name 1',
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.startSendFlow();

        const sendTokenPage = new SendTokenPage(driver);
        await sendTokenPage.check_pageIsLoaded();
        await sendTokenPage.selectContactItem('Test Name 1');
        await sendTokenPage.fillAmount('2');
        await sendTokenPage.goToNextScreen();
        await new TransactionConfirmation(driver).clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(1);
        await activityList.check_txAction('Sent', 1);
        await activityList.check_txAmountInActivity(`-2 ETH`, 1);
      },
    );
  });

  it('Sends to an address book entry on a different network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withAddressBookController({
            addressBook: {
              '0x1': {
                '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                  address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  chainId: '0x1',
                  isEns: false,
                  memo: '',
                  name: 'Test Name 1',
                },
              },
            },
          })
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
              '0xe708': true,
            },
          })
          .build(),
        testSpecificMock: mockTokenList,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.startSendFlow();

        const sendTokenPage = new SendTokenPage(driver);
        await sendTokenPage.check_pageIsLoaded();

        await sendTokenPage.selectContactItem('Test Name 1');

        const assetPicker = new AssetPicker(driver);
        await assetPicker.openAssetPicker('source');

        await sendTokenPage.clickMultichainAssetPickerNetwork();

        const networkSelector = new NetworkManager(driver);

        await networkSelector.selectNetworkByChainId('0xe708');

        // dest should be cleared
        await sendTokenPage.check_pageIsLoaded();
      },
    );
  });

  it('Adds a new contact to the address book', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToContactsSettings();

        const contactsPage = new ContactsPage(driver);
        await contactsPage.check_pageIsLoaded();
        await contactsPage.addContact(
          'Test User',
          '0x56A355d3427bC2B1E22c78197AF091230919Cc2A',
        );
        await contactsPage.check_contactDisplayed({
          contactName: 'Test User',
          address: shortenAddress('0x56A355d3427bC2B1E22c78197AF091230919Cc2A'),
        });
      },
    );
  });

  it('Adds a new contact to the address book on a different chain', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToContactsSettings();

        const contactsPage = new ContactsPage(driver);
        await contactsPage.check_pageIsLoaded();
        await contactsPage.addContactNewChain(
          'Test User',
          '0x56A355d3427bC2B1E22c78197AF091230919Cc2A',
          'Sepolia',
        );
        await contactsPage.check_contactDisplayed({
          contactName: 'Test User',
          address: shortenAddress('0x56A355d3427bC2B1E22c78197AF091230919Cc2A'),
        });
      },
    );
  });

  it('Edit entry in address book', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAddressBookController({
            addressBook: {
              '0x539': {
                '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                  address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  chainId: '0x539',
                  isEns: false,
                  memo: '',
                  name: 'Test Name 1',
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToContactsSettings();

        const contactsPage = new ContactsPage(driver);
        await contactsPage.check_pageIsLoaded();
        await contactsPage.editContact({
          existingContactName: 'Test Name 1',
          newContactName: 'Test Name Edit',
          newContactAddress: '0x74cE91B75935D6Bedc27eE002DeFa566c5946f74',
          newNetwork: 'Sepolia',
        });
        await contactsPage.check_contactDisplayed({
          contactName: 'Test Name Edit',
          address: shortenAddress('0x74cE91B75935D6Bedc27eE002DeFa566c5946f74'),
        });
      },
    );
  });
  it('Deletes existing entry from address book', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAddressBookController({
            addressBook: {
              '0x539': {
                '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                  address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  chainId: '0x539',
                  isEns: false,
                  memo: '',
                  name: 'Test Name 1',
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToContactsSettings();

        const contactsPage = new ContactsPage(driver);
        await contactsPage.check_pageIsLoaded();
        await contactsPage.deleteContact('Test Name 1');

        // it checks if account is deleted
        await contactsPage.check_contactDisplayed({
          contactName: 'Test Name 1',
          address: shortenAddress('0x2f318C334780961FB129D2a6c30D0763d9a5C970'),
          shouldDisplay: false,
        });
      },
    );
  });

  it('User can add same address contacts on different chains', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToContactsSettings();

        const contactsPage = new ContactsPage(driver);
        await contactsPage.check_pageIsLoaded();
        await contactsPage.addContact(
          'Test User 1',
          '0x56A355d3427bC2B1E22c78197AF091230919Cc2A',
        );
        await contactsPage.check_contactDisplayed({
          contactName: 'Test User 1',
          address: shortenAddress('0x56A355d3427bC2B1E22c78197AF091230919Cc2A'),
        });

        await contactsPage.check_pageIsLoaded();
        await contactsPage.addContactNewChain(
          'Test User 2',
          '0x56A355d3427bC2B1E22c78197AF091230919Cc2A',
          'Sepolia',
        );
        await contactsPage.check_contactDisplayed({
          contactName: 'Test User 2',
          address: shortenAddress('0x56A355d3427bC2B1E22c78197AF091230919Cc2A'),
        });
      },
    );
  });
});
