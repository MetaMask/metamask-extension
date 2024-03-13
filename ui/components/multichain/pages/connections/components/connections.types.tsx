import { type InternalAccount } from '@metamask/keyring-api';

// Define ConnectedSite interface
export interface ConnectedSite {
  iconUrl: string;
  name: string;
  origin: string;
  subjectType: string;
  extensionId: string | null;
  // Add other properties as needed
}

// Define ConnectedSites interface
export interface ConnectedSites {
  [address: string]: ConnectedSite[]; // Index signature
}

// Define KeyringType interface
export interface KeyringType {
  type: string;
}

// Define AccountType interface
export type AccountType = InternalAccount & {
  balance: string;
  keyring: KeyringType;
  label: string;
};
