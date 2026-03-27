import type { DialState } from '../ducks/dial/dial';
import type { Contact, DialProfile, Call } from '@dial-wtf/core';

interface StateWithDial {
  dial: DialState;
}

export const getDialIsAuthenticated = (state: StateWithDial): boolean =>
  state.dial.isAuthenticated;

export const getDialIsAuthenticating = (state: StateWithDial): boolean =>
  state.dial.isAuthenticating;

export const getDialWalletAddress = (state: StateWithDial): string | null =>
  state.dial.walletAddress;

export const getDialContacts = (state: StateWithDial): Record<string, Contact> =>
  state.dial.contacts;

export const getDialContactsList = (state: StateWithDial): Contact[] =>
  Object.values(state.dial.contacts);

export const getDialContactByAddress = (
  state: StateWithDial,
  address: string,
): Contact | undefined =>
  state.dial.contacts[address.toLowerCase()];

export const getDialContactsLoading = (state: StateWithDial): boolean =>
  state.dial.contactsLoading;

export const getDialProfiles = (
  state: StateWithDial,
): Record<string, DialProfile> => state.dial.profiles;

export const getDialProfileByAddress = (
  state: StateWithDial,
  address: string,
): DialProfile | undefined =>
  state.dial.profiles[address.toLowerCase()];

export const getDialActiveCall = (state: StateWithDial): Call | null =>
  state.dial.activeCall;

export const getDialError = (state: StateWithDial): string | null =>
  state.dial.error;
