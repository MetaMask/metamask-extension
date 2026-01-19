export const SMART_CONTRACT_NAMES = [
  'hst',
  'nfts',
  'erc1155',
  'piggybank',
  'failing',
  'multisig',
  'entrypoint',
  'simpleAccountFactory',
  'verifyingPaymaster',
] as const;

export type SmartContractName = (typeof SMART_CONTRACT_NAMES)[number];

export const HARDFORKS = [
  'frontier',
  'homestead',
  'dao',
  'tangerine',
  'spuriousDragon',
  'byzantium',
  'constantinople',
  'petersburg',
  'istanbul',
  'muirGlacier',
  'berlin',
  'london',
  'arrowGlacier',
  'grayGlacier',
  'paris',
  'shanghai',
  'prague',
] as const;

export type Hardfork = (typeof HARDFORKS)[number];

export type SeedContractInput = {
  contractName: SmartContractName;
  hardfork?: Hardfork;
  deployerOptions?: {
    fromAddress?: string;
    fromPrivateKey?: string;
  };
};

export type SeedContractsInput = {
  contracts: SmartContractName[];
  hardfork?: Hardfork;
};

export type GetContractAddressInput = {
  contractName: SmartContractName;
};

export type ListDeployedContractsInput = Record<string, never>;

export type SeedContractResult = {
  contractName: string;
  contractAddress: string;
  deployedAt: string;
};

export type SeedContractsResult = {
  deployed: SeedContractResult[];
  failed: { contractName: string; error: string }[];
};

export type GetContractAddressResult = {
  contractName: string;
  contractAddress: string | null;
};

export type ListDeployedContractsResult = {
  contracts: SeedContractResult[];
};
