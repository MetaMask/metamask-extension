import { useEffect, useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { fetchBridgeFeatureFlags } from '../../pages/bridge/bridge.util';
import { setBridgeFeatureFlags } from '../../store/actions';
import {
  getCurrentChainId,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getCurrentKeyring,
  getIsBridgeChain,
  getIsBridgeEnabled,
  getMetaMetricsId,
  SwapsEthToken,
  ///: END:ONLY_INCLUDE_IF
} from '../../selectors';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../helpers/constants/routes';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { isHardwareKeyring } from '../../helpers/utils/hardware';
import { getPortfolioUrl } from '../../helpers/utils/portfolio';
import { setSwapsFromToken } from '../../ducks/swaps/swaps';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
///: END:ONLY_INCLUDE_IF

const useBridging = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const chainId = useSelector(getCurrentChainId);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring.type);

  const isBridgeSupported = useSelector(getIsBridgeEnabled);
  const isBridgeChain = useSelector(getIsBridgeChain);

  useEffect(() => {
    fetchBridgeFeatureFlags().then((bridgeFeatureFlags) => {
      dispatch(setBridgeFeatureFlags(bridgeFeatureFlags));
    });
  }, [dispatch, setBridgeFeatureFlags]);

  const openBridgeExperience = useCallback(
    (
      location: string,
      token: SwapsTokenObject | SwapsEthToken,
      portfolioUrlSuffix?: string,
    ) => {
      if (!isBridgeChain) {
        return;
      }
      if (isBridgeSupported) {
        trackEvent({
          event: MetaMetricsEventName.BridgeLinkClicked,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            token_symbol: token.symbol,
            location,
            text: 'Bridge',
            chain_id: chainId,
          },
        });
        dispatch(
          setSwapsFromToken({ ...token, address: token.address.toLowerCase() }),
        );
        if (usingHardwareWallet && global.platform.openExtensionInBrowser) {
          global.platform.openExtensionInBrowser(
            PREPARE_SWAP_ROUTE,
            null,
            false,
          );
        } else {
          history.push(CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE);
        }
      } else {
        const portfolioUrl = getPortfolioUrl(
          'bridge',
          'ext_bridge_button',
          metaMetricsId,
        );
        global.platform.openTab({
          url: `${portfolioUrl}${
            portfolioUrlSuffix ?? `&token=${token.address}`
          }`,
        });
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.BridgeLinkClicked,
          properties: {
            location,
            text: 'Bridge',
            url: portfolioUrl,
            chain_id: chainId,
            token_symbol: token.symbol,
          },
        });
      }
    },
    [
      isBridgeSupported,
      isBridgeChain,
      chainId,
      setSwapsFromToken,
      dispatch,
      usingHardwareWallet,
      history,
      metaMetricsId,
      trackEvent,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
