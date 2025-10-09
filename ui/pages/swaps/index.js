import React, {
  useEffect,
  useRef,
  useContext,
  useState,
  useCallback,
} from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom-v5-compat';
import { shuffle, isEqual } from 'lodash';
import { TransactionStatus } from '@metamask/transaction-controller';
import { I18nContext } from '../../contexts/i18n';
import { useSetNavState } from '../../contexts/navigation-state';

import {
  getSelectedAccount,
  getIsSwapsChain,
  isHardwareWallet,
  getHardwareWalletType,
  getTokenList,
  getHDEntropyIndex,
  getCurrentNetworkTransactions,
} from '../../selectors';
import {
  getCurrentChainId,
  getSelectedNetworkClientId,
} from '../../../shared/modules/selectors/networks';
import {
  getQuotes,
  clearSwapsState,
  getTradeTxId,
  getApproveTxId,
  getFetchingQuotes,
  getFetchParams,
  getAggregatorMetadata,
  getBackgroundSwapRouteState,
  getSwapsErrorKey,
  getSwapsFeatureIsLive,
  prepareToLeaveSwaps,
  fetchSwapsLivenessAndFeatureFlags,
  getReviewSwapClickedTimestamp,
  getCurrentSmartTransactionsEnabled,
  getCurrentSmartTransactionsError,
  setTransactionSettingsOpened,
  getLatestAddedTokenTo,
} from '../../ducks/swaps/swaps';
import {
  getSmartTransactionsEnabled,
  getSmartTransactionsOptInStatusForMetrics,
} from '../../../shared/modules/selectors';
import {
  AWAITING_SIGNATURES_ROUTE,
  AWAITING_SWAP_ROUTE,
  SMART_TRANSACTION_STATUS_ROUTE,
  LOADING_QUOTES_ROUTE,
  SWAPS_ERROR_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
  SWAPS_PATHS,
} from '../../helpers/constants/routes';
import {
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  SWAP_FAILED_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  OFFLINE_FOR_MAINTENANCE,
} from '../../../shared/constants/swaps';

import {
  resetBackgroundSwapsState,
  ignoreTokens,
  setBackgroundSwapRouteState,
  setSwapsErrorKey,
} from '../../store/actions';

import { useGasFeeEstimates } from '../../hooks/useGasFeeEstimates';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getSwapsTokensReceivedFromTxMeta } from '../../../shared/lib/transactions-controller-utils';
import { Icon, IconName, IconSize } from '../../components/component-library';
import Box from '../../components/ui/box';
import {
  DISPLAY,
  JustifyContent,
  IconColor,
  FRACTIONS,
} from '../../helpers/constants/design-system';
import useUpdateSwapsState from './hooks/useUpdateSwapsState';
import AwaitingSignatures from './awaiting-signatures';
import SmartTransactionStatus from './smart-transaction-status';
import AwaitingSwap from './awaiting-swap';
import LoadingQuote from './loading-swaps-quotes';
import PrepareSwapPage from './prepare-swap-page/prepare-swap-page';
import NotificationPage from './notification-page/notification-page';

