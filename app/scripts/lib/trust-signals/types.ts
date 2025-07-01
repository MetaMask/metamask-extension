export enum SupportedEVMChain {
  Arbitrum = 'arbitrum',
  Avalanche = 'avalanche',
  Base = 'base',
  BaseSepolia = 'base-sepolia',
  Bsc = 'bsc',
  Ethereum = 'ethereum',
  Optimism = 'optimism',
  Polygon = 'polygon',
  Zksync = 'zksync',
  ZksyncSepolia = 'zksync-sepolia',
  Zora = 'zora',
  Linea = 'linea',
  Blast = 'blast',
  Scroll = 'scroll',
  EthereumSepolia = 'ethereum-sepolia',
  Degen = 'degen',
  AvalancheFuji = 'avalanche-fuji',
  ImmutableZkevm = 'immutable-zkevm',
  ImmutableZkevmTestnet = 'immutable-zkevm-testnet',
  Gnosis = 'gnosis',
  Worldchain = 'worldchain',
  SoneiumMinato = 'soneium-minato',
  Ronin = 'ronin',
  ApeChain = 'apechain',
  ZeroNetwork = 'zero-network',
  Berachain = 'berachain',
  BerachainBartio = 'berachain-bartio',
  Ink = 'ink',
  InkSepolia = 'ink-sepolia',
  Abstract = 'abstract',
  AbstractTestnet = 'abstract-testnet',
  Soneium = 'soneium',
  Unichain = 'unichain',
  Sei = 'sei',
  FlowEvm = 'flow-evm',
}

export enum ResultType {
  Malicious = 'Malicious',
  Warning = 'Warning',
  Benign = 'Benign',
  Trusted = 'Trusted',
  ErrorResult = 'Error',
}

export type ScanAddressRequest = {
  chain: SupportedEVMChain;
  address: string;
};

export type ScanAddressResponse = {
  result_type: ResultType;
  label: string;
};
