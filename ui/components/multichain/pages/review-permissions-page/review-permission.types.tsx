import { type InternalAccount } from '@metamask/keyring-api';

// Define ConnectedSite interface
export type ConnectedSite = {
  iconUrl: string;
  name: string;
  origin: string;
  subjectType: string;
  extensionId: string | null;
  // Add other properties as needed
};

// Define ConnectedSites interface
export type ConnectedSites = {
  [address: string]: ConnectedSite[]; // Index signature
};

// Define KeyringType interface
export type KeyringType = {
  type: string;
};

// Define AccountType interface
export type AccountType = InternalAccount & {
  name: string;
  balance: string;
  keyring: KeyringType;
  label: string;
};

export type Subject = {
  permissions: { parentCapability: string }[];
};
export type SubjectsType = {
  [key: string]: Subject;
};
