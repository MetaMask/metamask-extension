import { CHAIN_IDS } from '../constants/network';

// Security Alerts API supported chains sorted alphabetically
export enum SupportedEVMChain {
  Abstract = 'abstract',
  AbstractTestnet = 'abstract-testnet',
  ApeChain = 'apechain',
  Arbitrum = 'arbitrum',
  Avalanche = 'avalanche',
  AvalancheFuji = 'avalanche-fuji',
  Base = 'base',
  BaseSepolia = 'base-sepolia',
  Berachain = 'berachain',
  BerachainBartio = 'berachain-bartio',
  Blast = 'blast',
  Bsc = 'bsc',
  Degen = 'degen',
  Ethereum = 'ethereum',
  EthereumSepolia = 'ethereum-sepolia',
  FlowEvm = 'flow-evm',
  Gnosis = 'gnosis',
  ImmutableZkevm = 'immutable-zkevm',
  ImmutableZkevmTestnet = 'immutable-zkevm-testnet',
  Ink = 'ink',
  InkSepolia = 'ink-sepolia',
  Linea = 'linea',
  Optimism = 'optimism',
  Polygon = 'polygon',
  Ronin = 'ronin',
  Scroll = 'scroll',
  Sei = 'sei',
  Soneium = 'soneium',
  SoneiumMinato = 'soneium-minato',
  Unichain = 'unichain',
  Worldchain = 'worldchain',
  ZeroNetwork = 'zero-network',
  Zksync = 'zksync',
  ZksyncSepolia = 'zksync-sepolia',
  Zora = 'zora',
}

const CHAIN_IDS_LOWERCASED: Record<string, SupportedEVMChain> = {
  [CHAIN_IDS.ARBITRUM.toLowerCase()]: SupportedEVMChain.Arbitrum,
  [CHAIN_IDS.AVALANCHE.toLowerCase()]: SupportedEVMChain.Avalanche,
  [CHAIN_IDS.BASE.toLowerCase()]: SupportedEVMChain.Base,
  [CHAIN_IDS.BASE_SEPOLIA.toLowerCase()]: SupportedEVMChain.BaseSepolia,
  [CHAIN_IDS.BSC.toLowerCase()]: SupportedEVMChain.Bsc,
  [CHAIN_IDS.MAINNET.toLowerCase()]: SupportedEVMChain.Ethereum,
  [CHAIN_IDS.OPTIMISM.toLowerCase()]: SupportedEVMChain.Optimism,
  [CHAIN_IDS.POLYGON.toLowerCase()]: SupportedEVMChain.Polygon,
  [CHAIN_IDS.ZKSYNC_ERA.toLowerCase()]: SupportedEVMChain.Zksync,
  [CHAIN_IDS.ZK_SYNC_ERA_TESTNET.toLowerCase()]:
    SupportedEVMChain.ZksyncSepolia,
  '0x76adf1': SupportedEVMChain.Zora,
  [CHAIN_IDS.LINEA_MAINNET.toLowerCase()]: SupportedEVMChain.Linea,
  [CHAIN_IDS.BLAST.toLowerCase()]: SupportedEVMChain.Blast,
  [CHAIN_IDS.SCROLL.toLowerCase()]: SupportedEVMChain.Scroll,
  [CHAIN_IDS.SEPOLIA.toLowerCase()]: SupportedEVMChain.EthereumSepolia,
  '0x27bc86aa': SupportedEVMChain.Degen,
  [CHAIN_IDS.AVALANCHE_TESTNET.toLowerCase()]: SupportedEVMChain.AvalancheFuji,
  '0x343b': SupportedEVMChain.ImmutableZkevm,
  '0x34a1': SupportedEVMChain.ImmutableZkevmTestnet,
  [CHAIN_IDS.GNOSIS.toLowerCase()]: SupportedEVMChain.Gnosis,
  '0x1e0': SupportedEVMChain.Worldchain,
  '0x79a': SupportedEVMChain.SoneiumMinato,
  '0x7e4': SupportedEVMChain.Ronin,
  [CHAIN_IDS.APECHAIN_MAINNET.toLowerCase()]: SupportedEVMChain.ApeChain,
  '0x849ea': SupportedEVMChain.ZeroNetwork,
  [CHAIN_IDS.BERACHAIN.toLowerCase()]: SupportedEVMChain.Berachain,
  '0x138c5': SupportedEVMChain.BerachainBartio,
  [CHAIN_IDS.INK.toLowerCase()]: SupportedEVMChain.Ink,
  [CHAIN_IDS.INK_SEPOLIA.toLowerCase()]: SupportedEVMChain.InkSepolia,
  '0xab5': SupportedEVMChain.Abstract,
  '0x2b74': SupportedEVMChain.AbstractTestnet,
  '0x74c': SupportedEVMChain.Soneium,
  [CHAIN_IDS.UNICHAIN.toLowerCase()]: SupportedEVMChain.Unichain,
  [CHAIN_IDS.SEI.toLowerCase()]: SupportedEVMChain.Sei,
  [CHAIN_IDS.FLOW.toLowerCase()]: SupportedEVMChain.FlowEvm,
};

export function mapChainIdToSupportedEVMChain(
  chainId: string,
): SupportedEVMChain | undefined {
  if (typeof chainId !== 'string' || !chainId) {
    return undefined;
  }

  return CHAIN_IDS_LOWERCASED[chainId.toLowerCase()];
}

export function createCacheKey(chain: SupportedEVMChain, address: string) {
  return `${chain.toLowerCase()}:${address.toLowerCase()}`;
}

export enum ResultType {
  Malicious = 'Malicious',
  Warning = 'Warning',
  Benign = 'Benign',
  Trusted = 'Trusted',
  ErrorResult = 'Error',
  Loading = 'loading',
}

export type ScanAddressRequest = {
  chain: SupportedEVMChain;
  address: string;
};

export type ScanAddressResponse = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: ResultType;
  label: string;
};

export type CachedScanAddressResponse = ScanAddressResponse & {
  timestamp: number;
};

export type GetAddressSecurityAlertResponse = (
  cacheKey: string,
) => ScanAddressResponse | undefined;

export type AddAddressSecurityAlertResponse = (
  cacheKey: string,
  response: ScanAddressResponse,
) => void;
