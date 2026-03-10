import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the new Contacts flow (standalone contacts page from global menu).
 * Replaces the old settings contact list tab.
 */
class ContactsSettings {
  private readonly driver: Driver;

  private readonly addContactButton =
    '[data-testid="contacts-add-contact-button"]';

  private readonly confirmAddContactButton = {
    testId: 'page-container-footer-next',
  };

  private readonly networkSelector = {
    testId: 'network-selector',
  };

  private readonly contactListItem = '[data-testid="contact-list-item"]';

  private readonly contactListItemLabel =
    '[data-testid="contact-list-item-label"]';

  private readonly contactListItemAddress =
    '[data-testid="contact-list-item-address"]';

  private readonly contactsPage = {
    testId: 'contacts-page',
  };

  private readonly createContactNicknameInput = '#contact-nickname';

  private readonly createContactAddressInput = '#contact-address';

  private readonly deleteContactButton = {
    testId: 'view-contact-delete-button',
  };

  private readonly deleteContactConfirmButton = {
    testId: 'delete-contact-confirm-button',
  };

  private readonly editContactButton = {
    testId: 'view-contact-edit-button',
  };

  private readonly editContactNicknameInput = '#edit-contact-nickname';

  private readonly editContactAddressInput = '#edit-contact-address';

  private readonly editContactMemoInput = '#edit-contact-memo';

  constructor(driver: Driver) {
    this.driver = driver;
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
  private async clickAddContact(): Promise<void> {
    await this.driver.waitForSelector(this.addContactButton, {
      timeout: 2000,
    });
    await this.driver.clickElement(this.addContactButton);
  }

  /**
   * Adds a new contact to the address book.
   *
   * @param userName - The name of the contact.
   * @param address - The address of the contact.
   */
  async addContact(userName: string, address: string): Promise<void> {
    console.log('Adding new contact on contacts page');

    await this.clickAddContact();
    await this.driver.fill(this.createContactNicknameInput, userName);
    await this.driver.fill(this.createContactAddressInput, address);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmAddContactButton,
    );
  }

  /**
   * Adds a new contact to the address book with a specific network.
   *
   * @param userName - The name of the contact.
   * @param address - The address of the contact.
   * @param newNetwork - The network name for the contact.
   */
  async addContactNewChain(
    userName: string,
    address: string,
    newNetwork: string,
  ): Promise<void> {
    console.log('Adding new contact on contacts page with network');

    await this.clickAddContact();
    await this.driver.fill(this.createContactNicknameInput, userName);
    await this.driver.pasteIntoField(this.createContactAddressInput, address);
    await this.driver.clickElement(this.networkSelector);
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
    console.log('Deleting contact on contacts page');
    await this.driver.findScrollToAndClickElement({
      text: contactName,
      css: this.contactListItem,
    });
    await this.driver.clickElement(this.deleteContactButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.deleteContactConfirmButton,
    );
  }

  /**
   * Edits a contact in the address book (name, address, and optional memo; network is read-only and not editable).
   *
   * @param params - The parameters object
   * @param params.existingContactName - The name of the contact to edit.
   * @param params.newContactName - The new name of the contact.
   * @param params.newContactAddress - The new address of the contact.
   * @param params.newContactMemo - Optional new memo for the contact.
   */
  async editContact({
    existingContactName,
    newContactName,
    newContactAddress,
    newContactMemo,
  }: {
    existingContactName: string;
    newContactName: string;
    newContactAddress: string;
    newContactMemo?: string;
  }): Promise<void> {
    console.log('Editing contact on contacts page');
    await this.driver.findScrollToAndClickElement({
      text: existingContactName,
      css: this.contactListItem,
    });
    await this.driver.clickElement(this.editContactButton);
    await this.driver.fill(this.editContactNicknameInput, newContactName);
    await this.driver.fill(this.editContactAddressInput, newContactAddress);
    if (newContactMemo !== undefined) {
      await this.driver.fill(this.editContactMemoInput, newContactMemo);
    }

    await this.driver.clickElementAndWaitToDisappear(
      this.confirmAddContactButton,
    );
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
}

export default ContactsSettings;
