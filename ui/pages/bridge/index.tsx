import React, { useContext, useEffect, useState } from 'react';
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
import { getSelectedNetworkClientId } from '../../../shared/modules/selectors/networks';
import { getIsBridgeEnabled } from '../../selectors';
import useBridging from '../../hooks/bridge/useBridging';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../components/multichain/pages/page';
import { useSwapsFeatureFlags } from '../swaps/hooks/useSwapsFeatureFlags';
import { resetBridgeState } from '../../ducks/bridge/actions';
import { useGasFeeEstimates } from '../../hooks/useGasFeeEstimates';
import { useBridgeExchangeRates } from '../../hooks/bridge/useBridgeExchangeRates';
import { useQuoteFetchEvents } from '../../hooks/bridge/useQuoteFetchEvents';
import { TextVariant } from '../../helpers/constants/design-system';
import PrepareBridgePage from './prepare/prepare-bridge-page';
import AwaitingSignaturesCancelButton from './awaiting-signatures/awaiting-signatures-cancel-button';
import AwaitingSignatures from './awaiting-signatures/awaiting-signatures';
import { BridgeTransactionSettingsModal } from './prepare/bridge-transaction-settings-modal';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);

  // Load swaps feature flags so that we can use smart transactions
  useSwapsFeatureFlags();
  useBridging();

  const history = useHistory();
  const dispatch = useDispatch();

  const isBridgeEnabled = useSelector(getIsBridgeEnabled);
  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  const resetControllerAndInputStates = async () => {
    await dispatch(resetBridgeState());
  };

  useEffect(() => {
    // Reset controller and inputs before unloading the page
    window.addEventListener('beforeunload', resetControllerAndInputStates);

    return () => {
      window.removeEventListener('beforeunload', resetControllerAndInputStates);
      resetControllerAndInputStates();
    };
  }, []);

  // Needed for refreshing gas estimates
  useGasFeeEstimates(selectedNetworkClientId);
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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <Page className="bridge__container">
      <Header
        textProps={{ variant: TextVariant.headingSm }}
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
            onClick={() => {
              setIsSettingsModalOpen(true);
            }}
          />
        }
      >
        {t('bridge')}
      </Header>
      <Content padding={0}>
        <Switch>
          <FeatureToggledRoute
            redirectRoute={SWAPS_MAINTENANCE_ROUTE}
            flag={isBridgeEnabled}
            path={CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE}
            render={() => {
              return (
                <>
                  <BridgeTransactionSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => {
                      setIsSettingsModalOpen(false);
                    }}
                  />
                  <PrepareBridgePage />
                </>
              );
            }}
          />
          <Route path={CROSS_CHAIN_SWAP_ROUTE + AWAITING_SIGNATURES_ROUTE}>
            <Content>
              <AwaitingSignatures />
            </Content>
            <Footer>
              <AwaitingSignaturesCancelButton />
            </Footer>
          </Route>
        </Switch>
      </Content>
    </Page>
  );
};

export default CrossChainSwap;
