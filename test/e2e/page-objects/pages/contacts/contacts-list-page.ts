import { Driver } from '../../../webdriver/driver';

/**
 * Contacts address book list.
 *
 * Screen: `#/contacts`, opened from `HeaderNavbar.openContactsPage` — not a
 * Settings tab.
 * Owns: contact list items and their label/address assertions, the add
 * contact button (empty state and populated list), and the contact updated
 * toast shown after an edit.
 * Boundaries: the list only. Adding a contact belongs to `AddContactPage`,
 * viewing and deleting one to `ContactDetailsPage`, editing one to
 * `EditContactPage`. Contact sync toggles belong to `BackupAndSyncSettings`.
 * Related: `HeaderNavbar` (how tests get here), `AddContactPage`,
 * `ContactDetailsPage`, `EditContactPage`, `BackupAndSyncSettings`.
 *
 * @see ui/pages/contacts/contacts-list-page.tsx
 */
class ContactsListPage {
  private readonly addContactButton =
    '[data-testid="contacts-add-contact-button"]';

  private readonly closeContactUpdatedToastButton = {
    testId: 'toast-close-button',
  };

  private readonly contactListItem = '[data-testid="contact-list-item"]';

  private readonly contactListItemAddress =
    '[data-testid="contact-list-item-address"]';

  private readonly contactListItemLabel =
    '[data-testid="contact-list-item-label"]';

  private readonly contactsPage = {
    testId: 'parent-selector-contacts-page',
  };

  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if a contact is displayed on the contacts page.
   *
   * @param params - The parameters object
   * @param params.contactName - The name of the contact.
   * @param params.address - The address of the contact.
   * @param params.shouldDisplay - Whether the contact should be displayed. Defaults to true.
   */
  async checkContactDisplayed({
    contactName,
    address,
    shouldDisplay = true,
  }: {
    contactName: string;
    address: string;
    shouldDisplay?: boolean;
  }): Promise<void> {
    console.log(
      `Checking if contact ${contactName} is displayed on contacts page`,
    );
    if (shouldDisplay) {
      await this.driver.waitForSelector({
        text: contactName,
        css: this.contactListItemLabel,
      });
      await this.driver.waitForSelector({
        css: this.contactListItemAddress,
        text: address,
      });
    } else {
      await this.driver.assertElementNotPresent({
        text: contactName,
        css: this.contactListItem,
      });
    }
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.contactsPage);
    } catch (e) {
      console.log('Timeout while waiting for Contacts page to be loaded', e);
      throw e;
    }
    console.log('Contacts page is loaded');
  }

  /**
   * Clicks the add contact button (same for empty state and when contacts exist).
   */
  async clickAddContact(): Promise<void> {
    console.log('Clicking add contact button on contacts page');
    await this.driver.clickElement(this.addContactButton);
  }

  /**
   * Closes the contact updated toast if it is shown.
   */
  async closeContactUpdatedToast(): Promise<void> {
    console.log('Closing contact updated toast on contacts page');
    await this.driver.clickElementSafe(this.closeContactUpdatedToastButton);
  }

  /**
   * Opens the details of a contact from the list.
   *
   * @param contactName - The name of the contact to open.
   */
  async openContact(contactName: string): Promise<void> {
    console.log(`Opening contact ${contactName} on contacts page`);
    await this.driver.findScrollToAndClickElement({
      text: contactName,
      css: this.contactListItem,
    });
  }
}

export default ContactsListPage;
