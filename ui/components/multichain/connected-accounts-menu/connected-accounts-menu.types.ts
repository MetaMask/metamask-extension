import { InternalAccount } from '@metamask/keyring-api';

export type InternalAccountWithBalance = InternalAccount & {
  balance: string;
  keyringType: {
    type: string;
  };
};
