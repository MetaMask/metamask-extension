import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Contact, AddContactOptions, UpdateContactOptions } from '@dial-wtf/sdk';
import {
  setContacts,
  setContactsLoading,
  addContact as addDialContact,
  updateContact as updateDialContact,
  removeContact as removeDialContact,
} from '../ducks/dial';
import {
  getDialContactsList,
  getDialContactByAddress,
  getDialContactsLoading,
  getDialIsAuthenticated,
} from '../selectors/dial';
import { useDialClient } from './useDialClient';

/**
 * Hook to manage Dial contacts sync with the address book.
 *
 * Fetches Dial contacts when authenticated and provides CRUD operations
 * that sync to both the Dial API and MetaMask's address book.
 */
export function useDialContacts(): {
  contacts: Contact[];
  isLoading: boolean;
  isAuthenticated: boolean;
  getContact: (address: string) => Contact | undefined;
  addContact: (options: AddContactOptions) => Promise<Contact | null>;
  updateContact: (options: UpdateContactOptions) => Promise<Contact | null>;
  removeContact: (address: string) => Promise<void>;
  refreshContacts: () => Promise<void>;
} {
  const dispatch = useDispatch();
  const { userDialer } = useDialClient();
  const isAuthenticated = useSelector(getDialIsAuthenticated);
  const contacts = useSelector(getDialContactsList);
  const isLoading = useSelector(getDialContactsLoading);

  const refreshContacts = useCallback(async () => {
    if (!userDialer) {
      return;
    }
    try {
      dispatch(setContactsLoading(true));
      const dialContacts = await userDialer.contacts.getAll();
      dispatch(setContacts(dialContacts));
    } catch {
      dispatch(setContactsLoading(false));
    }
  }, [userDialer, dispatch]);

  // Fetch contacts when authenticated
  useEffect(() => {
    if (isAuthenticated && userDialer) {
      refreshContacts();
    }
  }, [isAuthenticated, userDialer, refreshContacts]);

  const getContact = useCallback(
    (address: string) => {
      return contacts.find(
        (c) => c.walletAddress.toLowerCase() === address.toLowerCase(),
      );
    },
    [contacts],
  );

  const addContact = useCallback(
    async (options: AddContactOptions): Promise<Contact | null> => {
      if (!userDialer) {
        return null;
      }
      try {
        const contact = await userDialer.contacts.add(options);
        dispatch(addDialContact(contact));
        return contact;
      } catch {
        return null;
      }
    },
    [userDialer, dispatch],
  );

  const updateContactFn = useCallback(
    async (options: UpdateContactOptions): Promise<Contact | null> => {
      if (!userDialer) {
        return null;
      }
      try {
        const contact = await userDialer.contacts.update(options);
        dispatch(updateDialContact(contact));
        return contact;
      } catch {
        return null;
      }
    },
    [userDialer, dispatch],
  );

  const removeContactFn = useCallback(
    async (address: string): Promise<void> => {
      if (!userDialer) {
        return;
      }
      try {
        await userDialer.contacts.remove(address);
        dispatch(removeDialContact(address));
      } catch {
        // Removal failed silently
      }
    },
    [userDialer, dispatch],
  );

  return {
    contacts,
    isLoading,
    isAuthenticated,
    getContact,
    addContact,
    updateContact: updateContactFn,
    removeContact: removeContactFn,
    refreshContacts,
  };
}
