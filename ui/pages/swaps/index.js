import React, {
  useEffect,
  useRef,
  useContext,
  useState,
  useCallback,
} from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  Switch,
  Route,
  useLocation,
  useHistory,
  Redirect,
} from 'react-router-dom';
import { shuffle, isEqual } from 'lodash';
import classnames from 'classnames';
import { TransactionStatus } from '@metamask/transaction-controller';
import { I18nContext } from '../../contexts/i18n';

import {
  getSelectedAccount,
  getCurrentChainId,
  getIsSwapsChain,
  isHardwareWallet,
  getHardwareWalletType,
  getTokenList,
} from '../../selectors/selectors';
import {
  getQuotes,
  clearSwapsState,
  getTradeTxId,
  getApproveTxId,
  getFetchingQuotes,
  setTopAssets,
  getFetchParams,
  setAggregatorMetadata,
  getAggregatorMetadata,
  getBackgroundSwapRouteState,
  getSwapsErrorKey,
  getSwapsFeatureIsLive,
  prepareToLeaveSwaps,
  fetchAndSetSwapsGasPriceInfo,
  fetchSwapsLivenessAndFeatureFlags,
  getReviewSwapClickedTimestamp,
  getPendingSmartTransactions,
  getSmartTransactionsOptInStatus,
  getSmartTransactionsEnabled,
  getCurrentSmartTransactionsEnabled,
  getCurrentSmartTransactionsError,
  navigateBackToBuildQuote,
  getSwapRedesignEnabled,
  setTransactionSettingsOpened,
  getLatestAddedTokenTo,
} from '../../ducks/swaps/swaps';
import {
  checkNetworkAndAccountSupports1559,
  getCurrentNetworkTransactions,
} from '../../selectors';
import {
  AWAITING_SIGNATURES_ROUTE,
  AWAITING_SWAP_ROUTE,
  SMART_TRANSACTION_STATUS_ROUTE,
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
  SWAPS_ERROR_ROUTE,
  DEFAULT_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  PREPARE_SWAP_ROUTE,
  SWAPS_NOTIFICATION_ROUTE,
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
  setSwapsTokens,
  ignoreTokens,
  setBackgroundSwapRouteState,
  setSwapsErrorKey,
} from '../../store/actions';

import { useGasFeeEstimates } from '../../hooks/useGasFeeEstimates';
import FeatureToggledRoute from '../../helpers/higher-order-components/feature-toggled-route';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
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
import {
  fetchTokens,
  fetchTopAssets,
  fetchAggregatorMetadata,
} from './swaps.util';
import AwaitingSignatures from './awaiting-signatures';
import SmartTransactionStatus from './smart-transaction-status';
import AwaitingSwap from './awaiting-swap';
import LoadingQuote from './loading-swaps-quotes';
import BuildQuote from './build-quote';
import PrepareSwapPage from './prepare-swap-page/prepare-swap-page';
import NotificationPage from './notification-page/notification-page';
import ViewQuote from './view-quote';

