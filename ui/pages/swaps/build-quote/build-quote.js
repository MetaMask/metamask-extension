import React, { useContext, useEffect, useState, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { uniqBy, isEqual } from 'lodash';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  useTokensToSearch,
  getRenderableTokenData,
} from '../../../hooks/useTokensToSearch';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import { I18nContext } from '../../../contexts/i18n';
import DropdownInputPair from '../dropdown-input-pair';
import DropdownSearchList from '../dropdown-search-list';
import SlippageButtons from '../slippage-buttons';
import { getTokens, getConversionRate } from '../../../ducks/metamask/metamask';
import InfoTooltip from '../../../components/ui/info-tooltip';
import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import {
  TYPOGRAPHY,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  COLORS,
} from '../../../helpers/constants/design-system';
import {
  VIEW_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
} from '../../../helpers/constants/routes';

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
  getSmartTransactionFees,
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
  getUseCurrencyRateCheck,
} from '../../../selectors';

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
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  TOKEN_BUCKET_PRIORITY,
} from '../../../../shared/constants/swaps';

import {
  resetSwapsPostFetchState,
  ignoreTokens,
  setBackgroundSwapRouteState,
  clearSwapsQuotes,
  stopPollingForQuotes,
  setSmartTransactionsOptInStatus,
  clearSmartTransactionFees,
} from '../../../store/actions';
import {
  countDecimals,
  fetchTokenPrice,
  fetchTokenBalance,
} from '../swaps.util';
import SwapsFooter from '../swaps-footer';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { shouldEnableDirectWrapping } from '../../../../shared/lib/swaps-utils';
import {
  getValueFromWeiHex,
  hexToDecimal,
} from '../../../../shared/modules/conversion.utils';

const fuseSearchKeys = [
  { name: 'name', weight: 0.499 },
  { name: 'symbol', weight: 0.499 },
  { name: 'address', weight: 0.002 },
];

const MAX_ALLOWED_SLIPPAGE = 15;

let timeoutIdForQuotesPrefetching;

