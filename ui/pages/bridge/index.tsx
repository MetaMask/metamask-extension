// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useHistory } from 'react-router-dom';

import { getSelectedNetworkClientId } from '../../../shared/modules/selectors/networks';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../components/component-library';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../components/multichain/pages/page';
import { I18nContext } from '../../contexts/i18n';
import { resetBridgeState } from '../../ducks/bridge/actions';
import { clearSwapsState } from '../../ducks/swaps/swaps';
import { TextVariant } from '../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  AWAITING_SIGNATURES_ROUTE,
} from '../../helpers/constants/routes';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import FeatureToggledRoute from '../../helpers/higher-order-components/feature-toggled-route';
import { useBridgeExchangeRates } from '../../hooks/bridge/useBridgeExchangeRates';
import useBridging from '../../hooks/bridge/useBridging';
import { useQuoteFetchEvents } from '../../hooks/bridge/useQuoteFetchEvents';
import { useGasFeeEstimates } from '../../hooks/useGasFeeEstimates';
import { getIsBridgeEnabled } from '../../selectors';
import { resetBackgroundSwapsState } from '../../store/actions';
import { useSwapsFeatureFlags } from '../swaps/hooks/useSwapsFeatureFlags';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import AwaitingSignatures from './awaiting-signatures/awaiting-signatures';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import AwaitingSignaturesCancelButton from './awaiting-signatures/awaiting-signatures-cancel-button';
import { useIsMultichainSwap } from './hooks/useIsMultichainSwap';
import { BridgeTransactionSettingsModal } from './prepare/bridge-transaction-settings-modal';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import PrepareBridgePage from './prepare/prepare-bridge-page';

const CrossChainSwap = () => {
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useContext(I18nContext);

  // Load swaps feature flags so that we can use smart transactions
  useSwapsFeatureFlags();
  useBridging();

  const history = useHistory();
  const dispatch = useDispatch();

  const isBridgeEnabled = useSelector(getIsBridgeEnabled);
  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  const resetControllerAndInputStates = async () => {
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31881
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await dispatch(resetBridgeState());
  };

  useEffect(() => {
    // Reset controller and inputs before unloading the page
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
    window.addEventListener('beforeunload', resetControllerAndInputStates);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
      window.removeEventListener('beforeunload', resetControllerAndInputStates);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
      resetControllerAndInputStates();
    };
  }, []);

  // Needed for refreshing gas estimates
  useGasFeeEstimates(selectedNetworkClientId);
  // Needed for fetching exchange rates for tokens that have not been imported
  useBridgeExchangeRates();
  // Emits events related to quote-fetching
  useQuoteFetchEvents();

  const isSwap = useIsMultichainSwap();

  const redirectToDefaultRoute = async () => {
    history.push({
      pathname: DEFAULT_ROUTE,
      state: { stayOnHomePage: true },
    });
    dispatch(clearSwapsState());
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31881
    // eslint-disable-next-line @typescript-eslint/await-thenable
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
            // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
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
        {isSwap ? t('swap') : t('bridge')}
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
