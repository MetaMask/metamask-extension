import {
  NetworkClientId,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { Token } from '../types';

export const importAllDetectedTokens = async (
  isOnCurrentNetwork: boolean,
  detectedTokensMultichain: {
    [key: string]: Token[];
  },
  allNetworks: Record<string, NetworkConfiguration>,
  networkClientId: NetworkClientId,
  currentChainId: string,
  detectedTokens: Token[],
  addImportedTokens: (tokens: Token[], networkClientId: string) => void,
  trackTokenAddedEvent: (importedToken: Token, chainId: string) => void,
) => {
  // TODO add event for MetaMetricsEventName.TokenAdded
  if (!isOnCurrentNetwork) {
    const importPromises = Object.entries(detectedTokensMultichain).map(
      async ([networkId, tokens]) => {
        const chainConfig = allNetworks[networkId];
        if (!chainConfig) {
          return;
        }
        const { defaultRpcEndpointIndex } = chainConfig;
        const { networkClientId: networkInstanceId } =
          chainConfig.rpcEndpoints[defaultRpcEndpointIndex];

        await addImportedTokens(tokens as Token[], networkInstanceId);

        tokens.forEach((importedToken) => {
          // when multichain is fully integrated, we should change these event signatures for analytics
          trackTokenAddedEvent(importedToken, chainConfig.chainId);
        });
      },
    );

    await Promise.all(importPromises);
  } else if (detectedTokens.length > 0) {
    await addImportedTokens(detectedTokens, networkClientId);

    detectedTokens.forEach((importedToken: Token) => {
      // when multichain is fully integrated, we should change these event signatures for analytics
      trackTokenAddedEvent(importedToken, currentChainId);
    });
  }
};
