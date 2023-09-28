export enum NameSourceId {
  ENS = 'ens',
  ETHERSCAN = 'etherscan',
  LENS_PROTOCOL = 'lens',
  TOKEN = 'token',
}

export const DEFAULT_NAME_SOURCE_PRIORITY = [
  NameSourceId.ENS,
  NameSourceId.LENS_PROTOCOL,
  NameSourceId.TOKEN,
  NameSourceId.ETHERSCAN,
];
