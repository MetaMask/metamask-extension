import { useDispatch, useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import { Numeric } from '../../../../shared/modules/Numeric';
import { QuoteResponse } from '../types';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import { addToken, addNetwork } from '../../../store/actions';
import {
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
} from '../../../../shared/modules/selectors/networks';

export default function useAddToken() {
  const dispatch = useDispatch();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const sourceNetworkClientId = useSelector(getSelectedNetworkClientId);

  const addSourceToken = (quoteResponse: QuoteResponse) => {
    const {
      address,
      decimals,
      symbol,
      icon: image,
    } = quoteResponse.quote.srcAsset;
    dispatch(
      addToken({
        address,
        decimals,
        symbol,
        image,
        networkClientId: sourceNetworkClientId,
      }),
    );
  };

  const addDestToken = async (quoteResponse: QuoteResponse) => {
    // Look up the destination chain
    const hexDestChainId = new Numeric(quoteResponse.quote.destChainId, 10)
      .toPrefixedHexString()
      .toLowerCase() as `0x${string}`;
    const foundDestNetworkConfig: NetworkConfiguration | undefined =
      networkConfigurations[hexDestChainId];
    let addedDestNetworkConfig: NetworkConfiguration | undefined;

    // If user has not added the network in MetaMask, add it for them silently
    if (!foundDestNetworkConfig) {
      const featuredRpc = FEATURED_RPCS.find(
        (rpc) => rpc.chainId === hexDestChainId,
      );
      if (!featuredRpc) {
        throw new Error('No featured RPC found');
      }
      addedDestNetworkConfig = (await dispatch(
        addNetwork(featuredRpc),
      )) as unknown as NetworkConfiguration;
    }

    const destNetworkConfig = foundDestNetworkConfig || addedDestNetworkConfig;
    if (!destNetworkConfig) {
      throw new Error('No destination network configuration found');
    }

    // Add the token after network is guaranteed to exist
    const rpcEndpointIndex = destNetworkConfig.defaultRpcEndpointIndex;
    const destNetworkClientId =
      destNetworkConfig.rpcEndpoints[rpcEndpointIndex].networkClientId;
    const {
      address,
      decimals,
      symbol,
      icon: image,
    } = quoteResponse.quote.destAsset;
    await dispatch(
      addToken({
        address,
        decimals,
        symbol,
        image,
        networkClientId: destNetworkClientId,
      }),
    );
  };

  return { addSourceToken, addDestToken };
}
