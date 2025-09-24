import { Driver } from '../../../webdriver/driver';

class ContactsSettings {
  private readonly driver: Driver;

  private readonly addContactLink = '.address-book__link';

  private readonly addContactButton = '.address-book-add-button__button';

  private readonly confirmAddContactButton = {
    testId: 'page-container-footer-next',
  };

  private readonly networkSelector = {
    testId: 'network-selector',
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

  /**
   * Clicks the appropriate add contact element based on the current state
   * (link for empty state, button for when contacts exist)
   */
  private async clickAddContact(): Promise<void> {
    try {
      // Try the button first (when contacts exist)
      await this.driver.waitForSelector(this.addContactButton, {
        timeout: 2000,
      });
      await this.driver.clickElement(this.addContactButton);
    } catch (error) {
      // If button doesn't exist, try the link (empty state)
      await this.driver.waitForSelector(this.addContactLink, {
        timeout: 2000,
      });
      await this.driver.clickElement(this.addContactLink);
    }
  }

  async checkPageIsLoaded(): Promise<void> {
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
   */
  async addContact(userName: string, address: string): Promise<void> {
    console.log('Adding new contact on contacts settings page');

    await this.clickAddContact();
    await this.driver.fill(this.userNameInput, userName);
    await this.driver.fill(this.createContactAddressInput, address);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmAddContactButton,
    );
  }

  /**
   * Adds a new contact to the address book.
   *
   * @param userName - The name of the contact.
   * @param address - The address of the contact.
   * @param newNetwork - The new network for the contact.
   */
  async addContactNewChain(
    userName: string,
    address: string,
    newNetwork: string,
  ): Promise<void> {
    console.log('Adding new contact on contacts settings page with network');

    await this.clickAddContact();
    await this.driver.fill(this.userNameInput, userName);
    await this.driver.pasteIntoField('[data-testid="ens-input"]', address);
    await this.driver.clickElement(this.networkSelector);
    // Click on the network item by its text content
    await this.driver.clickElement({
      text: newNetwork,
    });
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
    await this.driver.findScrollToAndClickElement({
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
   * @param params.newNetwork - The new network for the contact (optional).
   */
  async editContact({
    existingContactName,
    newContactName,
    newContactAddress,
    newNetwork,
  }: {
    existingContactName: string;
    newContactName: string;
    newContactAddress: string;
    newNetwork?: string;
  }): Promise<void> {
    console.log('Editing contact on contacts settings page');
    await this.driver.findScrollToAndClickElement({
      text: existingContactName,
      css: this.contactListItem,
    });
    await this.driver.clickElement(this.editContactButton);
    await this.driver.fill(this.userNameInput, newContactName);
    await this.driver.fill(this.editContactAddressInput, newContactAddress);

    // Only change network if newNetwork is provided
    if (newNetwork) {
      await this.driver.clickElement(this.networkSelector);
      await this.driver.clickElement({
        text: newNetwork,
      });
    }

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
