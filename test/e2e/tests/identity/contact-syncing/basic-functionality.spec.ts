import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import ContactsSettings from '../../../page-objects/pages/settings/contacts-settings';
import { completeNewWalletFlowIdentity } from '../flows';

describe('Contact syncing - Basic Functionality', function () {
  this.timeout(120000);

  describe('from inside MetaMask', function () {
    it('can navigate to contacts settings without contact syncing enabled', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await completeNewWalletFlowIdentity(driver);

          // Navigate to contacts settings
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();

          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();

          // Add a simple contact to verify basic functionality
          const contactName = 'Test Contact';
          const contactAddress = '0x742d35Cc6634C0532925a3b8D7389B5b7f68Bb0B';

          await contactsSettings.addContact(contactName, contactAddress);

          // Verify contact is displayed
          await contactsSettings.check_contactDisplayed({
            contactName,
            address: contactAddress,
          });
        },
      );
    });
  });
});