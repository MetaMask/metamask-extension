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
