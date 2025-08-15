import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useNavigate } from 'react-router-dom-v5-compat';
import {
  BridgeAppState,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { I18nContext } from '../../contexts/i18n';
import { clearSwapsState } from '../../ducks/swaps/swaps';
import {
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  AWAITING_SIGNATURES_ROUTE,
} from '../../helpers/constants/routes';
import { resetBackgroundSwapsState } from '../../store/actions';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../components/component-library';
import { getSelectedNetworkClientId } from '../../../shared/modules/selectors/networks';
import { getMultichainCurrentChainId } from '../../selectors/multichain';
import useBridging from '../../hooks/bridge/useBridging';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../components/multichain/pages/page';
import { useSwapsFeatureFlags } from '../swaps/hooks/useSwapsFeatureFlags';
import {
  resetBridgeState,
  trackUnifiedSwapBridgeEvent,
} from '../../ducks/bridge/actions';
import { useGasFeeEstimates } from '../../hooks/useGasFeeEstimates';
import { useBridgeExchangeRates } from '../../hooks/bridge/useBridgeExchangeRates';
import { useQuoteFetchEvents } from '../../hooks/bridge/useQuoteFetchEvents';
import { TextVariant } from '../../helpers/constants/design-system';
import { useTxAlerts } from '../../hooks/bridge/useTxAlerts';
import { getIsUnifiedUIEnabled } from '../../ducks/bridge/selectors';
import PrepareBridgePage from './prepare/prepare-bridge-page';
import AwaitingSignaturesCancelButton from './awaiting-signatures/awaiting-signatures-cancel-button';
import AwaitingSignatures from './awaiting-signatures/awaiting-signatures';
import { BridgeTransactionSettingsModal } from './prepare/bridge-transaction-settings-modal';
import { useIsMultichainSwap } from './hooks/useIsMultichainSwap';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);

  // Load swaps feature flags so that we can use smart transactions
  useSwapsFeatureFlags();
  useBridging();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  const resetControllerAndInputStates = async () => {
    await dispatch(resetBridgeState());
  };

  const isSwap = useIsMultichainSwap();
  const chainId = useSelector(getMultichainCurrentChainId);
  const isUnifiedUIEnabled = useSelector((state: BridgeAppState) =>
    getIsUnifiedUIEnabled(state, chainId),
  );

  useEffect(() => {
    dispatch(
      trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.PageViewed, {}),
    );
    // Reset controller and inputs before unloading the page
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    window.addEventListener('beforeunload', resetControllerAndInputStates);
    return () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
  // Sets tx alerts for the active quote
  useTxAlerts();

  const redirectToDefaultRoute = async () => {
    await resetControllerAndInputStates();
    navigate(DEFAULT_ROUTE, {
      state: { stayOnHomePage: true },
    });
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
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
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
        {isSwap || isUnifiedUIEnabled ? t('swap') : t('bridge')}
      </Header>
      <Content padding={0}>
        <Routes>
          <Route
            path={`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`}
            element={
              <>
                <BridgeTransactionSettingsModal
                  isOpen={isSettingsModalOpen}
                  onClose={() => {
                    setIsSettingsModalOpen(false);
                  }}
                />
                <PrepareBridgePage
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                />
              </>
            }
          />
          <Route
            path={`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`}
            element={
              <>
                <Content>
                  <AwaitingSignatures />
                </Content>
                <Footer>
                  <AwaitingSignaturesCancelButton />
                </Footer>
              </>
            }
          />
        </Routes>
      </Content>
    </Page>
  );
};

export default CrossChainSwap;
