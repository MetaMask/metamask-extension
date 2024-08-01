import type { InternalAccount } from '@metamask/keyring-api';
import { SubjectMetadata } from '@metamask/permission-controller';
import { KeyringType } from '../hooks/metamask-notifications/useProfileSyncing';

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

export type AccountConnections = {
  [address: string]: {
    origin: string;
    iconUrl?: string;
    metadata: SubjectMetadata;
  }[];
};
