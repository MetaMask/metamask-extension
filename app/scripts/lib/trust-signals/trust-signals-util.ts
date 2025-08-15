import { NetworkController } from '@metamask/network-controller';
import { JsonRpcRequest } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { PreferencesController } from '../../controllers/preferences-controller';
import { SupportedEVMChain } from './types';

// isSecurityAlertsEnabledByUser is a function that checks if the security alerts are enabled in the preferences controller.
export function isSecurityAlertsEnabledByUser(
  preferencesController: PreferencesController,
) {
  const { securityAlertsEnabled } = preferencesController.state;
  return securityAlertsEnabled;
}

export function isEthSendTransaction(req: JsonRpcRequest): boolean {
  return req.method === MESSAGE_TYPE.ETH_SEND_TRANSACTION;
}

export function hasValidTransactionParams(
  req: JsonRpcRequest,
): req is JsonRpcRequest & {
  params: [
    {
      to: string;
      chainId: string;
      [key: string]: unknown;
    },
    ...unknown[],
  ];
} {
  if (!('params' in req) || !req.params) {
    return false;
  }

  if (!Array.isArray(req.params) || req.params.length === 0) {
    return false;
  }

  const firstParam = req.params[0];

  return (
    typeof firstParam === 'object' && firstParam !== null && 'to' in firstParam
  );
}

export function isEthSignTypedData(req: JsonRpcRequest): boolean {
  return (
    req.method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA ||
    req.method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1 ||
    req.method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 ||
    req.method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4
  );
}

export function isConnected(
  req: JsonRpcRequest & { origin?: string },
  getPermittedAccounts: (origin: string) => string[],
): boolean {
  if (!req.origin || req.method !== MESSAGE_TYPE.ETH_ACCOUNTS) {
    return false;
  }
  const permittedAccounts = getPermittedAccounts(req.origin);
  return Array.isArray(permittedAccounts) && permittedAccounts.length > 0;
}

export function connectScreenHasBeenPrompted(req: JsonRpcRequest): boolean {
  return (
    req.method === MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS ||
    req.method === MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS
  );
}

export function hasValidTypedDataParams(
  req: JsonRpcRequest,
): req is JsonRpcRequest & {
  params: [unknown, string | object];
} {
  if (!('params' in req) || !req.params) {
    return false;
  }

  if (!Array.isArray(req.params) || req.params.length < 2) {
    return false;
  }

  return req.params[1] !== undefined && req.params[1] !== null;
}

export function getChainId(
  networkController: NetworkController,
): SupportedEVMChain | undefined {
  const chainId = getProviderConfig({
    metamask: networkController.state,
  })?.chainId;
  if (!chainId) {
    throw new Error('Chain ID not found');
  }
  return mapChainIdToSupportedEVMChain(chainId);
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
