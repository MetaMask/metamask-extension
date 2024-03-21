export type KeyringMetadata = {
  type: string;
};

export type Identity = {
  id: string;
  address: string;
  balance: string;
  metadata: {
    name: string;
    keyring: KeyringMetadata;
  };
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
