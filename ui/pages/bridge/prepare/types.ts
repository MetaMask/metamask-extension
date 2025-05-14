import type { InternalAccount } from '@metamask/keyring-internal-api';

export type ExternalAccount = {
  address: string;
  metadata: {
    name: string;
  };
  isExternal: boolean;
};

export type DestinationAccount = InternalAccount | ExternalAccount;
