import type { InternalAccount } from '@metamask/keyring-internal-api';

export type ExternalAccount = Pick<InternalAccount, 'address' | 'type'> & {
  metadata: Pick<InternalAccount['metadata'], 'name'>;
  isExternal?: boolean;
};
export type DestinationAccount = InternalAccount | ExternalAccount;
