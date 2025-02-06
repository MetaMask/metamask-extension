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
import { addImportedTokens } from '../../../../store/actions';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

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

  // Add detected tokens to sate
  useEffect(() => {
    importAllDetectedTokens(
      useTokenDetection,
      isOnCurrentNetwork,
      detectedTokensMultichain,
      allNetworks,
      networkClientId,
      addImportedTokens,
      currentChainId,
      trackEvent,
      detectedTokens,
      dispatch,
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
