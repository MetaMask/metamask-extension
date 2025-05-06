import { BridgeToken } from '@metamask/bridge-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';

export type ExternalAccount = {
  address: string;
  metadata: {
    name: string;
  };
  isExternal: boolean;
};

export type DestinationAccount = InternalAccount | ExternalAccount;

// TODO remove this Tmp type once the core bridge controller is updated with occurrences
// https://github.com/MetaMask/core/pull/5572/files
export type TmpBridgeToken = BridgeToken & {
  occurrences?: number;
  aggregators?: string[];
};