export default function Swap() {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const { pathname } = useLocation();
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE;
  const isAwaitingSignaturesRoute = pathname === AWAITING_SIGNATURES_ROUTE;
  const isSwapsErrorRoute = pathname === SWAPS_ERROR_ROUTE;
  const isLoadingQuotesRoute = pathname === LOADING_QUOTES_ROUTE;
  const isSmartTransactionStatusRoute =
    pathname === SMART_TRANSACTION_STATUS_ROUTE;
  const isViewQuoteRoute = pathname === VIEW_QUOTE_ROUTE;
  const isPrepareSwapRoute = pathname === PREPARE_SWAP_ROUTE;

  const [currentStxErrorTracked, setCurrentStxErrorTracked] = useState(false);
  const fetchParams = useSelector(getFetchParams, isEqual);
  const { destinationTokenInfo = {} } = fetchParams?.metaData || {};

  const routeState = useSelector(getBackgroundSwapRouteState);
  const selectedAccount = useSelector(getSelectedAccount, shallowEqual);
  const quotes = useSelector(getQuotes, isEqual);
  const latestAddedTokenTo = useSelector(getLatestAddedTokenTo, isEqual);
  const txList = useSelector(getCurrentNetworkTransactions, shallowEqual);
  const tradeTxId = useSelector(getTradeTxId);
  const approveTxId = useSelector(getApproveTxId);
  const aggregatorMetadata = useSelector(getAggregatorMetadata, shallowEqual);
  const fetchingQuotes = useSelector(getFetchingQuotes);
  let swapsErrorKey = useSelector(getSwapsErrorKey);
  const swapsEnabled = useSelector(getSwapsFeatureIsLive);
  const chainId = useSelector(getCurrentChainId);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const tokenList = useSelector(getTokenList, isEqual);
  const shuffledTokensList = shuffle(Object.values(tokenList));
  const reviewSwapClickedTimestamp = useSelector(getReviewSwapClickedTimestamp);
  const pendingSmartTransactions = useSelector(getPendingSmartTransactions);
  const reviewSwapClicked = Boolean(reviewSwapClickedTimestamp);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatus,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const swapRedesignEnabled = useSelector(getSwapRedesignEnabled);
  const currentSmartTransactionsError = useSelector(
    getCurrentSmartTransactionsError,
  );

  useEffect(() => {
    const leaveSwaps = async () => {
      await dispatch(prepareToLeaveSwaps());
      // We need to wait until "prepareToLeaveSwaps" is done, because otherwise
      // a user would be redirected from DEFAULT_ROUTE back to Swaps.
      history.push(DEFAULT_ROUTE);
    };

    if (!isSwapsChain) {
      leaveSwaps();
    }
  }, [isSwapsChain, dispatch, history]);

  // This will pre-load gas fees before going to the View Quote page.
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
  ]);
  useEffect(() => {
    return () => {
      clearTemporaryTokenRef.current();
    };
  }, []);

  // eslint-disable-next-line
  useEffect(() => {
    if (!isSwapsChain) {
      return undefined;
    }
    fetchTokens(chainId)
      .then((tokens) => {
        dispatch(setSwapsTokens(tokens));
      })
      .catch((error) => console.error(error));
    fetchTopAssets(chainId).then((topAssets) => {
      dispatch(setTopAssets(topAssets));
    });
    fetchAggregatorMetadata(chainId).then((newAggregatorMetadata) => {
      dispatch(setAggregatorMetadata(newAggregatorMetadata));
    });
    if (!networkAndAccountSupports1559) {
      dispatch(fetchAndSetSwapsGasPriceInfo(chainId));
    }
    return () => {
      dispatch(prepareToLeaveSwaps());
    };
  }, [dispatch, chainId, networkAndAccountSupports1559, isSwapsChain]);

  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const trackExitedSwapsEvent = () => {
    trackEvent({
      event: 'Exited Swaps',
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
    // If there is a swapsErrorKey and reviewSwapClicked is false, there was an error in silent quotes prefetching
    // and we don't want to show the error page in that case, because another API call for quotes can be successful.
    if (swapsErrorKey && !isSwapsErrorRoute && reviewSwapClicked) {
      history.push(SWAPS_ERROR_ROUTE);
    }
  }, [history, swapsErrorKey, isSwapsErrorRoute, reviewSwapClicked]);

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
    history.push({
      pathname: DEFAULT_ROUTE,
      state: { stayOnHomePage: true },
    });
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
  };

  return (
    <div className="swaps">
      <div className="swaps__container">
        <div className="swaps__header">
          {!swapRedesignEnabled && (
            <div
              className="swaps__header-edit"
              onClick={async () => {
                await dispatch(navigateBackToBuildQuote(history));
              }}
            >
              {isViewQuoteRoute && t('edit')}
            </div>
          )}
          {swapRedesignEnabled && (
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
          )}
          <div className="swaps__title">{t('swap')}</div>
          {!swapRedesignEnabled && (
            <div
              className="swaps__header-cancel"
              onClick={async () => {
                clearTemporaryTokenRef.current();
                dispatch(clearSwapsState());
                await dispatch(resetBackgroundSwapsState());
                history.push(DEFAULT_ROUTE);
              }}
            >
              {!isAwaitingSwapRoute &&
                !isAwaitingSignaturesRoute &&
                !isSmartTransactionStatusRoute &&
                t('cancel')}
            </div>
          )}
          {swapRedesignEnabled && (
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
          )}
        </div>
        <div
          className={classnames('swaps__content', {
            'swaps__content--redesign-enabled': swapRedesignEnabled,
          })}
        >
          <Switch>
            <FeatureToggledRoute
              redirectRoute={SWAPS_MAINTENANCE_ROUTE}
              flag={swapsEnabled}
              path={BUILD_QUOTE_ROUTE}
              exact
              render={() => {
                if (swapRedesignEnabled) {
                  return <Redirect to={{ pathname: PREPARE_SWAP_ROUTE }} />;
                }
                if (tradeTxData && !conversionError) {
                  return <Redirect to={{ pathname: AWAITING_SWAP_ROUTE }} />;
                } else if (tradeTxData && routeState) {
                  return <Redirect to={{ pathname: SWAPS_ERROR_ROUTE }} />;
                } else if (routeState === 'loading' && aggregatorMetadata) {
                  return <Redirect to={{ pathname: LOADING_QUOTES_ROUTE }} />;
                }

                return (
                  <BuildQuote
                    ethBalance={ethBalance}
                    selectedAccountAddress={selectedAccountAddress}
                    shuffledTokensList={shuffledTokensList}
                  />
                );
              }}
            />
            <FeatureToggledRoute
              redirectRoute={SWAPS_MAINTENANCE_ROUTE}
              flag={swapsEnabled}
              path={PREPARE_SWAP_ROUTE}
              exact
              render={() => {
                if (!swapRedesignEnabled) {
                  return <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />;
                }

                return (
                  <PrepareSwapPage
                    ethBalance={ethBalance}
                    selectedAccountAddress={selectedAccountAddress}
                    shuffledTokensList={shuffledTokensList}
                  />
                );
              }}
            />
            <FeatureToggledRoute
              redirectRoute={SWAPS_MAINTENANCE_ROUTE}
              flag={swapsEnabled}
              path={VIEW_QUOTE_ROUTE}
              exact
              render={() => {
                if (
                  pendingSmartTransactions.length > 0 &&
                  routeState === 'smartTransactionStatus'
                ) {
                  return (
                    <Redirect
                      to={{ pathname: SMART_TRANSACTION_STATUS_ROUTE }}
                    />
                  );
                }
                if (swapRedesignEnabled) {
                  return <Redirect to={{ pathname: PREPARE_SWAP_ROUTE }} />;
                }
                if (Object.values(quotes).length) {
                  return (
                    <ViewQuote numberOfQuotes={Object.values(quotes).length} />
                  );
                } else if (fetchParams) {
                  return <Redirect to={{ pathname: SWAPS_ERROR_ROUTE }} />;
                }
                return <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />;
              }}
            />
            <Route
              path={SWAPS_ERROR_ROUTE}
              exact
              render={() => {
                if (swapsErrorKey) {
                  return (
                    <AwaitingSwap
                      swapComplete={false}
                      errorKey={swapsErrorKey}
                      txHash={tradeTxData?.hash}
                      txId={tradeTxData?.id}
                      submittedTime={tradeTxData?.submittedTime}
                    />
                  );
                }
                return <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />;
              }}
            />
            <Route
              path={SWAPS_NOTIFICATION_ROUTE}
              exact
              render={() => {
                if (!swapsErrorKey) {
                  return <Redirect to={{ pathname: PREPARE_SWAP_ROUTE }} />;
                }
                return <NotificationPage notificationKey={swapsErrorKey} />;
              }}
            />
            <FeatureToggledRoute
              redirectRoute={SWAPS_MAINTENANCE_ROUTE}
              flag={swapsEnabled}
              path={LOADING_QUOTES_ROUTE}
              exact
              render={() => {
                return aggregatorMetadata ? (
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
                        history.push(SWAPS_ERROR_ROUTE);
                      } else {
                        history.push(VIEW_QUOTE_ROUTE);
                      }
                    }}
                    aggregatorMetadata={aggregatorMetadata}
                  />
                ) : (
                  <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />
                );
              }}
            />
            <Route
              path={SWAPS_MAINTENANCE_ROUTE}
              exact
              render={() => {
                return swapsEnabled === false ? (
                  <AwaitingSwap errorKey={OFFLINE_FOR_MAINTENANCE} />
                ) : (
                  <Redirect to={{ pathname: BUILD_QUOTE_ROUTE }} />
                );
              }}
            />
            <Route
              path={AWAITING_SIGNATURES_ROUTE}
              exact
              render={() => {
                return <AwaitingSignatures />;
              }}
            />
            <Route
              path={SMART_TRANSACTION_STATUS_ROUTE}
              exact
              render={() => {
                return <SmartTransactionStatus txId={tradeTxData?.id} />;
              }}
            />
            <Route
              path={AWAITING_SWAP_ROUTE}
              exact
              render={() => {
                return routeState === 'awaiting' || tradeTxData ? (
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
                  <Redirect to={{ pathname: DEFAULT_ROUTE }} />
                );
              }}
            />
          </Switch>
        </div>
      </div>
    </div>
  );
}
