import type { InternalAccount } from '@metamask/keyring-internal-api';
import { SubjectMetadata } from '@metamask/permission-controller';
import { CaipAccountId } from '@metamask/utils';

type KeyringType = {
  type: string;
};

export type InternalAccountWithBalance = InternalAccount & {
  balance: string;
};

export type InternalAccountWithPinnedHiddenActiveLastSelected =
  InternalAccountWithBalance & {
    pinned: boolean;
    hidden: boolean;
    lastSelected: number;
    active: number;
  };

export type MergedInternalAccount =
  InternalAccountWithPinnedHiddenActiveLastSelected & {
    keyring: KeyringType;
    label: string | null;
  };

export type MergedInternalAccountWithCaipAccountId = MergedInternalAccount & {
  caipAccountId: CaipAccountId;
};

export type AccountConnections = {
  [address: string]: {
    origin: string;
    iconUrl?: string;
    metadata: SubjectMetadata;
  }[];
};
