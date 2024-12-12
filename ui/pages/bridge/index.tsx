import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useHistory } from 'react-router-dom';
import { I18nContext } from '../../contexts/i18n';
import { clearSwapsState } from '../../ducks/swaps/swaps';
import {
  DEFAULT_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  AWAITING_SIGNATURES_ROUTE,
} from '../../helpers/constants/routes';
import { resetBackgroundSwapsState } from '../../store/actions';
import FeatureToggledRoute from '../../helpers/higher-order-components/feature-toggled-route';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../components/component-library';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';
import {
  getCurrentCurrency,
  getIsBridgeChain,
  getIsBridgeEnabled,
} from '../../selectors';
import useBridging from '../../hooks/bridge/useBridging';
import {
  Content,
  Footer,
  Header,
} from '../../components/multichain/pages/page';
import { useSwapsFeatureFlags } from '../swaps/hooks/useSwapsFeatureFlags';
import { resetBridgeState, setFromChain } from '../../ducks/bridge/actions';
import { useGasFeeEstimates } from '../../hooks/useGasFeeEstimates';
import { useBridgeExchangeRates } from '../../hooks/bridge/useBridgeExchangeRates';
import { useQuoteFetchEvents } from '../../hooks/bridge/useQuoteFetchEvents';
import PrepareBridgePage from './prepare/prepare-bridge-page';
import { BridgeCTAButton } from './prepare/bridge-cta-button';
import AwaitingSignaturesCancelButton from './awaiting-signatures/awaiting-signatures-cancel-button';
import AwaitingSignatures from './awaiting-signatures/awaiting-signatures';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);

  // Load swaps feature flags so that we can use smart transactions
  useSwapsFeatureFlags();
  useBridging();

  const history = useHistory();
  const dispatch = useDispatch();

  const isBridgeEnabled = useSelector(getIsBridgeEnabled);
  const providerConfig = useSelector(getProviderConfig);
  const isBridgeChain = useSelector(getIsBridgeChain);
  const currency = useSelector(getCurrentCurrency);

  useEffect(() => {
    if (isBridgeChain && isBridgeEnabled && providerConfig) {
      dispatch(setFromChain(providerConfig.chainId));
    }
  }, [isBridgeChain, isBridgeEnabled, providerConfig, currency]);

  const resetControllerAndInputStates = async () => {
    await dispatch(resetBridgeState());
  };

  useEffect(() => {
    // Reset controller and inputs before unloading the page
    resetControllerAndInputStates();

    window.addEventListener('beforeunload', resetControllerAndInputStates);

    return () => {
      window.removeEventListener('beforeunload', resetControllerAndInputStates);
      resetControllerAndInputStates();
    };
  }, []);

  // Needed for refreshing gas estimates
  useGasFeeEstimates(providerConfig?.id);
  // Needed for fetching exchange rates for tokens that have not been imported
  useBridgeExchangeRates();
  // Emits events related to quote-fetching
  useQuoteFetchEvents();

  const redirectToDefaultRoute = async () => {
    history.push({
      pathname: DEFAULT_ROUTE,
      state: { stayOnHomePage: true },
    });
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
    await resetControllerAndInputStates();
  };

  return (
    <div className="bridge">
      <div className="bridge__container">
        <Switch>
          <FeatureToggledRoute
            redirectRoute={SWAPS_MAINTENANCE_ROUTE}
            flag={isBridgeEnabled}
            path={CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE}
          >
            <>
              <Header
                className="bridge__header"
                startAccessory={
                  <ButtonIcon
                    iconName={IconName.ArrowLeft}
                    size={ButtonIconSize.Sm}
                    ariaLabel={t('back')}
                    onClick={redirectToDefaultRoute}
                  />
                }
                endAccessory={
                  <ButtonIcon
                    iconName={IconName.Setting}
                    size={ButtonIconSize.Sm}
                    ariaLabel={t('settings')}
                  />
                }
              >
                {t('bridge')}
              </Header>
              <Content>
                <PrepareBridgePage />
              </Content>
              <Footer>
                <BridgeCTAButton />
              </Footer>
            </>
          </FeatureToggledRoute>

          <Route path={CROSS_CHAIN_SWAP_ROUTE + AWAITING_SIGNATURES_ROUTE}>
            <Content>
              <AwaitingSignatures />
            </Content>
            <Footer>
              <AwaitingSignaturesCancelButton />
            </Footer>
          </Route>
        </Switch>
      </div>
    </div>
  );
};

export default CrossChainSwap;
