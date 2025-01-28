import { Hex } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  AssetType,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import { Token } from '../token-list/token-list';
import {
  NetworkClientId,
  NetworkConfiguration,
} from '@metamask/network-controller';

export const importAllDetectedTokens = async (
  useTokenDetection: boolean,
  isOnCurrentNetwork: boolean,
  detectedTokensMultichain: {
    [key: string]: Token[];
  },
  allNetworks: Record<string, NetworkConfiguration>,
  networkClientId: NetworkClientId,
  addImportedTokens: (
    tokensToImport: Token[],
    networkClientId?: NetworkClientId,
  ) => void,
  currentChainId: string,
  trackEvent: any,
  detectedTokens: any,
  dispatch: any,
) => {
  // If autodetect tokens toggle is OFF, return
  if (!useTokenDetection) {
    return;
  }
  // TODO add event for MetaMetricsEventName.TokenAdded

  if (process.env.PORTFOLIO_VIEW && !isOnCurrentNetwork) {
    const importPromises = Object.entries(detectedTokensMultichain).map(
      async ([networkId, tokens]) => {
        const chainConfig = allNetworks[networkId];
        const { defaultRpcEndpointIndex } = chainConfig;
        const { networkClientId: networkInstanceId } =
          chainConfig.rpcEndpoints[defaultRpcEndpointIndex];

        await dispatch(addImportedTokens(tokens as Token[], networkInstanceId));
        tokens.forEach((importedToken) => {
          // when multichain is fully integrated, we should change these event signatures for analytics
          trackEvent({
            event: MetaMetricsEventName.TokenAdded,
            category: MetaMetricsEventCategory.Wallet,
            sensitiveProperties: {
              token_symbol: importedToken.symbol,
              token_contract_address: importedToken.address,
              token_decimal_precision: importedToken.decimals,
              source: MetaMetricsTokenEventSource.Detected,
              token_standard: TokenStandard.ERC20,
              asset_type: AssetType.token,
              token_added_type: 'detected',
              chain_id: chainConfig.chainId,
            },
          });
        });
      },
    );

    await Promise.all(importPromises);
  } else if (detectedTokens.length > 0) {
    await dispatch(addImportedTokens(detectedTokens, networkClientId));
    detectedTokens.forEach((importedToken: Token) => {
      // when multichain is fully integrated, we should change these event signatures for analytics
      trackEvent({
        event: MetaMetricsEventName.TokenAdded,
        category: MetaMetricsEventCategory.Wallet,
        sensitiveProperties: {
          token_symbol: importedToken.symbol,
          token_contract_address: importedToken.address,
          token_decimal_precision: importedToken.decimals,
          source: MetaMetricsTokenEventSource.Detected,
          token_standard: TokenStandard.ERC20,
          asset_type: AssetType.token,
          token_added_type: 'detected',
          chain_id: currentChainId,
        },
      });
    });
  }
};
