import { Driver } from '../../../webdriver/driver';

/**
 * Add contact form.
 *
 * Screen: `#/contacts/add`, reached from `ContactsListPage.clickAddContact`.
 * Owns: the nickname and address inputs, the network selector and the save
 * button.
 * Boundaries: the add form only. After saving, the app returns to the list,
 * which belongs to `ContactsListPage`.
 * Related: `ContactsListPage`.
 *
 * @see ui/pages/contacts/add-contact-page.tsx
 * @see ui/pages/contacts/components/add-contact-form.tsx
 */
class AddContactPage {
  private readonly addContactPage = '[data-testid="add-contact-page"]';

  private readonly addressInput = '#contact-address';

  private readonly driver: Driver;

  private readonly networkSelector = {
    testId: 'network-selector',
  };

  private readonly nicknameInput = '#contact-nickname';

  private readonly saveButton = {
    testId: 'page-container-footer-next',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Fills in and saves a new contact on the default network.
   *
   * @param userName - The name of the contact.
   * @param address - The address of the contact.
   */
  async addContact(userName: string, address: string): Promise<void> {
    console.log('Adding new contact on add contact page');
    await this.driver.fill(this.nicknameInput, userName);
    await this.driver.fill(this.addressInput, address);
    await this.driver.clickElementAndWaitToDisappear(this.saveButton);
  }

  /**
   * Fills in and saves a new contact on a specific network.
   *
   * @param userName - The name of the contact.
   * @param address - The address of the contact.
   * @param network - The network name for the contact.
   */
  async addContactOnNetwork(
    userName: string,
    address: string,
    network: string,
  ): Promise<void> {
    console.log(`Adding new contact on network ${network}`);
    await this.driver.fill(this.nicknameInput, userName);
    await this.driver.pasteIntoField(this.addressInput, address);
    await this.driver.clickElement(this.networkSelector);
    await this.driver.clickElement({ text: network });
    await this.driver.clickElementAndWaitToDisappear(this.saveButton);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Add contact page is loaded');
    await this.driver.waitForMultipleSelectors([
      this.addContactPage,
      this.nicknameInput,
      this.addressInput,
    ]);
  }
}

export default AddContactPage;
