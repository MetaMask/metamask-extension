import EventEmitter from 'events';
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { uniqBy, isEqual } from 'lodash';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import classnames from 'classnames';

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  useTokensToSearch,
  getRenderableTokenData,
} from '../../../hooks/useTokensToSearch';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import { I18nContext } from '../../../contexts/i18n';
import TransactionSettings from '../transaction-settings';
import ListWithSearch from '../list-with-search';
import { getTokens, getConversionRate } from '../../../ducks/metamask/metamask';
import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import {
  TypographyVariant,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TextColor,
  JustifyContent,
  AlignItems,
  SEVERITIES,
  Size,
  TextVariant,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';

import {
  fetchQuotesAndSetQuoteState,
  setSwapsFromToken,
  setSwapToToken,
  getFromToken,
  getToToken,
  getBalanceError,
  getTopAssets,
  getFetchParams,
  getQuotes,
  setBalanceError,
  setFromTokenInputValue,
  setFromTokenError,
  setMaxSlippage,
  setReviewSwapClickedTimestamp,
  getSmartTransactionsOptInStatus,
  getSmartTransactionsEnabled,
  getCurrentSmartTransactionsEnabled,
  getFromTokenInputValue,
  getFromTokenError,
  getMaxSlippage,
  getIsFeatureFlagLoaded,
  getCurrentSmartTransactionsError,
  getFetchingQuotes,
  getSwapsErrorKey,
  getAggregatorMetadata,
  getTransactionSettingsOpened,
  setTransactionSettingsOpened,
  getSelectedQuote,
  getTopQuote,
} from '../../../ducks/swaps/swaps';
import {
  getSwapsDefaultToken,
  getTokenExchangeRates,
  getCurrentCurrency,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getTokenList,
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors';

import {
  getValueFromWeiHex,
  hexToDecimal,
} from '../../../../shared/modules/conversion.utils';
import { getURLHostName } from '../../../helpers/utils/util';
import { usePrevious } from '../../../hooks/usePrevious';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { useEthFiatAmount } from '../../../hooks/useEthFiatAmount';

import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../../../../shared/modules/swaps.utils';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import {
  SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP,
  TokenBucketPriority,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  QUOTES_EXPIRED_ERROR,
} from '../../../../shared/constants/swaps';

import {
  resetSwapsPostFetchState,
  ignoreTokens,
  clearSwapsQuotes,
  stopPollingForQuotes,
  setSmartTransactionsOptInStatus,
  setSwapsErrorKey,
  setBackgroundSwapRouteState,
} from '../../../store/actions';
import {
  countDecimals,
  fetchTokenPrice,
  fetchTokenBalance,
} from '../swaps.util';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { shouldEnableDirectWrapping } from '../../../../shared/lib/swaps-utils';
import Mascot from '../../../components/ui/mascot';
import {
  Icon,
  ICON_NAMES,
  ICON_SIZES,
  TextField,
  ButtonLink,
  Text,
} from '../../../components/component-library';
import { BannerAlert } from '../../../components/component-library/banner-alert';
import SwapsFooter from '../swaps-footer';
import SelectedToken from '../selected-token';
import { SWAPS_NOTIFICATION_ROUTE } from '../../../helpers/constants/routes';
import SwapsBannerAlert from './swaps-banner-alert';
import MascotBackgroundAnimation from './mascot-background-animation';
import ReviewQuote from './review-quote';

const MAX_ALLOWED_SLIPPAGE = 15;

let timeoutIdForQuotesPrefetching;

export default function PrepareSwap({
  ethBalance,
  selectedAccountAddress,
  shuffledTokensList,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const [fetchedTokenExchangeRate, setFetchedTokenExchangeRate] =
    useState(undefined);
  const [verificationClicked, setVerificationClicked] = useState(false);
  const [receiveToAmount, setReceiveToAmount] = useState();
  const [isSwapToOpen, setIsSwapToOpen] = useState(false);
  const onSwapToOpen = () => setIsSwapToOpen(true);
  const onSwapToClose = () => setIsSwapToOpen(false);
  const [isSwapFromOpen, setIsSwapFromOpen] = useState(false);
  const onSwapFromOpen = () => setIsSwapFromOpen(true);
  const onSwapFromClose = () => setIsSwapFromOpen(false);
  const [swapFromSearchQuery, setSwapFromSearchQuery] = useState('');
  const [swapToSearchQuery, setSwapToSearchQuery] = useState('');
  const [quoteCount, updateQuoteCount] = useState(0);
  const [prefetchingQuotes, setPrefetchingQuotes] = useState(false);
  const [rotateSwitchTokens, setRotateSwitchTokens] = useState(false);

  const isFeatureFlagLoaded = useSelector(getIsFeatureFlagLoaded);
  const balanceError = useSelector(getBalanceError);
  const fetchParams = useSelector(getFetchParams, isEqual);
  const { sourceTokenInfo = {}, destinationTokenInfo = {} } =
    fetchParams?.metaData || {};
  const tokens = useSelector(getTokens, isEqual);
  const topAssets = useSelector(getTopAssets, isEqual);
  const fromToken = useSelector(getFromToken, isEqual);
  const fromTokenInputValue = useSelector(getFromTokenInputValue);
  const fromTokenError = useSelector(getFromTokenError);
  const maxSlippage = useSelector(getMaxSlippage);
  const toToken = useSelector(getToToken, isEqual) || destinationTokenInfo;
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider, shallowEqual);
  const tokenList = useSelector(getTokenList, isEqual);
  const quotes = useSelector(getQuotes, isEqual);
  const numberOfQuotes = Object.keys(quotes).length;
  const areQuotesPresent = numberOfQuotes > 0;
  const swapsErrorKey = useSelector(getSwapsErrorKey);
  const aggregatorMetadata = useSelector(getAggregatorMetadata, shallowEqual);
  const transactionSettingsOpened = useSelector(
    getTransactionSettingsOpened,
    shallowEqual,
  );
  const numberOfAggregators = aggregatorMetadata
    ? Object.keys(aggregatorMetadata).length
    : 0;

  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatus,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const smartTransactionsOptInPopoverDisplayed =
    smartTransactionsOptInStatus !== undefined;
  const currentSmartTransactionsError = useSelector(
    getCurrentSmartTransactionsError,
  );
  const currentCurrency = useSelector(getCurrentCurrency);
  const fetchingQuotes = useSelector(getFetchingQuotes);
  const loadingComplete = !fetchingQuotes && areQuotesPresent;
  const animationEventEmitter = useRef(new EventEmitter());
  const selectedQuote = useSelector(getSelectedQuote, isEqual);
  const topQuote = useSelector(getTopQuote, isEqual);
  const usedQuote = selectedQuote || topQuote;

  const showSmartTransactionsOptInPopover =
    smartTransactionsEnabled && !smartTransactionsOptInPopoverDisplayed;

  const onCloseSmartTransactionsOptInPopover = (e) => {
    e?.preventDefault();
    setSmartTransactionsOptInStatus(false, smartTransactionsOptInStatus);
  };

  const onEnableSmartTransactionsClick = () =>
    setSmartTransactionsOptInStatus(true, smartTransactionsOptInStatus);

  const fetchParamsFromToken = isSwapsDefaultTokenSymbol(
    sourceTokenInfo?.symbol,
    chainId,
  )
    ? defaultSwapsToken
    : sourceTokenInfo;

  const { tokensWithBalances } = useTokenTracker(tokens);

  // If the fromToken was set in a call to `onFromSelect` (see below), and that from token has a balance
  // but is not in tokensWithBalances or tokens, then we want to add it to the usersTokens array so that
  // the balance of the token can appear in the from token selection dropdown
  const fromTokenArray =
    !isSwapsDefaultTokenSymbol(fromToken?.symbol, chainId) && fromToken?.balance
      ? [fromToken]
      : [];
  const usersTokens = uniqBy(
    [...tokensWithBalances, ...tokens, ...fromTokenArray],
    'address',
  );
  const memoizedUsersTokens = useEqualityCheck(usersTokens);

  const selectedFromToken = getRenderableTokenData(
    fromToken || fetchParamsFromToken,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    chainId,
    tokenList,
  );

  const tokensToSearchSwapFrom = useTokensToSearch({
    usersTokens: memoizedUsersTokens,
    topTokens: topAssets,
    shuffledTokensList,
    tokenBucketPriority: TokenBucketPriority.owned,
  });
  const tokensToSearchSwapTo = useTokensToSearch({
    usersTokens: memoizedUsersTokens,
    topTokens: topAssets,
    shuffledTokensList,
    tokenBucketPriority: TokenBucketPriority.top,
  });
  const selectedToToken =
    tokensToSearchSwapFrom.find(({ address }) =>
      isEqualCaseInsensitive(address, toToken?.address),
    ) || toToken;
  const toTokenIsNotDefault =
    selectedToToken?.address &&
    !isSwapsDefaultTokenAddress(selectedToToken?.address, chainId);
  const occurrences = Number(
    selectedToToken?.occurances || selectedToToken?.occurrences || 0,
  );
  const {
    address: fromTokenAddress,
    symbol: fromTokenSymbol,
    string: fromTokenString,
    decimals: fromTokenDecimals,
    balance: rawFromTokenBalance,
  } = selectedFromToken || {};
  const { address: toTokenAddress } = selectedToToken || {};

  const fromTokenBalance =
    rawFromTokenBalance &&
    calcTokenAmount(rawFromTokenBalance, fromTokenDecimals).toString(10);

  const prevFromTokenBalance = usePrevious(fromTokenBalance);

  const swapFromTokenFiatValue = useTokenFiatAmount(
    fromTokenAddress,
    fromTokenInputValue || 0,
    fromTokenSymbol,
    {
      showFiat: true,
    },
    true,
  );
  const swapFromEthFiatValue = useEthFiatAmount(
    fromTokenInputValue || 0,
    { showFiat: true },
    true,
  );
  const swapFromFiatValue = isSwapsDefaultTokenSymbol(fromTokenSymbol, chainId)
    ? swapFromEthFiatValue
    : swapFromTokenFiatValue;

  const onInputChange = useCallback(
    (newInputValue, balance) => {
      dispatch(setFromTokenInputValue(newInputValue));
      const newBalanceError = new BigNumber(newInputValue || 0).gt(
        balance || 0,
      );
      // "setBalanceError" is just a warning, a user can still click on the "Review swap" button.
      if (balanceError !== newBalanceError) {
        dispatch(setBalanceError(newBalanceError));
      }
      dispatch(
        setFromTokenError(
          fromToken && countDecimals(newInputValue) > fromToken.decimals
            ? 'tooManyDecimals'
            : null,
        ),
      );
    },
    [dispatch, fromToken, balanceError],
  );

  useEffect(() => {
    let timeoutLength;

    if (!prefetchingQuotes) {
      updateQuoteCount(0);
      return;
    }

    const onQuotesLoadingDone = async () => {
      await dispatch(setBackgroundSwapRouteState(''));
      setPrefetchingQuotes(false);
      if (
        swapsErrorKey === ERROR_FETCHING_QUOTES ||
        swapsErrorKey === QUOTES_NOT_AVAILABLE_ERROR
      ) {
        dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR));
      }
    };

    // The below logic simulates a sequential loading of the aggregator quotes, even though we are fetching them all with a single call.
    // This is to give the user a sense of progress. The callback passed to `setTimeout` updates the quoteCount and therefore causes
    // a new logo to be shown, the fox to look at that logo, the logo bar and aggregator name to update.

    if (loadingComplete) {
      // If loading is complete, but the quoteCount is not, we quickly display the remaining logos/names/fox looks. 0.2s each
      timeoutLength = 20;
    } else {
      // If loading is not complete, we display remaining logos/names/fox looks at random intervals between 0.5s and 2s, to simulate the
      // sort of loading a user would experience in most async scenarios
      timeoutLength = 500 + Math.floor(Math.random() * 1500);
    }
    const quoteCountTimeout = setTimeout(() => {
      if (quoteCount < numberOfAggregators) {
        updateQuoteCount(quoteCount + 1);
      } else if (quoteCount === numberOfAggregators && loadingComplete) {
        onQuotesLoadingDone();
      }
    }, timeoutLength);

    // eslint-disable-next-line consistent-return
    return function cleanup() {
      clearTimeout(quoteCountTimeout);
    };
  }, [
    fetchingQuotes,
    quoteCount,
    loadingComplete,
    numberOfQuotes,
    dispatch,
    history,
    swapsErrorKey,
    numberOfAggregators,
    prefetchingQuotes,
  ]);

  const onFromSelect = (token) => {
    if (
      token?.address &&
      !swapFromFiatValue &&
      fetchedTokenExchangeRate !== null
    ) {
      fetchTokenPrice(token.address).then((rate) => {
        if (rate !== null && rate !== undefined) {
          setFetchedTokenExchangeRate(rate);
        }
      });
    } else {
      setFetchedTokenExchangeRate(null);
    }
    if (
      token?.address &&
      !memoizedUsersTokens.find((usersToken) =>
        isEqualCaseInsensitive(usersToken.address, token.address),
      )
    ) {
      fetchTokenBalance(token.address, selectedAccountAddress).then(
        (fetchedBalance) => {
          if (fetchedBalance?.balance) {
            const balanceAsDecString = fetchedBalance.balance.toString(10);
            const userTokenBalance = calcTokenAmount(
              balanceAsDecString,
              token.decimals,
            );
            dispatch(
              setSwapsFromToken({
                ...token,
                string: userTokenBalance.toString(10),
                balance: balanceAsDecString,
              }),
            );
          }
        },
      );
    }
    dispatch(setSwapsFromToken(token));
    onInputChange(
      token?.address ? fromTokenInputValue : '',
      token.string,
      token.decimals,
    );
  };

  const blockExplorerTokenLink = getTokenTrackerLink(
    selectedToToken.address,
    chainId,
    null, // no networkId
    null, // no holderAddress
    {
      blockExplorerUrl:
        SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ?? null,
    },
  );

  const blockExplorerLabel = rpcPrefs.blockExplorerUrl
    ? getURLHostName(blockExplorerTokenLink)
    : t('etherscan');

  const { destinationTokenAddedForSwap } = fetchParams || {};
  const { address: toAddress } = toToken || {};
  const onToSelect = useCallback(
    (token) => {
      if (destinationTokenAddedForSwap && token.address !== toAddress) {
        dispatch(
          ignoreTokens({
            tokensToIgnore: toAddress,
            dontShowLoadingIndicator: true,
          }),
        );
      }
      dispatch(setSwapToToken(token));
      setVerificationClicked(false);
    },
    [dispatch, destinationTokenAddedForSwap, toAddress],
  );

  const tokensWithBalancesFromToken = tokensWithBalances.find((token) =>
    isEqualCaseInsensitive(token.address, fromToken?.address),
  );
  const previousTokensWithBalancesFromToken = usePrevious(
    tokensWithBalancesFromToken,
  );

  useEffect(() => {
    const notDefault = !isSwapsDefaultTokenAddress(
      tokensWithBalancesFromToken?.address,
      chainId,
    );
    const addressesAreTheSame = isEqualCaseInsensitive(
      tokensWithBalancesFromToken?.address,
      previousTokensWithBalancesFromToken?.address,
    );
    const balanceHasChanged =
      tokensWithBalancesFromToken?.balance !==
      previousTokensWithBalancesFromToken?.balance;
    if (notDefault && addressesAreTheSame && balanceHasChanged) {
      dispatch(
        setSwapsFromToken({
          ...fromToken,
          balance: tokensWithBalancesFromToken?.balance,
          string: tokensWithBalancesFromToken?.string,
        }),
      );
    }
  }, [
    dispatch,
    tokensWithBalancesFromToken,
    previousTokensWithBalancesFromToken,
    fromToken,
    chainId,
  ]);

  // If the eth balance changes while on build quote, we update the selected from token
  useEffect(() => {
    if (
      isSwapsDefaultTokenAddress(fromToken?.address, chainId) &&
      fromToken?.balance !== hexToDecimal(ethBalance)
    ) {
      dispatch(
        setSwapsFromToken({
          ...fromToken,
          balance: hexToDecimal(ethBalance),
          string: getValueFromWeiHex({
            value: ethBalance,
            numberOfDecimals: 4,
            toDenomination: 'ETH',
          }),
        }),
      );
    }
  }, [dispatch, fromToken, ethBalance, chainId]);

  useEffect(() => {
    if (prevFromTokenBalance !== fromTokenBalance) {
      onInputChange(fromTokenInputValue, fromTokenBalance);
    }
  }, [
    onInputChange,
    prevFromTokenBalance,
    fromTokenInputValue,
    fromTokenBalance,
  ]);

  useEffect(() => {
    // This can happen when a user reopens the extension after filling the Swaps form.
    if (!fromTokenInputValue && usedQuote?.sourceAmount) {
      const usedQuoteSourceAmount = calcTokenAmount(
        usedQuote?.sourceAmount,
        selectedFromToken?.decimals,
      ).toString(10);
      onInputChange(usedQuoteSourceAmount, fromTokenBalance);
    }
  }, [fromTokenInputValue, usedQuote?.sourceAmount]);

  const trackBuildQuotePageLoadedEvent = useCallback(() => {
    trackEvent({
      event: 'Prepare Swap Page Loaded',
      category: EVENT.CATEGORIES.SWAPS,
      sensitiveProperties: {
        is_hardware_wallet: hardwareWalletUsed,
        hardware_wallet_type: hardwareWalletType,
        stx_enabled: smartTransactionsEnabled,
        current_stx_enabled: currentSmartTransactionsEnabled,
        stx_user_opt_in: smartTransactionsOptInStatus,
      },
    });
  }, [
    trackEvent,
    hardwareWalletUsed,
    hardwareWalletType,
    smartTransactionsEnabled,
    currentSmartTransactionsEnabled,
    smartTransactionsOptInStatus,
  ]);

  useEffect(() => {
    dispatch(resetSwapsPostFetchState());
    dispatch(setReviewSwapClickedTimestamp());
    trackBuildQuotePageLoadedEvent();
  }, [dispatch, trackBuildQuotePageLoadedEvent]);

  const BlockExplorerLink = () => {
    return (
      <a
        className="prepare-swap-page__token-etherscan-link"
        key="prepare-swap-page-etherscan-link"
        onClick={() => {
          /* istanbul ignore next */
          trackEvent({
            event: EVENT_NAMES.EXTERNAL_LINK_CLICKED,
            category: EVENT.CATEGORIES.SWAPS,
            properties: {
              link_type: EVENT.EXTERNAL_LINK_TYPES.TOKEN_TRACKER,
              location: 'Swaps Confirmation',
              url_domain: getURLHostName(blockExplorerTokenLink),
            },
          });
          global.platform.openTab({
            url: blockExplorerTokenLink,
          });
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {blockExplorerLabel}
      </a>
    );
  };

  const swapYourTokenBalance = `${t('balance')}: ${fromTokenString || '0'}`;

  const isDirectWrappingEnabled = shouldEnableDirectWrapping(
    chainId,
    fromTokenAddress,
    selectedToToken.address,
  );
  const isReviewSwapButtonDisabled =
    fromTokenError ||
    !isFeatureFlagLoaded ||
    !Number(fromTokenInputValue) ||
    !selectedToToken?.address ||
    !fromTokenAddress ||
    Number(maxSlippage) < 0 ||
    Number(maxSlippage) > MAX_ALLOWED_SLIPPAGE ||
    transactionSettingsOpened ||
    (toTokenIsNotDefault && occurrences < 2 && !verificationClicked);

  // It's triggered every time there is a change in form values (token from, token to, amount and slippage).
  useEffect(() => {
    dispatch(clearSwapsQuotes());
    dispatch(stopPollingForQuotes());
    const prefetchQuotesWithoutRedirecting = async () => {
      setPrefetchingQuotes(true);
      const pageRedirectionDisabled = true;
      await dispatch(
        fetchQuotesAndSetQuoteState(
          history,
          fromTokenInputValue,
          maxSlippage,
          trackEvent,
          pageRedirectionDisabled,
        ),
      );
    };
    // Delay fetching quotes until a user is done typing an input value. If they type a new char in less than a second,
    // we will cancel previous setTimeout call and start running a new one.
    timeoutIdForQuotesPrefetching = setTimeout(() => {
      timeoutIdForQuotesPrefetching = null;
      if (!isReviewSwapButtonDisabled) {
        // Only do quotes prefetching if the Review swap button is enabled.
        prefetchQuotesWithoutRedirecting();
      }
    }, 1000);
    return () => clearTimeout(timeoutIdForQuotesPrefetching);
  }, [
    dispatch,
    history,
    maxSlippage,
    trackEvent,
    isReviewSwapButtonDisabled,
    fromTokenInputValue,
    fromTokenAddress,
    toTokenAddress,
    smartTransactionsOptInStatus,
  ]);

  let mainButtonText;
  if (!isReviewSwapButtonDisabled) {
    mainButtonText = t('swapFetchingQuotes');
  } else if (!selectedToToken?.address || !fromTokenAddress) {
    mainButtonText = t('swapSelectToken');
  } else if (swapsErrorKey && swapsErrorKey === QUOTES_NOT_AVAILABLE_ERROR) {
    mainButtonText = t('swap');
  } else {
    mainButtonText = t('swapEnterAmount');
  }

  const onTextFieldChange = (event) => {
    event.stopPropagation();
    // Automatically prefix value with 0. if user begins typing .
    const valueToUse = event.target.value === '.' ? '0.' : event.target.value;

    // Regex that validates strings with only numbers, 'x.', '.x', and 'x.x'
    const regexp = /^(\.\d+|\d+(\.\d+)?|\d+\.)$/u;
    // If the value is either empty or contains only numbers and '.' and only has one '.', update input to match
    if (valueToUse === '' || regexp.test(valueToUse)) {
      onInputChange(valueToUse, fromTokenBalance);
    } else {
      // otherwise, use the previously set inputValue (effectively denying the user from inputting the last char)
      // or an empty string if we do not yet have an inputValue
      onInputChange(fromTokenInputValue || '', fromTokenBalance);
    }
  };

  const hideSwapToTokenIf = useCallback(
    (item) => isEqualCaseInsensitive(item.address, fromTokenAddress),
    [fromTokenAddress],
  );

  const hideSwapFromTokenIf = useCallback(
    (item) => isEqualCaseInsensitive(item.address, selectedToToken?.address),
    [selectedToToken?.address],
  );

  const showReviewQuote =
    !swapsErrorKey && !isReviewSwapButtonDisabled && areQuotesPresent;
  const showQuotesLoadingAnimation =
    !swapsErrorKey && !isReviewSwapButtonDisabled && !areQuotesPresent;

  const tokenVerifiedOn1Source = occurrences === 1;

  useEffect(() => {
    if (swapsErrorKey === QUOTES_EXPIRED_ERROR) {
      history.push(SWAPS_NOTIFICATION_ROUTE);
    }
  }, [swapsErrorKey, history]);

  useEffect(() => {
    if (showQuotesLoadingAnimation) {
      setReceiveToAmount('');
    }
  }, [showQuotesLoadingAnimation]);

  return (
    <div className="prepare-swap-page">
      <div className="prepare-swap-page__content">
        {isSwapToOpen && (
          <Popover
            title={t('swapSwapTo')}
            className="smart-transactions-popover"
            onClose={onSwapToClose}
          >
            <Box
              paddingRight={6}
              paddingLeft={6}
              paddingTop={0}
              paddingBottom={0}
              display={DISPLAY.FLEX}
              className="smart-transactions-popover__content"
            >
              <ListWithSearch
                selectedItem={selectedToToken}
                itemsToSearch={tokensToSearchSwapTo}
                onClickItem={(item) => {
                  onToSelect?.(item);
                  onSwapToClose();
                }}
                maxListItems={30}
                searchQuery={swapToSearchQuery}
                setSearchQuery={setSwapToSearchQuery}
                hideItemIf={hideSwapToTokenIf}
              />
            </Box>
          </Popover>
        )}
        {isSwapFromOpen && (
          <Popover
            title={t('swapSwapFrom')}
            className="smart-transactions-popover"
            onClose={onSwapFromClose}
          >
            <Box
              paddingRight={6}
              paddingLeft={6}
              paddingTop={0}
              paddingBottom={0}
              display={DISPLAY.FLEX}
              className="smart-transactions-popover__content"
            >
              <ListWithSearch
                selectedItem={selectedFromToken}
                itemsToSearch={tokensToSearchSwapFrom}
                onClickItem={(item) => {
                  onFromSelect?.(item);
                  onSwapFromClose();
                }}
                maxListItems={30}
                searchQuery={swapFromSearchQuery}
                setSearchQuery={setSwapFromSearchQuery}
                hideItemIf={hideSwapFromTokenIf}
              />
            </Box>
          </Popover>
        )}
        {showSmartTransactionsOptInPopover && (
          <Popover
            title={t('stxAreHere')}
            footer={
              <>
                <Button type="primary" onClick={onEnableSmartTransactionsClick}>
                  {t('enableSmartTransactions')}
                </Button>
                <Box marginTop={1}>
                  <Text variant={TextVariant.bodyMd} as="h6">
                    <Button
                      type="link"
                      onClick={onCloseSmartTransactionsOptInPopover}
                      className="smart-transactions-popover__no-thanks-link"
                    >
                      {t('noThanksVariant2')}
                    </Button>
                  </Text>
                </Box>
              </>
            }
            footerClassName="smart-transactions-popover__footer"
            className="smart-transactions-popover"
          >
            <Box
              paddingRight={6}
              paddingLeft={6}
              paddingTop={0}
              paddingBottom={0}
              display={DISPLAY.FLEX}
              className="smart-transactions-popover__content"
            >
              <Box
                marginTop={0}
                marginBottom={4}
                display={DISPLAY.FLEX}
                flexDirection={FLEX_DIRECTION.COLUMN}
              >
                <img
                  src="./images/logo/smart-transactions-header.png"
                  alt={t('swapSwapSwitch')}
                />
              </Box>
              <Typography variant={TypographyVariant.H7} marginTop={0}>
                {t('stxDescription')}
              </Typography>
              <Typography
                as="ul"
                variant={TypographyVariant.H7}
                fontWeight={FONT_WEIGHT.BOLD}
                marginTop={3}
              >
                <li>{t('stxBenefit1')}</li>
                <li>{t('stxBenefit2')}</li>
                <li>{t('stxBenefit3')}</li>
                <li>
                  {t('stxBenefit4')}
                  <Typography
                    as="span"
                    fontWeight={FONT_WEIGHT.NORMAL}
                    variant={TypographyVariant.H7}
                  >
                    {' *'}
                  </Typography>
                </li>
              </Typography>
              <Typography
                variant={TypographyVariant.H8}
                color={TextColor.textAlternative}
                boxProps={{ marginTop: 3 }}
              >
                {t('stxSubDescription')}&nbsp;
                <Typography
                  as="span"
                  fontWeight={FONT_WEIGHT.BOLD}
                  variant={TypographyVariant.H8}
                  color={TextColor.textAlternative}
                >
                  {t('stxYouCanOptOut')}&nbsp;
                </Typography>
              </Typography>
            </Box>
          </Popover>
        )}
        <div className="prepare-swap-page__swap-from-content">
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
          >
            <SelectedToken
              onClick={onSwapFromOpen}
              selectedToken={selectedFromToken}
            />
            <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
              <TextField
                className="prepare-swap-page__from-token-amount"
                size={Size.SM}
                placeholder="0"
                onChange={onTextFieldChange}
                value={fromTokenInputValue}
                truncate={false}
              />
            </Box>
          </Box>
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.stretch}
          >
            <div className="prepare-swap-page__balance-message">
              {fromTokenSymbol && swapYourTokenBalance}
              {fromTokenSymbol &&
                !isSwapsDefaultTokenSymbol(fromTokenSymbol, chainId) && (
                  <div
                    className="prepare-swap-page__max-button"
                    data-testid="prepare-swap-page__max-button"
                    onClick={() =>
                      onInputChange(fromTokenBalance || '0', fromTokenBalance)
                    }
                  >
                    {t('max')}
                  </div>
                )}
            </div>
            {fromTokenInputValue && swapFromFiatValue && (
              <Box
                display={DISPLAY.FLEX}
                justifyContent={JustifyContent.flexEnd}
                alignItems={AlignItems.flexEnd}
              >
                <Text
                  variant={TextVariant.bodySm}
                  as="h7"
                  color={TextColor.textAlternative}
                >
                  {swapFromFiatValue}
                </Text>
              </Box>
            )}
          </Box>
          {!fromTokenError && balanceError && fromTokenSymbol && (
            <Box
              display={DISPLAY.FLEX}
              justifyContent={JustifyContent.flexStart}
            >
              <Text
                variant={TextVariant.bodySmBold}
                as="h7"
                color={TextColor.textAlternative}
                marginTop={0}
              >
                {t('swapsNotEnoughToken', [fromTokenSymbol])}
              </Text>
            </Box>
          )}
          {fromTokenError && (
            <Box
              display={DISPLAY.FLEX}
              justifyContent={JustifyContent.flexStart}
            >
              <Text
                variant={TextVariant.bodySmBold}
                as="h7"
                color={TextColor.textAlternative}
                marginTop={0}
              >
                {t('swapTooManyDecimalsError', [
                  fromTokenSymbol,
                  fromTokenDecimals,
                ])}
              </Text>
            </Box>
          )}
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.center}
            height={0}
          >
            <div
              className={classnames('prepare-swap-page__switch-tokens', {
                'prepare-swap-page__switch-tokens--rotate': rotateSwitchTokens,
              })}
              onClick={() => {
                onToSelect(selectedFromToken);
                onFromSelect(selectedToToken);
                setRotateSwitchTokens(!rotateSwitchTokens);
              }}
              style={{ cursor: 'pointer' }}
              title={t('swapSwapSwitch')}
            >
              <Icon name={ICON_NAMES.ARROW_2_DOWN} size={ICON_SIZES.LG} />
            </div>
          </Box>
        </div>
        <div className="prepare-swap-page__swap-to-content">
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
          >
            <SelectedToken
              onClick={onSwapToOpen}
              selectedToken={selectedToToken}
            />
            <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
              <Text variant={TextVariant.headingSm} as="h4">
                {receiveToAmount}
              </Text>
            </Box>
          </Box>
        </div>
        {!showReviewQuote && toTokenIsNotDefault && occurrences < 2 && (
          <Box display={DISPLAY.FLEX} marginTop={2}>
            <BannerAlert
              severity={
                tokenVerifiedOn1Source ? SEVERITIES.WARNING : SEVERITIES.DANGER
              }
              title={
                tokenVerifiedOn1Source
                  ? t('swapTokenVerifiedOn1SourceTitle')
                  : t('swapTokenAddedManuallyTitle')
              }
              width={BLOCK_SIZES.FULL}
            >
              <Box>
                <Text variant={TextVariant.bodyMd} as="h6">
                  {tokenVerifiedOn1Source
                    ? t('swapTokenVerifiedOn1SourceDescription', [
                        selectedToToken?.symbol,
                        <BlockExplorerLink key="block-explorer-link" />,
                      ])
                    : t('swapTokenAddedManuallyDescription', [
                        <BlockExplorerLink key="block-explorer-link" />,
                      ])}
                </Text>
                {!verificationClicked && (
                  <ButtonLink
                    size={Size.INHERIT}
                    textProps={{
                      variant: TextVariant.bodyMd,
                      alignItems: AlignItems.flexStart,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      setVerificationClicked(true);
                    }}
                  >
                    {t('swapContinueSwapping')}
                  </ButtonLink>
                )}
              </Box>
            </BannerAlert>
          </Box>
        )}
        {swapsErrorKey && (
          <Box display={DISPLAY.FLEX} marginTop={2}>
            <SwapsBannerAlert swapsErrorKey={swapsErrorKey} />
          </Box>
        )}
        {transactionSettingsOpened &&
          (smartTransactionsEnabled ||
            (!smartTransactionsEnabled && !isDirectWrappingEnabled)) && (
            <TransactionSettings
              onSelect={(newSlippage) => {
                dispatch(setMaxSlippage(newSlippage));
              }}
              maxAllowedSlippage={MAX_ALLOWED_SLIPPAGE}
              currentSlippage={maxSlippage}
              smartTransactionsEnabled={smartTransactionsEnabled}
              smartTransactionsOptInStatus={smartTransactionsOptInStatus}
              setSmartTransactionsOptInStatus={setSmartTransactionsOptInStatus}
              currentSmartTransactionsError={currentSmartTransactionsError}
              isDirectWrappingEnabled={isDirectWrappingEnabled}
              onModalClose={() => {
                dispatch(setTransactionSettingsOpened(false));
              }}
            />
          )}
        {showQuotesLoadingAnimation && (
          <Box
            marginTop={4}
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            flexDirection={FLEX_DIRECTION.COLUMN}
          >
            <Box
              display={DISPLAY.FLEX}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
            >
              <Text
                variant={TextVariant.bodyMd}
                as="h6"
                color={TextColor.textAlternative}
                marginLeft={1}
                marginRight={1}
              >
                {t('swapFetchingQuote')}
              </Text>
              <Text
                variant={TextVariant.bodyMdBold}
                as="h6"
                color={TextColor.textAlternative}
              >
                {t('swapQuoteNofM', [
                  Math.min(quoteCount + 1, numberOfAggregators),
                  numberOfAggregators,
                ])}
              </Text>
            </Box>
            <div className="mascot-background-animation__animation">
              <MascotBackgroundAnimation />
              <div className="mascot-background-animation__mascot-container">
                <Mascot
                  animationEventEmitter={animationEventEmitter.current}
                  width="42"
                  height="42"
                  followMouse={false}
                />
              </div>
            </div>
          </Box>
        )}
        {!areQuotesPresent && (
          <SwapsFooter
            submitText={mainButtonText}
            disabled
            hideCancel
            showTermsOfService
          />
        )}
        {showReviewQuote && (
          <ReviewQuote setReceiveToAmount={setReceiveToAmount} />
        )}
      </div>
    </div>
  );
}

PrepareSwap.propTypes = {
  ethBalance: PropTypes.string,
  selectedAccountAddress: PropTypes.string,
  shuffledTokensList: PropTypes.array,
};
