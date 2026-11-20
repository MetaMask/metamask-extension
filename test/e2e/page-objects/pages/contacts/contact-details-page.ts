import { Driver } from '../../../webdriver/driver';

/**
 * Contact details.
 *
 * Screen: `#/contacts/view/:chainId/:address`, reached from
 * `ContactsListPage.openContact`.
 * Owns: the contact name, the edit button, and the delete button with its
 * confirm modal.
 * Boundaries: details only. Editing belongs to `EditContactPage`; after a
 * delete, the app returns to the list, which belongs to `ContactsListPage`.
 * Related: `ContactsListPage`, `EditContactPage`.
 *
 * @see ui/pages/contacts/contact-details-page.tsx
 * @see ui/pages/contacts/components/view-contact-content.tsx
 * @see ui/pages/contacts/components/delete-contact-modal.tsx
 */
class ContactDetailsPage {
  private readonly contactDetailsPage = '[data-testid="contact-details-page"]';

  private readonly contactName = (contactName: string) => ({
    testId: 'address-book-name',
    text: contactName,
  });

  private readonly deleteContactButton = {
    testId: 'view-contact-delete-button',
  };

  private readonly deleteContactConfirmButton = {
    testId: 'delete-contact-confirm-button',
  };

  private readonly driver: Driver;

  private readonly editContactButton = {
    testId: 'view-contact-edit-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check the details page shows the given contact name.
   *
   * @param contactName - The expected contact name.
   */
  async checkContactName(contactName: string): Promise<void> {
    console.log(`Checking contact details show ${contactName}`);
    await this.driver.waitForSelector(this.contactName(contactName));
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Contact details page is loaded');
    await this.driver.waitForMultipleSelectors([
      this.contactDetailsPage,
      this.editContactButton,
    ]);
  }

  async clickEditContact(): Promise<void> {
    console.log('Clicking edit contact on contact details page');
    await this.driver.clickElement(this.editContactButton);
  }

  /**
   * Deletes the contact and confirms it in the delete modal.
   */
  async deleteContact(): Promise<void> {
    console.log('Deleting contact on contact details page');
    await this.driver.clickElement(this.deleteContactButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.deleteContactConfirmButton,
    );
  }
}

export default ContactDetailsPage;
