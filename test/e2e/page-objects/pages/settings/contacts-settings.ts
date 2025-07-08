import { Driver } from '../../../webdriver/driver';

class ContactsSettings {
  private readonly driver: Driver;

  private readonly addContactLink = '.address-book__link';

  private readonly addContactButton = {
    text: 'Add contact',
    tag: 'button',
  };

  private readonly confirmAddContactButton = {
    testId: 'page-container-footer-next',
  };

  private readonly contactListItem = '[data-testid="address-list-item-label"]';

  private readonly contactListItemAddress =
    '[data-testid="address-list-item-address"]';

  private readonly contactsSettingsPageTitle = {
    text: 'Contacts',
    tag: 'h4',
  };

  private readonly createContactAddressInput = '[data-testid="ens-input"]';

  private readonly deleteContactButton = {
    css: '.settings-page__address-book-button',
    text: 'Delete contact',
  };

  private readonly editContactAddressInput = '#address';

  private readonly editContactButton = { text: 'Edit', tag: 'button' };

  private readonly userNameInput = '#nickname';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.contactsSettingsPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Contacts Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Contacts Settings page is loaded');
  }

  /**
   * Adds a new contact to the address book.
   *
   * @param userName - The name of the contact.
   * @param address - The address of the contact.
   * @param selector - Use 'link' or 'button' to add a contact.
   */
  async addContact(
    userName: string,
    address: string,
    selector: 'link' | 'button' = 'link',
  ): Promise<void> {
    const addContactSelector =
      selector === 'button' ? this.addContactButton : this.addContactLink;

    console.log(
      `Adding new contact on contacts settings page using ${selector}`,
    );

    await this.driver.clickElement(addContactSelector);
    await this.driver.fill(this.userNameInput, userName);
    await this.driver.fill(this.createContactAddressInput, address);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmAddContactButton,
    );
  }

  /**
   * Deletes a contact from the address book.
   *
   * @param contactName - The name of the contact to delete.
   */
  async deleteContact(contactName: string): Promise<void> {
    console.log('Deleting contact on contacts settings page');
    await this.driver.clickElement({
      text: contactName,
      css: this.contactListItem,
    });
    await this.driver.clickElement(this.editContactButton);
    await this.driver.clickElementAndWaitToDisappear(this.deleteContactButton);
  }

  /**
   * Edits a contact in the address book.
   *
   * @param params - The parameters object
   * @param params.existingContactName - The name of the contact to edit.
   * @param params.newContactName - The new name of the contact.
   * @param params.newContactAddress - The new address of the contact.
   */
  async editContact({
    existingContactName,
    newContactName,
    newContactAddress,
  }: {
    existingContactName: string;
    newContactName: string;
    newContactAddress: string;
  }): Promise<void> {
    console.log('Editing contact on contacts settings page');
    await this.driver.clickElement({
      text: existingContactName,
      css: this.contactListItem,
    });
    await this.driver.clickElement(this.editContactButton);
    await this.driver.fill(this.userNameInput, newContactName);
    await this.driver.fill(this.editContactAddressInput, newContactAddress);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmAddContactButton,
    );
  }

  /**
   * Check if a contact is displayed on the contacts settings page.
   *
   * @param params - The parameters object
   * @param params.contactName - The name of the contact.
   * @param params.address - The address of the contact.
   * @param params.shouldDisplay - Whether the contact should be displayed. Defaults to true.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_contactDisplayed({
    contactName,
    address,
    shouldDisplay = true,
  }: {
    contactName: string;
    address: string;
    shouldDisplay?: boolean;
  }): Promise<void> {
    console.log(
      `Checking if contact ${contactName} is displayed on contacts settings page`,
    );
    if (shouldDisplay) {
      await this.driver.waitForSelector({
        text: contactName,
        css: this.contactListItem,
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
}

export default ContactsSettings;