export default function BuildQuote({
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
  const areQuotesPresent = Object.keys(quotes).length > 0;

  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatus,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const smartTransactionFees = useSelector(getSmartTransactionFees);
  const smartTransactionsOptInPopoverDisplayed =
    smartTransactionsOptInStatus !== undefined;
  const currentSmartTransactionsError = useSelector(
    getCurrentSmartTransactionsError,
  );
  const currentCurrency = useSelector(getCurrentCurrency);

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

  const { loading, tokensWithBalances } = useTokenTracker(tokens);

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
    tokenBucketPriority: TOKEN_BUCKET_PRIORITY.OWNED,
  });
  const tokensToSearchSwapTo = useTokensToSearch({
    usersTokens: memoizedUsersTokens,
    topTokens: topAssets,
    shuffledTokensList,
    tokenBucketPriority: TOKEN_BUCKET_PRIORITY.TOP,
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
      showFiat: useCurrencyRateCheck,
    },
    true,
  );
  const swapFromEthFiatValue = useEthFiatAmount(
    fromTokenInputValue || 0,
    { showFiat: useCurrencyRateCheck },
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

  const hideDropdownItemIf = useCallback(
    (item) => isEqualCaseInsensitive(item.address, fromTokenAddress),
    [fromTokenAddress],
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

  const trackBuildQuotePageLoadedEvent = useCallback(() => {
    trackEvent({
      event: 'Build Quote Page Loaded',
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

  useEffect(() => {
    if (smartTransactionsEnabled && smartTransactionFees?.tradeTxFees) {
      // We want to clear STX fees, because we only want to use fresh ones on the View Quote page.
      clearSmartTransactionFees();
    }
  }, [smartTransactionsEnabled, smartTransactionFees]);

  const BlockExplorerLink = () => {
    return (
      <a
        className="build-quote__token-etherscan-link build-quote__underline"
        key="build-quote-etherscan-link"
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

  let tokenVerificationDescription = '';
  if (blockExplorerTokenLink) {
    if (occurrences === 1) {
      tokenVerificationDescription = t('verifyThisTokenOn', [
        <BlockExplorerLink key="block-explorer-link" />,
      ]);
    } else if (occurrences === 0) {
      tokenVerificationDescription = t('verifyThisUnconfirmedTokenOn', [
        <BlockExplorerLink key="block-explorer-link" />,
      ]);
    }
  }

  const swapYourTokenBalance = t('swapYourTokenBalance', [
    fromTokenString || '0',
    fromTokenSymbol || SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]?.symbol || '',
  ]);

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
    (toTokenIsNotDefault && occurrences < 2 && !verificationClicked);

  // It's triggered every time there is a change in form values (token from, token to, amount and slippage).
  useEffect(() => {
    dispatch(clearSwapsQuotes());
    dispatch(stopPollingForQuotes());
    const prefetchQuotesWithoutRedirecting = async () => {
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

  return (
    <div className="build-quote">
      <div className="build-quote__content">
        {showSmartTransactionsOptInPopover && (
          <Popover
            title={t('stxAreHere')}
            footer={
              <>
                <Button type="primary" onClick={onEnableSmartTransactionsClick}>
                  {t('enableSmartTransactions')}
                </Button>
                <Box marginTop={1}>
                  <Typography variant={TYPOGRAPHY.H6}>
                    <Button
                      type="link"
                      onClick={onCloseSmartTransactionsOptInPopover}
                      className="smart-transactions-popover__no-thanks-link"
                    >
                      {t('noThanksVariant2')}
                    </Button>
                  </Typography>
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
              <Typography variant={TYPOGRAPHY.H7} marginTop={0}>
                {t('stxDescription')}
              </Typography>
              <Typography
                as="ul"
                variant={TYPOGRAPHY.H7}
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
                    variant={TYPOGRAPHY.H7}
                  >
                    {' *'}
                  </Typography>
                </li>
              </Typography>
              <Typography
                variant={TYPOGRAPHY.H8}
                color={COLORS.TEXT_ALTERNATIVE}
                boxProps={{ marginTop: 3 }}
              >
                {t('stxSubDescription')}&nbsp;
                <Typography
                  as="span"
                  fontWeight={FONT_WEIGHT.BOLD}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.TEXT_ALTERNATIVE}
                >
                  {t('stxYouCanOptOut')}&nbsp;
                </Typography>
              </Typography>
            </Box>
          </Popover>
        )}
        <div className="build-quote__dropdown-input-pair-header">
          <div className="build-quote__input-label">{t('swapSwapFrom')}</div>
          {!isSwapsDefaultTokenSymbol(fromTokenSymbol, chainId) && (
            <div
              className="build-quote__max-button"
              data-testid="build-quote__max-button"
              onClick={() =>
                onInputChange(fromTokenBalance || '0', fromTokenBalance)
              }
            >
              {t('max')}
            </div>
          )}
        </div>
        <DropdownInputPair
          onSelect={onFromSelect}
          itemsToSearch={tokensToSearchSwapFrom}
          onInputChange={(value) => {
            /* istanbul ignore next */
            onInputChange(value, fromTokenBalance);
          }}
          inputValue={fromTokenInputValue}
          leftValue={fromTokenInputValue && swapFromFiatValue}
          selectedItem={selectedFromToken}
          maxListItems={30}
          loading={
            loading &&
            (!tokensToSearchSwapFrom?.length ||
              !topAssets ||
              !Object.keys(topAssets).length)
          }
          selectPlaceHolderText={t('swapSelect')}
          hideItemIf={(item) =>
            isEqualCaseInsensitive(item.address, selectedToToken?.address)
          }
          listContainerClassName="build-quote__open-dropdown"
          autoFocus
        />
        <div
          className={classnames('build-quote__balance-message', {
            'build-quote__balance-message--error':
              balanceError || fromTokenError,
          })}
        >
          {!fromTokenError &&
            !balanceError &&
            fromTokenSymbol &&
            swapYourTokenBalance}
          {!fromTokenError && balanceError && fromTokenSymbol && (
            <div className="build-quite__insufficient-funds">
              <div className="build-quite__insufficient-funds-first">
                {t('swapsNotEnoughForTx', [fromTokenSymbol])}
              </div>
              <div className="build-quite__insufficient-funds-second">
                {swapYourTokenBalance}
              </div>
            </div>
          )}
          {fromTokenError && (
            <>
              <div className="build-quote__form-error">
                {t('swapTooManyDecimalsError', [
                  fromTokenSymbol,
                  fromTokenDecimals,
                ])}
              </div>
              <div>{swapYourTokenBalance}</div>
            </>
          )}
        </div>
        <div className="build-quote__swap-arrows-row">
          <button
            className="build-quote__swap-arrows"
            data-testid="build-quote__swap-arrows"
            onClick={() => {
              onToSelect(selectedFromToken);
              onFromSelect(selectedToToken);
            }}
          >
            <i className="fa fa-arrow-up" title={t('swapSwapSwitch')} />
            <i className="fa fa-arrow-down" title={t('swapSwapSwitch')} />
          </button>
        </div>
        <div className="build-quote__dropdown-swap-to-header">
          <div className="build-quote__input-label">{t('swapSwapTo')}</div>
        </div>
        <div className="dropdown-input-pair dropdown-input-pair__to">
          <DropdownSearchList
            startingItem={selectedToToken}
            itemsToSearch={tokensToSearchSwapTo}
            fuseSearchKeys={fuseSearchKeys}
            selectPlaceHolderText={t('swapSelectAToken')}
            maxListItems={30}
            onSelect={onToSelect}
            loading={
              loading &&
              (!tokensToSearchSwapTo?.length ||
                !topAssets ||
                !Object.keys(topAssets).length)
            }
            externallySelectedItem={selectedToToken}
            hideItemIf={hideDropdownItemIf}
            listContainerClassName="build-quote__open-to-dropdown"
            hideRightLabels
            defaultToAll
            shouldSearchForImports
          />
        </div>
        {toTokenIsNotDefault &&
          (occurrences < 2 ? (
            <ActionableMessage
              type={occurrences === 1 ? 'warning' : 'danger'}
              message={
                <div className="build-quote__token-verification-warning-message">
                  <div className="build-quote__bold">
                    {occurrences === 1
                      ? t('swapTokenVerificationOnlyOneSource')
                      : t('swapTokenVerificationAddedManually')}
                  </div>
                  <div>{tokenVerificationDescription}</div>
                </div>
              }
              primaryAction={
                /* istanbul ignore next */
                verificationClicked
                  ? null
                  : {
                      label: t('continue'),
                      onClick: () => setVerificationClicked(true),
                    }
              }
              withRightButton
              infoTooltipText={
                blockExplorerTokenLink &&
                t('swapVerifyTokenExplanation', [blockExplorerLabel])
              }
            />
          ) : (
            <div className="build-quote__token-message">
              <span
                className="build-quote__bold"
                key="token-verification-bold-text"
              >
                {t('swapTokenVerificationSources', [occurrences])}
              </span>
              {blockExplorerTokenLink && (
                <>
                  {t('swapTokenVerificationMessage', [
                    <a
                      className="build-quote__token-etherscan-link"
                      key="build-quote-etherscan-link"
                      onClick={() => {
                        /* istanbul ignore next */
                        trackEvent({
                          event: 'Clicked Block Explorer Link',
                          category: EVENT.CATEGORIES.SWAPS,
                          properties: {
                            link_type: 'Token Tracker',
                            action: 'Swaps Confirmation',
                            block_explorer_domain: getURLHostName(
                              blockExplorerTokenLink,
                            ),
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
                    </a>,
                  ])}
                  <InfoTooltip
                    position="top"
                    contentText={t('swapVerifyTokenExplanation', [
                      blockExplorerLabel,
                    ])}
                    containerClassName="build-quote__token-tooltip-container"
                    key="token-verification-info-tooltip"
                  />
                </>
              )}
            </div>
          ))}
        {(smartTransactionsEnabled ||
          (!smartTransactionsEnabled && !isDirectWrappingEnabled)) && (
          <div className="build-quote__slippage-buttons-container">
            <SlippageButtons
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
            />
          </div>
        )}
      </div>
      <SwapsFooter
        onSubmit={
          /* istanbul ignore next */
          async () => {
            // We need this to know how long it took to go from clicking on the Review swap button to rendered View Quote page.
            dispatch(setReviewSwapClickedTimestamp(Date.now()));
            // In case that quotes prefetching is waiting to be executed, but hasn't started yet,
            // we want to cancel it and fetch quotes from here.
            if (timeoutIdForQuotesPrefetching) {
              clearTimeout(timeoutIdForQuotesPrefetching);
              dispatch(
                fetchQuotesAndSetQuoteState(
                  history,
                  fromTokenInputValue,
                  maxSlippage,
                  trackEvent,
                ),
              );
            } else if (areQuotesPresent) {
              // If there are prefetched quotes already, go directly to the View Quote page.
              history.push(VIEW_QUOTE_ROUTE);
            } else {
              // If the "Review swap" button was clicked while quotes are being fetched, go to the Loading Quotes page.
              await dispatch(setBackgroundSwapRouteState('loading'));
              history.push(LOADING_QUOTES_ROUTE);
            }
          }
        }
        submitText={t('swapReviewSwap')}
        disabled={isReviewSwapButtonDisabled}
        hideCancel
        showTermsOfService
      />
    </div>
  );
}

BuildQuote.propTypes = {
  ethBalance: PropTypes.string,
  selectedAccountAddress: PropTypes.string,
  shuffledTokensList: PropTypes.array,
};
