import { useDispatch, useSelector } from 'react-redux';
import { Token } from '../token-list/token-list';
import {
  getAllDetectedTokensForSelectedAddress,
  getDetectedTokensInCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getSelectedAddress,
  getUseTokenDetection,
} from '../../../../selectors';
import { useContext, useEffect, useState } from 'react';
import { importAllDetectedTokens } from '../util/importAllDetectedTokens';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
} from '../../../../../shared/modules/selectors/networks';
import { NetworkConfiguration } from '@metamask/network-controller';
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

  const [showDetectedTokens, setShowDetectedTokens] = useState(false);

  const addImportedTokens = async (
    tokens: Token[],
    networkClientId: string,
  ) => {
    await dispatch(addImportedTokens(tokens as Token[], networkClientId));
  };

  const trackTokenAddedEvent = (importedToken: Token, chainId: string) => {
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
      addImportedTokens,
      trackTokenAddedEvent,
    );
  }, [
    isOnCurrentNetwork,
    selectedAddress,
    networkClientId,
    detectedTokens.length,
    multichainDetectedTokensLength,
  ]);

  return { showDetectedTokens, setShowDetectedTokens };
};

export default useAssetListTokenDetection;
