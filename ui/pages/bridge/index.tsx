import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom-v5-compat';
import {
  UnifiedSwapBridgeEventName,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { I18nContext } from '../../contexts/i18n';
import { clearSwapsState } from '../../ducks/swaps/swaps';
import {
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  AWAITING_SIGNATURES_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import { resetBackgroundSwapsState } from '../../store/actions';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../components/component-library';
import { getSelectedNetworkClientId } from '../../../shared/modules/selectors/networks';
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
  restoreQuoteRequestFromState,
  trackUnifiedSwapBridgeEvent,
} from '../../ducks/bridge/actions';
import { useGasFeeEstimates } from '../../hooks/useGasFeeEstimates';
import { useBridgeExchangeRates } from '../../hooks/bridge/useBridgeExchangeRates';
import { useQuoteFetchEvents } from '../../hooks/bridge/useQuoteFetchEvents';
import { TextVariant } from '../../helpers/constants/design-system';
import { useTxAlerts } from '../../hooks/bridge/useTxAlerts';
import { getFromChain, getBridgeQuotes } from '../../ducks/bridge/selectors';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import PrepareBridgePage from './prepare/prepare-bridge-page';
import AwaitingSignaturesCancelButton from './awaiting-signatures/awaiting-signatures-cancel-button';
import AwaitingSignatures from './awaiting-signatures/awaiting-signatures';
import { BridgeTransactionSettingsModal } from './prepare/bridge-transaction-settings-modal';

type CrossChainSwapProps = {
  location?: {
    search?: string;
  };
};

const CrossChainSwap = ({ location }: CrossChainSwapProps) => {
  const t = useContext(I18nContext);

  // Load swaps feature flags so that we can use smart transactions
  useSwapsFeatureFlags();
  useBridging();

  const { navigate } = useSafeNavigation();
  const dispatch = useDispatch();

  const { search } = location ?? {};

  const isFromTransactionShield = new URLSearchParams(search || '').get(
    'isFromTransactionShield',
  );

  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  const resetControllerAndInputStates = async () => {
    await dispatch(resetBridgeState());
  };

  const { activeQuote } = useSelector(getBridgeQuotes);

  // Get chain information to determine if we need gas estimates
  const fromChain = useSelector(getFromChain);

  // Only fetch gas estimates if the source chain is EVM (not Solana, Bitcoin, or Tron)
  const shouldFetchGasEstimates =
    fromChain?.chainId && !isNonEvmChainId(fromChain.chainId);

  useEffect(() => {
    dispatch(
      trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.PageViewed, {}),
    );

    if (activeQuote) {
      dispatch(restoreQuoteRequestFromState(activeQuote.quote));
    }

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

  // Needed for refreshing gas estimates (only for EVM chains)
  useGasFeeEstimates(selectedNetworkClientId, shouldFetchGasEstimates);
  // Needed for fetching exchange rates for tokens that have not been imported
  useBridgeExchangeRates();
  // Emits events related to quote-fetching
  useQuoteFetchEvents();
  // Sets tx alerts for the active quote
  useTxAlerts();

  const redirectToDefaultRoute = async () => {
    await resetControllerAndInputStates();
    if (isFromTransactionShield) {
      navigate(TRANSACTION_SHIELD_ROUTE);
    } else {
      navigate(DEFAULT_ROUTE, { state: { stayOnHomePage: true } });
    }
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
            data-testid="bridge__header-settings-button"
            onClick={() => {
              setIsSettingsModalOpen(true);
            }}
          />
        }
      >
        {t('swap')}
      </Header>
      <Content padding={0}>
        <Routes>
          <Route
            path={CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE}
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
            path={CROSS_CHAIN_SWAP_ROUTE + AWAITING_SIGNATURES_ROUTE}
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
