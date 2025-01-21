import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'classnames';
import { debounce } from 'lodash';
import { useHistory, useLocation } from 'react-router-dom';
import { BigNumber } from 'bignumber.js';
import { type TokenListMap } from '@metamask/assets-controllers';
import {
  setFromToken,
  setFromTokenInputValue,
  setSelectedQuote,
  setToChain,
  setToChainId,
  setToToken,
  updateQuoteRequestParams,
  resetBridgeState,
} from '../../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getQuoteRequest,
  getSlippage,
  getToChain,
  getToChains,
  getToToken,
  getToTokens,
  getWasTxDeclined,
  getFromAmountInCurrency,
  getValidationErrors,
  getBridgeQuotesConfig,
} from '../../../ducks/bridge/selectors';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  ButtonIcon,
  IconName,
  PopoverPosition,
  Text,
} from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../../shared/constants/swaps';
import { useTokensWithFiltering } from '../../../hooks/bridge/useTokensWithFiltering';
import { setActiveNetwork } from '../../../store/actions';
import {
  hexToDecimal,
  decimalToPrefixedHex,
} from '../../../../shared/modules/conversion.utils';
import type { QuoteRequest } from '../../../../shared/types/bridge';
import { calcTokenValue } from '../../../../shared/lib/swaps-utils';
import { BridgeQuoteCard } from '../quotes/bridge-quote-card';
import {
  formatTokenAmount,
  isQuoteExpired as isQuoteExpiredUtil,
} from '../utils/quote';
import { isValidQuoteRequest } from '../../../../shared/modules/bridge-utils/quote';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import {
  CrossChainSwapsEventProperties,
  useCrossChainSwapsEventTracker,
} from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { isNetworkAdded } from '../../../ducks/bridge/utils';
import { Footer } from '../../../components/multichain/pages/page';
import MascotBackgroundAnimation from '../../swaps/mascot-background-animation/mascot-background-animation';
import { Column, Row, Tooltip } from '../layout';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import { getCurrentKeyring, getLocale, getTokenList } from '../../../selectors';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { SECOND } from '../../../../shared/constants/time';
import { BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE } from '../../../../shared/constants/bridge';
import { BridgeInputGroup } from './bridge-input-group';
import { BridgeCTAButton } from './bridge-cta-button';

