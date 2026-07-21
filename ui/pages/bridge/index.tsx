import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { isNonEvmChainId } from '@metamask/bridge-controller';
import {
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  Text,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import { I18nContext } from '../../contexts/i18n';
import {
  PREPARE_SWAP_ROUTE,
  PREPARE_SWAP_ASSETS_ROUTE,
  AWAITING_SIGNATURES_ROUTE,
} from '../../helpers/constants/routes';
import { toRelativeRoutePath } from '../routes/utils';
import { getSelectedNetworkClientId } from '../../../shared/lib/selectors/networks';
import useBridging from '../../hooks/bridge/useBridging';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../components/multichain/pages/page';
import { useGasFeeEstimates } from '../../hooks/useGasFeeEstimates';
import { useBridgeExchangeRates } from '../../hooks/bridge/useBridgeExchangeRates';
import { useQuoteFetchEvents } from '../../hooks/bridge/useQuoteFetchEvents';
import { TextVariant } from '../../helpers/constants/design-system';
import { useTxAlerts } from '../../hooks/bridge/useTxAlerts';
import { useBottomNavBar } from '../../hooks/useBottomNavBar';
import { getFromChain } from '../../ducks/bridge/selectors';
import { useBridgeNavigation } from '../../hooks/bridge/useBridgeNavigation';
import { usePrefillFromSearchQuery } from '../../hooks/bridge/usePrefillFromSearchQuery';
import { usePrefillFromBridgeState } from '../../hooks/bridge/usePrefillFromBridgeState';
import { useSmartSlippage } from '../../hooks/bridge/useSmartSlippage';
import { transitionBack } from '../../components/ui/transition';
import { useInitialBridgeTokens } from '../../hooks/bridge/useInitialBridgeTokens';
import PrepareBridgePage from './prepare/prepare-bridge-page';
import BridgeAssetPickerPage from './prepare/bridge-asset-picker-page';
import AwaitingSignaturesCancelButton from './awaiting-signatures/awaiting-signatures-cancel-button';
import AwaitingSignatures from './awaiting-signatures/awaiting-signatures';
import { BridgeTransactionSettingsModal } from './prepare/bridge-transaction-settings-modal';
import { useRefreshSmartTransactionsLiveness } from './hooks/useRefreshSmartTransactionsLiveness';
import { clearAllBridgeCacheItems } from './utils/cache';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);

  useBridging();

  const { navigateToDefaultRoute } = useBridgeNavigation();
  // Pre-fill the src chain balances, slippage and other quote params before rendering the bridge page
  // This also resets any search query parameters and navigation states
  usePrefillFromSearchQuery();
  usePrefillFromBridgeState();
  useSmartSlippage();

  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  // Get chain information to determine if we need gas estimates
  const fromChain = useSelector(getFromChain);

  // Refresh smart transactions liveness for the source chain
  useRefreshSmartTransactionsLiveness(fromChain?.chainId);

  // Only fetch gas estimates if the source chain is EVM (not Solana, Bitcoin, or Tron)
  const shouldFetchGasEstimates =
    fromChain?.chainId && !isNonEvmChainId(fromChain.chainId);

  // Needed for refreshing gas estimates (only for EVM chains)
  useGasFeeEstimates(selectedNetworkClientId, shouldFetchGasEstimates);
  // Needed for fetching exchange rates for tokens that have not been imported
  useBridgeExchangeRates();
  // Emits events related to quote-fetching
  useQuoteFetchEvents();
  // Sets tx alerts for the active quote
  useTxAlerts();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Pre-fetch the popular tokens list
  const { fetchTokens } = useInitialBridgeTokens();
  useEffect(() => {
    fetchTokens();
    return () => {
      clearAllBridgeCacheItems();
    };
  }, [fetchTokens]);

  const showBottomBar = useBottomNavBar();

  const handleBack = () => {
    transitionBack(() => navigateToDefaultRoute());
  };

  const swapHeader = showBottomBar ? (
    <div className="flex items-center justify-between p-4 gap-4">
      <Text variant={DsTextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
        {t('swap')}
      </Text>
      <ButtonIcon
        iconName={IconName.Setting}
        size={ButtonIconSize.Md}
        ariaLabel={t('settings')}
        data-testid="bridge__header-settings-button"
        onClick={() => {
          setIsSettingsModalOpen(true);
        }}
      />
    </div>
  ) : (
    <Header
      textProps={{ variant: TextVariant.headingSm }}
      startAccessory={
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleBack}
        />
      }
      endAccessory={
        <ButtonIcon
          iconName={IconName.Setting}
          size={ButtonIconSize.Md}
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
  );

  return (
    <Routes>
      {/*
       * Behind the network management feature flag, token selection is shown on
       * its own page instead of inside the prepare-bridge modal. It renders its
       * own page shell, so it lives outside the shared swap header.
       */}
      <Route
        path={toRelativeRoutePath(PREPARE_SWAP_ASSETS_ROUTE)}
        element={<BridgeAssetPickerPage />}
      />
      <Route
        path={toRelativeRoutePath(PREPARE_SWAP_ROUTE)}
        element={
          <Page className="bridge__container">
            {swapHeader}
            <Content padding={0}>
              <BridgeTransactionSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => {
                  setIsSettingsModalOpen(false);
                }}
              />
              <PrepareBridgePage
                onOpenSettings={() => setIsSettingsModalOpen(true)}
              />
            </Content>
          </Page>
        }
      />
      <Route
        path={toRelativeRoutePath(AWAITING_SIGNATURES_ROUTE)}
        element={
          <Page className="bridge__container">
            {swapHeader}
            <Content padding={0}>
              <Content>
                <AwaitingSignatures />
              </Content>
              <Footer>
                <AwaitingSignaturesCancelButton />
              </Footer>
            </Content>
          </Page>
        }
      />
    </Routes>
  );
};

export default CrossChainSwap;