export default function Swap() {
  const t = useContext(I18nContext);
  const navigate = useNavigate();
  const setNavState = useSetNavState();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);

  const { pathname } = useLocation();
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE;
  const isAwaitingSignaturesRoute = pathname === AWAITING_SIGNATURES_ROUTE;
  const isSwapsErrorRoute = pathname === SWAPS_ERROR_ROUTE;
  const isLoadingQuotesRoute = pathname === LOADING_QUOTES_ROUTE;
  const isSmartTransactionStatusRoute =
    pathname === SMART_TRANSACTION_STATUS_ROUTE;
  const isPrepareSwapRoute = pathname === PREPARE_SWAP_ROUTE;

  const [currentStxErrorTracked, setCurrentStxErrorTracked] = useState(false);
  const fetchParams = useSelector(getFetchParams, isEqual);
  const { destinationTokenInfo = {} } = fetchParams?.metaData || {};

  const routeState = useSelector(getBackgroundSwapRouteState);
  const selectedAccount = useSelector(getSelectedAccount, shallowEqual);
  const quotes = useSelector(getQuotes, isEqual);
  const latestAddedTokenTo = useSelector(getLatestAddedTokenTo, isEqual);
  const txList = useSelector(getCurrentNetworkTransactions, shallowEqual);
  const tokenList = useSelector(getTokenList, isEqual);
  const shuffledTokensList = shuffle(Object.values(tokenList));
  const tradeTxId = useSelector(getTradeTxId);
  const approveTxId = useSelector(getApproveTxId);
  const aggregatorMetadata = useSelector(getAggregatorMetadata, shallowEqual);
  const fetchingQuotes = useSelector(getFetchingQuotes);
  let swapsErrorKey = useSelector(getSwapsErrorKey);
  const swapsEnabled = useSelector(getSwapsFeatureIsLive);
  const chainId = useSelector(getCurrentChainId);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const reviewSwapClickedTimestamp = useSelector(getReviewSwapClickedTimestamp);
  const reviewSwapClicked = Boolean(reviewSwapClickedTimestamp);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatusForMetrics,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const currentSmartTransactionsError = useSelector(
    getCurrentSmartTransactionsError,
  );
  const networkClientId = useSelector(getSelectedNetworkClientId);

  useEffect(() => {
    const leaveSwaps = async () => {
      await dispatch(prepareToLeaveSwaps());
      navigate(DEFAULT_ROUTE);
    };

    if (!isSwapsChain) {
      leaveSwaps();
    }
  }, [isSwapsChain, dispatch, navigate]);

  useGasFeeEstimates();

  const { balance: ethBalance, address: selectedAccountAddress } =
    selectedAccount;

  const approveTxData =
    approveTxId && txList.find(({ id }) => approveTxId === id);
  const tradeTxData = tradeTxId && txList.find(({ id }) => tradeTxId === id);
  const tokensReceived =
    tradeTxData?.txReceipt &&
    getSwapsTokensReceivedFromTxMeta(
      destinationTokenInfo?.symbol,
      tradeTxData,
      destinationTokenInfo?.address,
      selectedAccountAddress,
      destinationTokenInfo?.decimals,
      approveTxData,
      chainId,
    );
  const tradeConfirmed = tradeTxData?.status === TransactionStatus.confirmed;
  const approveError =
    approveTxData?.status === TransactionStatus.failed ||
    approveTxData?.txReceipt?.status === '0x0';
  const tradeError =
    tradeTxData?.status === TransactionStatus.failed ||
    tradeTxData?.txReceipt?.status === '0x0';
  const conversionError = approveError || tradeError;

  if (conversionError && swapsErrorKey !== CONTRACT_DATA_DISABLED_ERROR) {
    swapsErrorKey = SWAP_FAILED_ERROR;
  }

  const clearTemporaryTokenRef = useRef();
  useEffect(() => {
    clearTemporaryTokenRef.current = () => {
      if (latestAddedTokenTo && (!isAwaitingSwapRoute || conversionError)) {
        dispatch(
          ignoreTokens({
            tokensToIgnore: latestAddedTokenTo,
            dontShowLoadingIndicator: true,
            networkClientId,
          }),
        );
      }
    };
  }, [
    conversionError,
    dispatch,
    latestAddedTokenTo,
    destinationTokenInfo,
    fetchParams,
    isAwaitingSwapRoute,
    networkClientId,
  ]);
  useEffect(() => {
    return () => {
      clearTemporaryTokenRef.current();
    };
  }, []);

  useUpdateSwapsState();

  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const trackExitedSwapsEvent = () => {
    trackEvent({
      event: MetaMetricsEventName.ExitedSwaps,
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        token_from: fetchParams?.sourceTokenInfo?.symbol,
        token_from_amount: fetchParams?.value,
        request_type: fetchParams?.balanceError,
        token_to: fetchParams?.destinationTokenInfo?.symbol,
        slippage: fetchParams?.slippage,
        custom_slippage: fetchParams?.slippage !== 2,
        current_screen: pathname.match(/\/swaps\/(.+)/u)[1],
        is_hardware_wallet: hardwareWalletUsed,
        hardware_wallet_type: hardwareWalletType,
        stx_enabled: smartTransactionsEnabled,
        current_stx_enabled: currentSmartTransactionsEnabled,
        stx_user_opt_in: smartTransactionsOptInStatus,
      },
      properties: {
        hd_entropy_index: hdEntropyIndex,
      },
    });
  };
  const exitEventRef = useRef();
  useEffect(() => {
    exitEventRef.current = () => {
      trackExitedSwapsEvent();
    };
  });

  useEffect(() => {
    const fetchSwapsLivenessAndFeatureFlagsWrapper = async () => {
      await dispatch(fetchSwapsLivenessAndFeatureFlags());
    };
    fetchSwapsLivenessAndFeatureFlagsWrapper();
    return () => {
      exitEventRef.current();
    };
  }, [dispatch]);

  useEffect(() => {
    if (swapsErrorKey && !isSwapsErrorRoute && reviewSwapClicked) {
      navigate(SWAPS_PATHS.ERROR);
    }
  }, [navigate, swapsErrorKey, isSwapsErrorRoute, reviewSwapClicked]);

  const beforeUnloadEventAddedRef = useRef();
  useEffect(() => {
    const fn = () => {
      clearTemporaryTokenRef.current();
      if (isLoadingQuotesRoute) {
        dispatch(prepareToLeaveSwaps());
      }
      return null;
    };
    if (isLoadingQuotesRoute && !beforeUnloadEventAddedRef.current) {
      beforeUnloadEventAddedRef.current = true;
      window.addEventListener('beforeunload', fn);
    }
    return () => window.removeEventListener('beforeunload', fn);
  }, [dispatch, isLoadingQuotesRoute]);

  const trackErrorStxEvent = useCallback(() => {
    trackEvent({
      event: 'Error Smart Transactions',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        token_from: fetchParams?.sourceTokenInfo?.symbol,
        token_from_amount: fetchParams?.value,
        request_type: fetchParams?.balanceError,
        token_to: fetchParams?.destinationTokenInfo?.symbol,
        slippage: fetchParams?.slippage,
        custom_slippage: fetchParams?.slippage !== 2,
        current_screen: pathname.match(/\/swaps\/(.+)/u)[1],
        is_hardware_wallet: hardwareWalletUsed,
        hardware_wallet_type: hardwareWalletType,
        stx_enabled: smartTransactionsEnabled,
        current_stx_enabled: currentSmartTransactionsEnabled,
        stx_user_opt_in: smartTransactionsOptInStatus,
        stx_error: currentSmartTransactionsError,
      },
    });
  }, [
    currentSmartTransactionsError,
    currentSmartTransactionsEnabled,
    trackEvent,
    fetchParams?.balanceError,
    fetchParams?.destinationTokenInfo?.symbol,
    fetchParams?.slippage,
    fetchParams?.sourceTokenInfo?.symbol,
    fetchParams?.value,
    hardwareWalletType,
    hardwareWalletUsed,
    pathname,
    smartTransactionsEnabled,
    smartTransactionsOptInStatus,
  ]);

  useEffect(() => {
    if (currentSmartTransactionsError && !currentStxErrorTracked) {
      setCurrentStxErrorTracked(true);
      trackErrorStxEvent();
    }
  }, [
    currentSmartTransactionsError,
    trackErrorStxEvent,
    currentStxErrorTracked,
  ]);

  if (!isSwapsChain) {
    // A user is being redirected outside of Swaps via the async "leaveSwaps" function above. In the meantime
    // we have to prevent the code below this condition, which wouldn't work on an unsupported chain.
    return <></>;
  }

  const redirectToDefaultRoute = async () => {
    clearTemporaryTokenRef.current();
    // Set navigation state before navigate (HashRouter in v5-compat doesn't support state)
    setNavState({ stayOnHomePage: true });
    navigate(DEFAULT_ROUTE);
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
  };

  return (
    <div className="swaps">
      <div className="swaps__container">
        <div className="swaps__header">
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.center}
            marginLeft={4}
            width={FRACTIONS.ONE_TWELFTH}
            tabIndex="0"
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                redirectToDefaultRoute();
              }
            }}
          >
            {!isAwaitingSwapRoute &&
              !isAwaitingSignaturesRoute &&
              !isSmartTransactionStatusRoute && (
                <Icon
                  name={IconName.Arrow2Left}
                  size={IconSize.Lg}
                  color={IconColor.iconAlternative}
                  onClick={redirectToDefaultRoute}
                  style={{ cursor: 'pointer' }}
                  title={t('cancel')}
                />
              )}
          </Box>
          <div className="swaps__title">{t('swap')}</div>
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.center}
            marginRight={4}
            width={FRACTIONS.ONE_TWELFTH}
            tabIndex="0"
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                dispatch(setTransactionSettingsOpened(true));
              }
            }}
          >
            {isPrepareSwapRoute && (
              <Icon
                name={IconName.Setting}
                size={IconSize.Lg}
                color={IconColor.iconAlternative}
                onClick={() => {
                  dispatch(setTransactionSettingsOpened(true));
                }}
                style={{ cursor: 'pointer' }}
                title={t('transactionSettings')}
              />
            )}
          </Box>
        </div>
        <div className="swaps__content">
          <Routes>
            <Route
              path={SWAPS_PATHS.PREPARE}
              element={
                swapsEnabled ? (
                  <PrepareSwapPage
                    ethBalance={ethBalance}
                    selectedAccountAddress={selectedAccountAddress}
                    shuffledTokensList={shuffledTokensList}
                  />
                ) : (
                  <Navigate to={SWAPS_PATHS.MAINTENANCE} replace />
                )
              }
            />
            <Route
              path={SWAPS_PATHS.ERROR}
              element={
                swapsErrorKey ? (
                  <AwaitingSwap
                    swapComplete={false}
                    errorKey={swapsErrorKey}
                    txHash={tradeTxData?.hash}
                    txId={tradeTxData?.id}
                    submittedTime={tradeTxData?.submittedTime}
                  />
                ) : (
                  <Navigate to={SWAPS_PATHS.PREPARE} replace />
                )
              }
            />
            <Route
              path={SWAPS_PATHS.NOTIFICATION}
              element={
                swapsErrorKey ? (
                  <NotificationPage notificationKey={swapsErrorKey} />
                ) : (
                  <Navigate to={SWAPS_PATHS.PREPARE} replace />
                )
              }
            />
            <Route
              path={SWAPS_PATHS.LOADING_QUOTES}
              element={(() => {
                if (!swapsEnabled) {
                  return <Navigate to={SWAPS_PATHS.MAINTENANCE} replace />;
                }
                if (!aggregatorMetadata) {
                  return <Navigate to={SWAPS_PATHS.PREPARE} replace />;
                }
                return (
                  <LoadingQuote
                    loadingComplete={
                      !fetchingQuotes && Boolean(Object.values(quotes).length)
                    }
                    onDone={async () => {
                      await dispatch(setBackgroundSwapRouteState(''));
                      if (
                        swapsErrorKey === ERROR_FETCHING_QUOTES ||
                        swapsErrorKey === QUOTES_NOT_AVAILABLE_ERROR
                      ) {
                        dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR));
                        navigate(SWAPS_PATHS.ERROR);
                      } else {
                        navigate(SWAPS_PATHS.PREPARE);
                      }
                    }}
                    aggregatorMetadata={aggregatorMetadata}
                  />
                );
              })()}
            />
            <Route
              path={SWAPS_PATHS.MAINTENANCE}
              element={
                swapsEnabled === false ? (
                  <AwaitingSwap errorKey={OFFLINE_FOR_MAINTENANCE} />
                ) : (
                  <Navigate to={SWAPS_PATHS.PREPARE} replace />
                )
              }
            />
            <Route
              path={SWAPS_PATHS.AWAITING_SIGNATURES}
              element={<AwaitingSignatures />}
            />
            <Route
              path={SWAPS_PATHS.SMART_TRANSACTION_STATUS}
              element={<SmartTransactionStatus txId={tradeTxData?.id} />}
            />
            <Route
              path={SWAPS_PATHS.AWAITING_SWAP}
              element={
                routeState === 'awaiting' || tradeTxData ? (
                  <AwaitingSwap
                    swapComplete={tradeConfirmed}
                    txHash={tradeTxData?.hash}
                    tokensReceived={tokensReceived}
                    txId={tradeTxData?.id}
                    submittingSwap={
                      routeState === 'awaiting' && !(approveTxId || tradeTxId)
                    }
                  />
                ) : (
                  <Navigate to={DEFAULT_ROUTE} replace />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