const PrepareBridgePage = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const fromTokens = useSelector(getTokenList) as TokenListMap;
  const isFromTokensLoading = useMemo(
    () => Object.keys(fromTokens).length === 0,
    [fromTokens],
  );

  const toToken = useSelector(getToToken);
  const {
    toTokens,
    toTopAssets,
    isLoading: isToTokensLoading,
  } = useSelector(getToTokens);

  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);
  const fromAmountInFiat = useSelector(getFromAmountInCurrency);

  const providerConfig = useSelector(getProviderConfig);
  const slippage = useSelector(getSlippage);

  const quoteRequest = useSelector(getQuoteRequest);
  const {
    isLoading,
    activeQuote: activeQuote_,
    isQuoteGoingToRefresh,
    quotesLastFetchedMs,
  } = useSelector(getBridgeQuotes);
  const { refreshRate } = useSelector(getBridgeQuotesConfig);

  const wasTxDeclined = useSelector(getWasTxDeclined);
  // If latest quote is expired and user has sufficient balance
  // set activeQuote to undefined to hide stale quotes but keep inputs filled
  const isQuoteExpired = isQuoteExpiredUtil(
    isQuoteGoingToRefresh,
    refreshRate,
    quotesLastFetchedMs,
  );
  const activeQuote =
    isQuoteExpired && !quoteRequest.insufficientBal ? undefined : activeQuote_;

  const keyring = useSelector(getCurrentKeyring);
  // @ts-expect-error keyring type is wrong maybe?
  const isUsingHardwareWallet = isHardwareKeyring(keyring.type);
  const locale = useSelector(getLocale);

  const ticker = useSelector(getNativeCurrency);
  const {
    isEstimatedReturnLow,
    isNoQuotesAvailable,
    isInsufficientGasForQuote,
    isInsufficientBalance,
  } = useSelector(getValidationErrors);
  const { quotesRefreshCount } = useSelector(getBridgeQuotes);
  const { openBuyCryptoInPdapp } = useRamps();

  const { balanceAmount: nativeAssetBalance } = useLatestBalance(
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
      fromChain?.chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
    ],
    fromChain?.chainId,
  );

  const { balanceAmount: srcTokenBalance } = useLatestBalance(
    fromToken,
    fromChain?.chainId,
  );

  const toTokenListGenerator = useTokensWithFiltering(
    toTokens,
    toTopAssets,
    toChain?.chainId,
  );

  const { flippedRequestProperties } = useRequestProperties();
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();

  const millisecondsUntilNextRefresh = useCountdownTimer();

  const [rotateSwitchTokens, setRotateSwitchTokens] = useState(false);

  // Resets the banner visibility when the estimated return is low
  const [isLowReturnBannerOpen, setIsLowReturnBannerOpen] = useState(true);
  useEffect(() => setIsLowReturnBannerOpen(true), [quotesRefreshCount]);

  // Background updates are debounced when the switch button is clicked
  // To prevent putting the frontend in an unexpected state, prevent the user
  // from switching tokens within the debounce period
  const [isSwitchingTemporarilyDisabled, setIsSwitchingTemporarilyDisabled] =
    useState(false);
  useEffect(() => {
    setIsSwitchingTemporarilyDisabled(true);
    const switchButtonTimer = setTimeout(() => {
      setIsSwitchingTemporarilyDisabled(false);
    }, SECOND);

    return () => {
      clearTimeout(switchButtonTimer);
    };
  }, [rotateSwitchTokens]);

  useEffect(() => {
    // If there's an active quote, assume that the user is returning to the page
    if (activeQuote) {
      // Get input data from active quote
      const { srcAsset, destAsset, destChainId, srcChainId } =
        activeQuote.quote;
      const quoteDestChainId = decimalToPrefixedHex(destChainId);
      const quoteSrcChainId = decimalToPrefixedHex(srcChainId);

      if (srcAsset && destAsset && quoteDestChainId) {
        // Set inputs to values from active quote
        dispatch(setToChainId(quoteDestChainId));
        dispatch(
          setToToken({
            ...destAsset,
            chainId: quoteDestChainId,
            image: destAsset.icon,
            address: destAsset.address.toLowerCase(),
          }),
        );
        dispatch(
          setFromToken({
            ...srcAsset,
            chainId: quoteSrcChainId,
            image: srcAsset.icon,
            address: srcAsset.address.toLowerCase(),
          }),
        );
      }
    } else {
      // Reset controller and inputs on load
      dispatch(resetBridgeState());
    }
  }, []);

  // Scroll to bottom of the page when banners are shown
  const insufficientBalanceBannerRef = useRef<HTMLDivElement>(null);
  const isEstimatedReturnLowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isInsufficientGasForQuote(nativeAssetBalance)) {
      insufficientBalanceBannerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    if (isEstimatedReturnLow) {
      isEstimatedReturnLowRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [
    isEstimatedReturnLow,
    isInsufficientGasForQuote(nativeAssetBalance),
    isLowReturnBannerOpen,
  ]);

  const quoteParams = useMemo(
    () => ({
      srcTokenAddress: fromToken?.address,
      destTokenAddress: toToken?.address || undefined,
      srcTokenAmount:
        fromAmount && fromToken?.decimals
          ? calcTokenValue(
              // Treat empty or incomplete amount as 0 to reject NaN
              ['', '.'].includes(fromAmount) ? '0' : fromAmount,
              fromToken.decimals,
            ).toFixed()
          : undefined,
      srcChainId: fromChain?.chainId
        ? Number(hexToDecimal(fromChain.chainId))
        : undefined,
      destChainId: toChain?.chainId
        ? Number(hexToDecimal(toChain.chainId))
        : undefined,
      // This override allows quotes to be returned when the rpcUrl is a tenderly fork
      // Otherwise quotes get filtered out by the bridge-api when the wallet's real
      // balance is less than the tenderly balance
      insufficientBal: Boolean(providerConfig?.rpcUrl?.includes('tenderly')),
      slippage,
    }),
    [
      fromToken,
      toToken,
      fromChain?.chainId,
      toChain?.chainId,
      fromAmount,
      providerConfig,
      slippage,
    ],
  );

  const debouncedUpdateQuoteRequestInController = useCallback(
    debounce((p: Partial<QuoteRequest>) => {
      dispatch(updateQuoteRequestParams(p));
      dispatch(setSelectedQuote(null));
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedUpdateQuoteRequestInController(quoteParams);
  }, Object.values(quoteParams));

  const trackInputEvent = useCallback(
    (
      properties: CrossChainSwapsEventProperties[MetaMetricsEventName.InputChanged],
    ) => {
      trackCrossChainSwapsEvent({
        event: MetaMetricsEventName.InputChanged,
        properties,
      });
    },
    [],
  );

  const { search } = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!fromChain?.chainId || isFromTokensLoading) {
      return;
    }

    const searchParams = new URLSearchParams(search);
    const tokenAddressFromUrl = searchParams.get('token');
    if (!tokenAddressFromUrl) {
      return;
    }

    const removeTokenFromUrl = () => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('token');
      history.replace({
        search: newParams.toString(),
      });
    };

    switch (tokenAddressFromUrl) {
      case fromToken?.address?.toLowerCase():
        // If the token is already set, remove the query param
        removeTokenFromUrl();
        break;
      case fromTokens[tokenAddressFromUrl]?.address?.toLowerCase(): {
        // If there is a match, set it as the fromToken
        const matchedToken = fromTokens[tokenAddressFromUrl];
        dispatch(
          setFromToken({
            ...matchedToken,
            image: matchedToken.iconUrl,
            chainId: fromChain.chainId,
          }),
        );
        removeTokenFromUrl();
        break;
      }
      default:
        // Otherwise remove query param
        removeTokenFromUrl();
        break;
    }
  }, [fromChain, fromToken, fromTokens, search, isFromTokensLoading]);

  return (
    <Column className="prepare-bridge-page" gap={8}>
      <BridgeInputGroup
        header={t('bridgeFrom')}
        token={fromToken}
        onAmountChange={(e) => {
          dispatch(setFromTokenInputValue(e));
        }}
        onAssetChange={(token) => {
          dispatch(setFromToken(token));
          dispatch(setFromTokenInputValue(null));
          token?.address &&
            trackInputEvent({
              input: 'token_source',
              value: token.address,
            });
        }}
        networkProps={{
          network: fromChain,
          networks: fromChains,
          onNetworkChange: (networkConfig) => {
            networkConfig.chainId !== fromChain?.chainId &&
              trackInputEvent({
                input: 'chain_source',
                value: networkConfig.chainId,
              });
            if (networkConfig.chainId === toChain?.chainId) {
              dispatch(setToChainId(null));
              dispatch(setToToken(null));
            }
            if (isNetworkAdded(networkConfig)) {
              dispatch(
                setActiveNetwork(
                  networkConfig.rpcEndpoints[
                    networkConfig.defaultRpcEndpointIndex
                  ].networkClientId,
                ),
              );
            }
            dispatch(setFromToken(null));
            dispatch(setFromTokenInputValue(null));
          },
          header: t('yourNetworks'),
        }}
        isMultiselectEnabled
        onMaxButtonClick={(value: string) => {
          dispatch(setFromTokenInputValue(value));
        }}
        amountInFiat={fromAmountInFiat}
        amountFieldProps={{
          testId: 'from-amount',
          autoFocus: true,
          value: fromAmount || undefined,
        }}
        isTokenListLoading={isFromTokensLoading}
      />

      <Column
        height={BlockSize.Full}
        paddingTop={8}
        backgroundColor={BackgroundColor.backgroundAlternativeSoft}
        style={{
          position: 'relative',
        }}
      >
        <Box
          className="prepare-bridge-page__switch-tokens"
          display={Display.Flex}
          backgroundColor={BackgroundColor.backgroundAlternativeSoft}
          style={{
            position: 'absolute',
            top: 'calc(-20px + 1px)',
            right: 'calc(50% - 20px)',
            border: '2px solid var(--color-background-default)',
            borderRadius: '100%',
            opacity: 1,
            width: 40,
            height: 40,
            justifyContent: JustifyContent.center,
          }}
        >
          <ButtonIcon
            iconProps={{
              className: classnames({
                rotate: rotateSwitchTokens,
              }),
            }}
            style={{
              alignSelf: 'center',
              borderRadius: '100%',
              width: '100%',
              height: '100%',
            }}
            data-testid="switch-tokens"
            ariaLabel="switch-tokens"
            iconName={IconName.Arrow2Down}
            color={IconColor.iconAlternativeSoft}
            disabled={
              isSwitchingTemporarilyDisabled ||
              !isValidQuoteRequest(quoteRequest, false) ||
              !isNetworkAdded(toChain)
            }
            onClick={() => {
              if (!isNetworkAdded(toChain)) {
                return;
              }
              setRotateSwitchTokens(!rotateSwitchTokens);
              flippedRequestProperties &&
                trackCrossChainSwapsEvent({
                  event: MetaMetricsEventName.InputSourceDestinationFlipped,
                  properties: flippedRequestProperties,
                });
              const toChainClientId =
                toChain?.defaultRpcEndpointIndex !== undefined &&
                toChain?.rpcEndpoints
                  ? toChain.rpcEndpoints[toChain.defaultRpcEndpointIndex]
                      .networkClientId
                  : undefined;
              toChainClientId && dispatch(setActiveNetwork(toChainClientId));
              dispatch(setFromToken(toToken));
              fromChain?.chainId && dispatch(setToChain(fromChain.chainId));
              fromChain?.chainId && dispatch(setToChainId(fromChain.chainId));
              dispatch(setToToken(fromToken));
            }}
          />
        </Box>

        <BridgeInputGroup
          header={t('swapSelectToken')}
          token={toToken}
          onAssetChange={(token) => {
            token?.address &&
              trackInputEvent({
                input: 'token_destination',
                value: token.address,
              });
            dispatch(setToToken(token));
          }}
          networkProps={{
            network: toChain,
            networks: toChains,
            onNetworkChange: (networkConfig) => {
              networkConfig.chainId !== toChain?.chainId &&
                trackInputEvent({
                  input: 'chain_destination',
                  value: networkConfig.chainId,
                });
              dispatch(setToChainId(networkConfig.chainId));
              dispatch(setToChain(networkConfig.chainId));
              dispatch(setToToken(null));
            },
            header: t('bridgeTo'),
            shouldDisableNetwork: ({ chainId }) =>
              chainId === fromChain?.chainId,
          }}
          customTokenListGenerator={
            toChain && toTokens && toTopAssets
              ? toTokenListGenerator
              : undefined
          }
          amountInFiat={
            activeQuote?.toTokenAmount?.valueInCurrency || undefined
          }
          amountFieldProps={{
            testId: 'to-amount',
            readOnly: true,
            disabled: true,
            value: activeQuote?.toTokenAmount?.amount
              ? formatTokenAmount(locale, activeQuote.toTokenAmount.amount)
              : '0',
            autoFocus: false,
            className: activeQuote?.toTokenAmount?.amount
              ? 'amount-input defined'
              : 'amount-input',
          }}
          isTokenListLoading={isToTokensLoading}
        />
        <Column height={BlockSize.Full} justifyContent={JustifyContent.center}>
          {isLoading && !activeQuote ? (
            <>
              <Text
                textAlign={TextAlign.Center}
                color={TextColor.textAlternativeSoft}
              >
                {t('swapFetchingQuotes')}
              </Text>
              <MascotBackgroundAnimation height="64" width="64" />
            </>
          ) : null}
        </Column>

        <Row padding={6}>
          <Column
            gap={3}
            className={activeQuote ? 'highlight' : ''}
            style={{
              paddingBottom: activeQuote?.approval ? 16 : 'revert-layer',
              paddingTop: activeQuote?.approval ? 16 : undefined,
              paddingInline: 16,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {activeQuote && isQuoteGoingToRefresh && (
              <Row
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: `calc(100% * (${refreshRate} - ${millisecondsUntilNextRefresh}) / ${refreshRate})`,
                  height: 4,
                  maxWidth: '100%',
                  transition: 'width 1s linear',
                }}
                backgroundColor={BackgroundColor.primaryMuted}
              />
            )}
            {!wasTxDeclined && activeQuote && <BridgeQuoteCard />}
            <Footer padding={0} flexDirection={FlexDirection.Column} gap={2}>
              <BridgeCTAButton
                onFetchNewQuotes={() => {
                  debouncedUpdateQuoteRequestInController(quoteParams);
                }}
              />
              {activeQuote?.approval && fromAmount && fromToken ? (
                <Row justifyContent={JustifyContent.center} gap={1}>
                  <Text
                    color={TextColor.textAlternativeSoft}
                    variant={TextVariant.bodyXs}
                    textAlign={TextAlign.Center}
                  >
                    {isUsingHardwareWallet
                      ? t('willApproveAmountForBridgingHardware')
                      : t('willApproveAmountForBridging', [
                          formatTokenAmount(
                            locale,
                            new BigNumber(fromAmount),
                            fromToken.symbol,
                          ),
                        ])}
                  </Text>
                  {fromAmount && (
                    <Tooltip
                      display={Display.InlineBlock}
                      position={PopoverPosition.Top}
                      offset={[-48, 8]}
                      title={t('grantExactAccess')}
                    >
                      {isUsingHardwareWallet
                        ? t('bridgeApprovalWarningForHardware', [
                            fromAmount,
                            fromToken.symbol,
                          ])
                        : t('bridgeApprovalWarning', [
                            fromAmount,
                            fromToken.symbol,
                          ])}
                    </Tooltip>
                  )}
                </Row>
              ) : null}
            </Footer>
          </Column>
        </Row>
        {isNoQuotesAvailable && (
          <BannerAlert
            marginInline={4}
            marginBottom={10}
            severity={BannerAlertSeverity.Danger}
            description={t('noOptionsAvailableMessage')}
            textAlign={TextAlign.Left}
          />
        )}
        {isEstimatedReturnLow && isLowReturnBannerOpen && (
          <BannerAlert
            ref={insufficientBalanceBannerRef}
            marginInline={4}
            marginBottom={3}
            title={t('lowEstimatedReturnTooltipTitle')}
            severity={BannerAlertSeverity.Warning}
            description={t('lowEstimatedReturnTooltipMessage', [
              BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE * 100,
            ])}
            textAlign={TextAlign.Left}
            onClose={() => setIsLowReturnBannerOpen(false)}
          />
        )}
        {!isLoading &&
          activeQuote &&
          !isInsufficientBalance(srcTokenBalance) &&
          isInsufficientGasForQuote(nativeAssetBalance) && (
            <BannerAlert
              ref={isEstimatedReturnLowRef}
              marginInline={4}
              marginBottom={3}
              title={t('bridgeValidationInsufficientGasTitle', [ticker])}
              severity={BannerAlertSeverity.Danger}
              description={t('bridgeValidationInsufficientGasMessage', [
                ticker,
              ])}
              textAlign={TextAlign.Left}
              actionButtonLabel={t('buyMoreAsset', [ticker])}
              actionButtonOnClick={() => openBuyCryptoInPdapp()}
            />
          )}
      </Column>
    </Column>
  );
};

export default PrepareBridgePage;
