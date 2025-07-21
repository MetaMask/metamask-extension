import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import { Token } from '../types';
import {
  getAllDetectedTokensForSelectedAddress,
  getDetectedTokensInCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getSelectedAddress,
  getUseTokenDetection,
} from '../../../../selectors';
import { importAllDetectedTokens } from '../util/importAllDetectedTokens';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
} from '../../../../../shared/modules/selectors/networks';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  AssetType,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import { addImportedTokens } from '../../../../store/actions';

const useAssetListTokenDetection = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const detectedTokensMultichain: {
    [key: string]: Token[];
  } = useSelector(getAllDetectedTokensForSelectedAddress);
  const networkClientId = useSelector(getSelectedNetworkClientId);
  const selectedAddress = useSelector(getSelectedAddress);
  const useTokenDetection = useSelector(getUseTokenDetection);
  const currentChainId = useSelector(getCurrentChainId);
  const isOnCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork) || [];
  const allNetworks: Record<`0x${string}`, NetworkConfiguration> = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const multichainDetectedTokensLength = Object.values(
    detectedTokensMultichain || {},
  ).reduce((acc, tokens) => acc + tokens.length, 0);

  const handleAddImportedTokens = async (
    tokens: Token[],
    networkClientIdProp: string,
  ) => {
    await dispatch(addImportedTokens(tokens as Token[], networkClientIdProp));
  };

  const trackTokenAddedEvent = (importedToken: Token, chainId: string) => {
    trackEvent({
      event: MetaMetricsEventName.TokenAdded,
      category: MetaMetricsEventCategory.Wallet,
      sensitiveProperties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: importedToken.symbol,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_contract_address: importedToken.address,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_decimal_precision: importedToken.decimals,
        source: MetaMetricsTokenEventSource.Detected,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_standard: TokenStandard.ERC20,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        asset_type: AssetType.token,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_added_type: 'detected',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
      },
    });
  };

  // Add detected tokens to sate
  useEffect(() => {
    if (!useTokenDetection) {
      return;
    }

    importAllDetectedTokens(
      isOnCurrentNetwork,
      detectedTokensMultichain,
      allNetworks,
      networkClientId,
      currentChainId,
      detectedTokens,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      handleAddImportedTokens,
      trackTokenAddedEvent,
    );
  }, [
    isOnCurrentNetwork,
    selectedAddress,
    networkClientId,
    detectedTokens.length,
    multichainDetectedTokensLength,
  ]);
};

export default useAssetListTokenDetection;
