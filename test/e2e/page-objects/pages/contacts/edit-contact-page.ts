import { Driver } from '../../../webdriver/driver';

/**
 * Edit contact form.
 *
 * Screen: `#/contacts/edit/:chainId/:address`, reached from
 * `ContactDetailsPage.clickEditContact`.
 * Owns: the nickname, address and memo inputs and the save button. The
 * network is read-only here.
 * Boundaries: the edit form only. After saving, the app returns to the list,
 * which belongs to `ContactsListPage`.
 * Related: `ContactDetailsPage`, `ContactsListPage`.
 *
 * @see ui/pages/contacts/edit-contact-page.tsx
 * @see ui/pages/contacts/components/edit-contact-form.tsx
 */
class EditContactPage {
  private readonly addressInput = '#edit-contact-address';

  private readonly driver: Driver;

  private readonly editContactPage = '[data-testid="edit-contact-page"]';

  private readonly memoInput = '#edit-contact-memo';

  private readonly nicknameInput = '#edit-contact-nickname';

  private readonly saveButton = {
    testId: 'page-container-footer-next',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Edit contact page is loaded');
    await this.driver.waitForMultipleSelectors([
      this.editContactPage,
      this.nicknameInput,
      this.addressInput,
    ]);
  }

  /**
   * Fills in and saves the contact's new name, address and optional memo.
   *
   * @param params - The parameters object
   * @param params.name - The new name of the contact.
   * @param params.address - The new address of the contact.
   * @param params.memo - Optional new memo for the contact.
   */
  async editContact({
    name,
    address,
    memo,
  }: {
    name: string;
    address: string;
    memo?: string;
  }): Promise<void> {
    console.log('Editing contact on edit contact page');
    await this.driver.fill(this.nicknameInput, name);
    await this.driver.fill(this.addressInput, address);
    if (memo !== undefined) {
      await this.driver.fill(this.memoInput, memo);
    }
    await this.driver.clickElementAndWaitToDisappear(this.saveButton);
  }
}

export default EditContactPage;
