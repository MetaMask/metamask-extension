import { InternalAccount } from '@metamask/keyring-api';

export type KeyringMetadata = {
  type: string;
};

export type Identity = InternalAccount & {
  balance: string;
  label?: string;
};

export type Permission = {
  key: string;
  value: {
    caveats: {
      type: string;
      value: string[];
    }[];
    date: number;
    id: string;
    invoker: string;
    parentCapability: string;
  };
};
