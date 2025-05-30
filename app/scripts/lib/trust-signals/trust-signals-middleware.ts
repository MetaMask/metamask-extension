import { JsonRpcParams, JsonRpcResponse } from '@metamask/utils';
import { NetworkController } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import type { AppStateController } from '../../controllers/app-state-controller';
import { scanAddress } from './security-alerts-api';
import { SupportedEVMChain } from './types';

type TransactionParams = {
  to: string;
  chainId: string;
  [key: string]: unknown;
};

function isEthSendTransaction(req: JsonRpcParams): boolean {
  return 'method' in req && req.method === 'eth_sendTransaction';
}

function hasValidTransactionParams(req: JsonRpcParams): req is JsonRpcParams & {
  params: [TransactionParams, ...unknown[]];
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

export function createTrustSignalsMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
) {
  return async (
    req: JsonRpcParams,
    _res: JsonRpcResponse,
    next: () => void,
  ) => {
    try {
      if (isEthSendTransaction(req) && hasValidTransactionParams(req)) {
        const { to } = req.params[0] as TransactionParams;

        const cachedResponse =
          appStateController.getAddressSecurityAlertResponse(to);
        if (cachedResponse) {
          return;
        }

        const chainId = getChainId(networkController);
        const result = await scanAddress(chainId as SupportedEVMChain, to);
        appStateController.addAddressSecurityAlertResponse(to, result);
      }
    } catch (error) {
      console.error('[createTrustSignalsMiddleware] error', error);
    } finally {
      next();
    }
  };
}

function getChainId(networkController: NetworkController): SupportedEVMChain {
  const chainId = getProviderConfig({
    metamask: networkController.state,
  })?.chainId;
  if (!chainId) {
    throw new Error('Chain ID not found');
  }
  return mapChainIdToSupportedEVMChain(chainId);
}

function mapChainIdToSupportedEVMChain(chainId: string): SupportedEVMChain {
  const chainIdMap: Record<string, SupportedEVMChain> = {
    [CHAIN_IDS.ARBITRUM]: SupportedEVMChain.Arbitrum,
    [CHAIN_IDS.AVALANCHE]: SupportedEVMChain.Avalanche,
    [CHAIN_IDS.BASE]: SupportedEVMChain.Base,
    [CHAIN_IDS.BASE_SEPOLIA]: SupportedEVMChain.BaseSepolia,
    [CHAIN_IDS.BSC]: SupportedEVMChain.Bsc,
    [CHAIN_IDS.MAINNET]: SupportedEVMChain.Ethereum,
    [CHAIN_IDS.OPTIMISM]: SupportedEVMChain.Optimism,
    [CHAIN_IDS.POLYGON]: SupportedEVMChain.Polygon,
    [CHAIN_IDS.ZKSYNC_ERA]: SupportedEVMChain.Zksync,
    [CHAIN_IDS.ZK_SYNC_ERA_TESTNET]: SupportedEVMChain.ZksyncSepolia,
    '0x76adf1': SupportedEVMChain.Zora,
    [CHAIN_IDS.LINEA_MAINNET]: SupportedEVMChain.Linea,
    [CHAIN_IDS.BLAST]: SupportedEVMChain.Blast,
    [CHAIN_IDS.SCROLL]: SupportedEVMChain.Scroll,
    [CHAIN_IDS.SEPOLIA]: SupportedEVMChain.EthereumSepolia,
    '0x27bc86aa': SupportedEVMChain.Degen,
    [CHAIN_IDS.AVALANCHE_TESTNET]: SupportedEVMChain.AvalancheFuji,
    '0x343b': SupportedEVMChain.ImmutableZkevm,
    '0x34a1': SupportedEVMChain.ImmutableZkevmTestnet,
    [CHAIN_IDS.GNOSIS]: SupportedEVMChain.Gnosis,
    '0x1e0': SupportedEVMChain.Worldchain,
    '0x79a': SupportedEVMChain.SoneiumMinato,
    '0x7e4': SupportedEVMChain.Ronin,
    [CHAIN_IDS.APE_MAINNET]: SupportedEVMChain.Apec,
    '0x849ea': SupportedEVMChain.ZeroNetwork,
    [CHAIN_IDS.BERACHAIN]: SupportedEVMChain.Berachain,
    '0x138c5': SupportedEVMChain.BerachainBartio,
    [CHAIN_IDS.INK]: SupportedEVMChain.Ink,
    [CHAIN_IDS.INK_SEPOLIA]: SupportedEVMChain.InkSepolia,
    '0xab5': SupportedEVMChain.Abstract,
    '0x2b74': SupportedEVMChain.AbstractTestnet,
    '0x74c': SupportedEVMChain.Soneium,
    [CHAIN_IDS.UNICHAIN]: SupportedEVMChain.Unichain,
    [CHAIN_IDS.SEI]: SupportedEVMChain.Sei,
    [CHAIN_IDS.FLOW]: SupportedEVMChain.FlowEvm,
  };
  return chainIdMap[chainId.toLowerCase()];
}
