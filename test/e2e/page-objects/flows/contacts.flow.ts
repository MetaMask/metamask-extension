import { Driver } from '../../webdriver/driver';
import AddContactPage from '../pages/contacts/add-contact-page';
import ContactDetailsPage from '../pages/contacts/contact-details-page';
import ContactsListPage from '../pages/contacts/contacts-list-page';
import EditContactPage from '../pages/contacts/edit-contact-page';

/**
 * Add a contact from the contacts list and return to the list.
 * Expects the contacts list to be open.
 *
 * @param driver - The WebDriver instance
 * @param params - The parameters object
 * @param params.name - The name of the contact.
 * @param params.address - The address of the contact.
 * @param params.network - Optional network name; uses the default network when omitted.
 */
export async function addContact(
  driver: Driver,
  {
    name,
    address,
    network,
  }: {
    name: string;
    address: string;
    network?: string;
  },
): Promise<void> {
  const contactsListPage = new ContactsListPage(driver);
  await contactsListPage.clickAddContact();

  const addContactPage = new AddContactPage(driver);
  await addContactPage.checkPageIsLoaded();
  if (network) {
    await addContactPage.addContactOnNetwork(name, address, network);
  } else {
    await addContactPage.addContact(name, address);
  }

  await contactsListPage.checkPageIsLoaded();
}

/**
 * Delete a contact from the contacts list and return to the list.
 * Expects the contacts list to be open.
 *
 * @param driver - The WebDriver instance
 * @param contactName - The name of the contact to delete.
 */
export async function deleteContact(
  driver: Driver,
  contactName: string,
): Promise<void> {
  const contactsListPage = new ContactsListPage(driver);
  await contactsListPage.openContact(contactName);

  const contactDetailsPage = new ContactDetailsPage(driver);
  await contactDetailsPage.checkPageIsLoaded();
  await contactDetailsPage.checkContactName(contactName);
  await contactDetailsPage.deleteContact();

  await contactsListPage.checkPageIsLoaded();
}

/**
 * Edit a contact from the contacts list and return to the list. The network
 * is read-only and can't be edited.
 * Expects the contacts list to be open.
 *
 * @param driver - The WebDriver instance
 * @param params - The parameters object
 * @param params.existingContactName - The name of the contact to edit.
 * @param params.newContactName - The new name of the contact.
 * @param params.newContactAddress - The new address of the contact.
 * @param params.newContactMemo - Optional new memo for the contact.
 */
export async function editContact(
  driver: Driver,
  {
    existingContactName,
    newContactName,
    newContactAddress,
    newContactMemo,
  }: {
    existingContactName: string;
    newContactName: string;
    newContactAddress: string;
    newContactMemo?: string;
  },
): Promise<void> {
  const contactsListPage = new ContactsListPage(driver);
  await contactsListPage.openContact(existingContactName);

  const contactDetailsPage = new ContactDetailsPage(driver);
  await contactDetailsPage.checkPageIsLoaded();
  await contactDetailsPage.clickEditContact();

  const editContactPage = new EditContactPage(driver);
  await editContactPage.checkPageIsLoaded();
  await editContactPage.editContact({
    name: newContactName,
    address: newContactAddress,
    memo: newContactMemo,
  });

  await contactsListPage.checkPageIsLoaded();
  await contactsListPage.closeContactUpdatedToast();
}
