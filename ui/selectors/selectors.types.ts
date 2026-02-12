import type { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { NetworkConfiguration } from '@metamask/network-controller';
import { SubjectMetadata } from '@metamask/permission-controller';
import { CaipAccountId, CaipChainId } from '@metamask/utils';

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
    active: boolean;
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

export type EvmAndMultichainNetworkConfigurationsWithCaipChainId = (
  | NetworkConfiguration
  | MultichainNetworkConfiguration
) & {
  caipChainId: CaipChainId;
};
