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
import { InternalAccount } from '@metamask/keyring-internal-api';
import { toChecksumAddress, zeroAddress } from 'ethereumjs-util';
import { SolAccountType } from '@metamask/keyring-api';
import {
  setFromToken,
  setFromTokenInputValue,
  setSelectedQuote,
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
  getWasTxDeclined,
  getFromAmountInCurrency,
  getValidationErrors,
  isBridgeSolanaEnabled,
  getQuoteRefreshRate,
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
import {
  setActiveNetwork,
  setActiveNetworkWithError,
  setSelectedAccount,
} from '../../../store/actions';
import type { GenericQuoteRequest } from '../../../../shared/types/bridge';
import { calcTokenValue } from '../../../../shared/lib/swaps-utils';
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
import {
  getCurrentKeyring,
  getSelectedEvmInternalAccount,
  getSelectedInternalAccount,
  getInternalAccounts,
  getTokenList,
} from '../../../selectors';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { SECOND } from '../../../../shared/constants/time';
import { BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE } from '../../../../shared/constants/bridge';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useIsMultichainSwap } from '../hooks/useIsMultichainSwap';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getLastSelectedNonEvmAccount,
  getMultichainIsEvm,
} from '../../../selectors/multichain';
import { MultichainBridgeQuoteCard } from '../quotes/multichain-bridge-quote-card';
import { BridgeQuoteCard } from '../quotes/bridge-quote-card';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { formatChainIdToCaip } from '../../../../shared/modules/bridge-utils/caip-formatters';
import { BridgeInputGroup } from './bridge-input-group';
import { BridgeCTAButton } from './bridge-cta-button';
import { DestinationAccountPicker } from './components/destination-account-picker';

const PrepareBridgePage = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const isSwap = useIsMultichainSwap();
  const accounts = useSelector(getInternalAccounts);

  const fromToken = useSelector(getFromToken);
  const fromTokens = useSelector(getTokenList) as TokenListMap;
  const isFromTokensLoading = useMemo(
    () => Object.keys(fromTokens).length === 0,
    [fromTokens],
  );

  const toToken = useSelector(getToToken);

  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);
  const fromAmountInCurrency = useSelector(getFromAmountInCurrency);

  const providerConfig = useSelector(getProviderConfig);
  const slippage = useSelector(getSlippage);

  const quoteRequest = useSelector(getQuoteRequest);
  const {
    isLoading,
    activeQuote: activeQuote_,
    isQuoteGoingToRefresh,
    quotesLastFetchedMs,
  } = useSelector(getBridgeQuotes);
  const refreshRate = useSelector(getQuoteRefreshRate);

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

  const isEvm = useMultichainSelector(getMultichainIsEvm);
  const selectedEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedNonEvmAccount);
  const selectedMultichainAccount = useMultichainSelector(
    getSelectedInternalAccount,
  );
  const selectedAccount = isEvm
    ? selectedEvmAccount
    : selectedMultichainAccount;

  const keyring = useSelector(getCurrentKeyring);
  // @ts-expect-error keyring type is wrong maybe?
  const isUsingHardwareWallet = isHardwareKeyring(keyring.type);
  const locale = useSelector(getIntlLocale);

  const ticker = useSelector(getNativeCurrency);
  const {
    isEstimatedReturnLow,
    isNoQuotesAvailable,
    isInsufficientGasForQuote,
    isInsufficientBalance,
  } = useSelector(getValidationErrors);
  const { quotesRefreshCount } = useSelector(getBridgeQuotes);
  const { openBuyCryptoInPdapp } = useRamps();

  const nativeAssetBalance = useLatestBalance(
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
      fromChain?.chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
    ],
    fromChain?.chainId,
  );

  const srcTokenBalance = useLatestBalance(fromToken, fromChain?.chainId);

  const {
    filteredTokenListGenerator: toTokenListGenerator,
    isLoading: isToTokensLoading,
  } = useTokensWithFiltering(toChain?.chainId ?? fromChain?.chainId);

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

      if (srcAsset && destAsset && destChainId) {
        // Set inputs to values from active quote
        dispatch(setToChainId(destChainId));
        dispatch(
          setToToken({
            ...destAsset,
            chainId: destChainId,
            image: destAsset.icon ?? '',
            address: destAsset.address,
          }),
        );
        dispatch(
          setFromToken({
            ...srcAsset,
            chainId: srcChainId,
            image: srcAsset.icon ?? '',
            address: srcAsset.address,
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

  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<InternalAccount | null>(null);
  const hasAutoSelectedRef = useRef(false);

  const isToOrFromSolana = useMemo(() => {
    if (!fromChain?.chainId || !toChain?.chainId) {
      return false;
    }

    const fromChainStartsWithSolana = fromChain.chainId
      .toString()
      .startsWith('solana:');
    const toChainStartsWithSolana = toChain.chainId
      .toString()
      .startsWith('solana:');

    return (
      (toChainStartsWithSolana && !fromChainStartsWithSolana) ||
      (!toChainStartsWithSolana && fromChainStartsWithSolana)
    );
  }, [fromChain?.chainId, toChain?.chainId]);

  const isDestinationSolana = useMemo(() => {
    if (!toChain?.chainId) {
      return false;
    }
    return toChain.chainId.toString().startsWith('solana:');
  }, [toChain?.chainId]);

  const quoteParams = useMemo(
    () => ({
      srcTokenAddress: fromToken?.address,
      destTokenAddress: toToken?.address,
      srcTokenAmount:
        fromAmount && fromToken?.decimals
          ? calcTokenValue(
              // Treat empty or incomplete amount as 0 to reject NaN
              ['', '.'].includes(fromAmount) ? '0' : fromAmount,
              fromToken.decimals,
            )
              .toFixed()
              // Length of decimal part cannot exceed token.decimals
              .split('.')[0]
          : undefined,
      srcChainId: fromChain?.chainId,
      destChainId: toChain?.chainId,
      // This override allows quotes to be returned when the rpcUrl is a tenderly fork
      // Otherwise quotes get filtered out by the bridge-api when the wallet's real
      // balance is less than the tenderly balance
      insufficientBal: Boolean(providerConfig?.rpcUrl?.includes('tenderly')),
      slippage: isSwap ? 0 : slippage,
      walletAddress: selectedAccount?.address ?? '',
      destWalletAddress: isToOrFromSolana
        ? selectedDestinationAccount?.address
        : selectedEvmAccount?.address,
    }),
    [
      fromToken?.address,
      fromToken?.decimals,
      toToken?.address,
      fromAmount,
      fromChain?.chainId,
      toChain?.chainId,
      providerConfig?.rpcUrl,
      slippage,
      selectedAccount?.address,
      selectedEvmAccount?.address,
      selectedDestinationAccount?.address,
      isToOrFromSolana,
      isSwap,
    ],
  );

  const debouncedUpdateQuoteRequestInController = useCallback(
    debounce((p: Partial<GenericQuoteRequest>) => {
      dispatch(updateQuoteRequestParams(p));
      dispatch(setSelectedQuote(null));
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedUpdateQuoteRequestInController(quoteParams);
  }, [quoteParams, debouncedUpdateQuoteRequestInController]);

  // Auto-select most recently used account only once on initial load
  useEffect(() => {
    if (
      !selectedDestinationAccount &&
      !hasAutoSelectedRef.current &&
      isToOrFromSolana
    ) {
      const filteredAccounts = accounts
        .filter((account: InternalAccount) => {
          const isSolAccount = Boolean(
            account && account.type === SolAccountType.DataAccount,
          );
          return isDestinationSolana ? isSolAccount : !isSolAccount;
        })
        .sort((a: InternalAccount, b: InternalAccount) => {
          const aLastSelected = a.metadata.lastSelected || 0;
          const bLastSelected = b.metadata.lastSelected || 0;
          return bLastSelected - aLastSelected;
        });

      if (filteredAccounts.length > 0) {
        const mostRecentAccount = filteredAccounts[0];
        setSelectedDestinationAccount(mostRecentAccount);
        hasAutoSelectedRef.current = true;
      }
    }
  }, [
    isToOrFromSolana,
    selectedDestinationAccount,
    isDestinationSolana,
    accounts,
  ]);

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

    // fromTokens is for EVM chains so it's ok to lowercase the token address
    const matchedToken = fromTokens[tokenAddressFromUrl.toLowerCase()];

    switch (tokenAddressFromUrl) {
      case fromToken?.address:
        // If the token is already set, remove the query param
        removeTokenFromUrl();
        break;
      case matchedToken?.address:
      case matchedToken?.address
        ? toChecksumAddress(matchedToken.address)
        : undefined: {
        // If there is a match, set it as the fromToken
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

  const isSolanaBridgeEnabled = useSelector(isBridgeSolanaEnabled);

  return (
    <Column className="prepare-bridge-page" gap={8}>
      <BridgeInputGroup
        header={isSwap ? t('swapSwapFrom') : t('bridgeFrom')}
        token={fromToken}
        onAmountChange={(e) => {
          dispatch(setFromTokenInputValue(e));
        }}
        onAssetChange={(token) => {
          const bridgeToken = {
            ...token,
            address: token.address ?? zeroAddress(),
          };
          dispatch(setFromToken(bridgeToken));
          dispatch(setFromTokenInputValue(null));
          bridgeToken.address &&
            trackInputEvent({
              input: 'token_source',
              value: bridgeToken.address,
            });
        }}
        networkProps={
          isSwap
            ? undefined
            : {
                network: fromChain,
                networks: fromChains,
                onNetworkChange: (networkConfig) => {
                  networkConfig?.chainId &&
                    networkConfig.chainId !== fromChain?.chainId &&
                    trackInputEvent({
                      input: 'chain_source',
                      value: networkConfig.chainId,
                    });
                  if (
                    networkConfig?.chainId &&
                    networkConfig.chainId === toChain?.chainId
                  ) {
                    dispatch(setToChainId(null));
                    dispatch(setToToken(null));
                  }
                  if (networkConfig.chainId === MultichainNetworks.SOLANA) {
                    dispatch(setSelectedAccount(selectedEvmAccount.address));
                  } else if (selectedSolanaAccount) {
                    dispatch(setSelectedAccount(selectedSolanaAccount.address));
                  }
                  if (isNetworkAdded(networkConfig)) {
                    dispatch(
                      setActiveNetworkWithError(
                        networkConfig.rpcEndpoints[
                          networkConfig.defaultRpcEndpointIndex
                        ].networkClientId || networkConfig.chainId,
                      ),
                    );
                  } else {
                    dispatch(setActiveNetworkWithError(networkConfig.chainId));
                  }
                  dispatch(setFromToken(null));
                  dispatch(setFromTokenInputValue(null));
                },
                header: t('yourNetworks'),
              }
        }
        isMultiselectEnabled={!isSwap}
        onMaxButtonClick={(value: string) => {
          dispatch(setFromTokenInputValue(value));
        }}
        amountInFiat={fromAmountInCurrency.valueInCurrency}
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
              (!isSwap && !isNetworkAdded(toChain))
            }
            onClick={() => {
              if (!isSwap && !isNetworkAdded(toChain)) {
                return;
              }
              setRotateSwitchTokens(!rotateSwitchTokens);
              flippedRequestProperties &&
                trackCrossChainSwapsEvent({
                  event: MetaMetricsEventName.InputSourceDestinationFlipped,
                  properties: flippedRequestProperties,
                });
              if (!isSwap) {
                // Only flip networks if bridging
                const toChainClientId =
                  toChain?.defaultRpcEndpointIndex !== undefined &&
                  toChain?.rpcEndpoints &&
                  isNetworkAdded(toChain)
                    ? toChain.rpcEndpoints[toChain.defaultRpcEndpointIndex]
                        .networkClientId
                    : undefined;
                if (
                  toChain?.chainId &&
                  formatChainIdToCaip(toChain.chainId) ===
                    MultichainNetworks.SOLANA &&
                  selectedSolanaAccount
                ) {
                  dispatch(setSelectedAccount(selectedSolanaAccount.address));
                  setSelectedDestinationAccount(selectedEvmAccount);
                } else {
                  dispatch(setSelectedAccount(selectedEvmAccount.address));
                  selectedSolanaAccount &&
                    setSelectedDestinationAccount(selectedSolanaAccount);
                }
                toChainClientId && dispatch(setActiveNetwork(toChainClientId));
                fromChain?.chainId && dispatch(setToChainId(fromChain.chainId));
              }
              dispatch(setFromToken(toToken));
              dispatch(setToToken(fromToken));
            }}
          />
        </Box>

        <BridgeInputGroup
          header={t('swapSelectToken')}
          token={toToken}
          onAssetChange={(token) => {
            const bridgeToken = {
              ...token,
              address: token.address ?? zeroAddress(),
            };
            bridgeToken.address &&
              trackInputEvent({
                input: 'token_destination',
                value: bridgeToken.address,
              });
            dispatch(setToToken(bridgeToken));
          }}
          networkProps={
            isSwap
              ? undefined
              : {
                  network: toChain,
                  networks: toChains,
                  onNetworkChange: (networkConfig) => {
                    networkConfig.chainId !== toChain?.chainId &&
                      trackInputEvent({
                        input: 'chain_destination',
                        value: networkConfig.chainId,
                      });
                    dispatch(setToChainId(networkConfig.chainId));
                    dispatch(setToToken(null));
                  },
                  header: isSwap ? t('swapSwapTo') : t('bridgeTo'),
                  shouldDisableNetwork: ({ chainId }) =>
                    chainId === fromChain?.chainId,
                }
          }
          customTokenListGenerator={
            toChain || isSwap ? toTokenListGenerator : undefined
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

        {isSolanaBridgeEnabled && isToOrFromSolana && (
          <Box padding={6} paddingBottom={3} paddingTop={3}>
            <DestinationAccountPicker
              onAccountSelect={setSelectedDestinationAccount}
              selectedSwapToAccount={selectedDestinationAccount}
              isDestinationSolana={isDestinationSolana}
            />
          </Box>
        )}

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

        <Row padding={6} paddingTop={activeQuote ? 0 : 6}>
          <Column
            gap={3}
            className={activeQuote ? 'highlight' : ''}
            style={{
              paddingBottom: activeQuote?.approval ? 16 : 'revert-layer',
              paddingTop: activeQuote?.approval ? 16 : undefined,
              paddingInline: 16,
              position: 'relative',
              overflow: 'hidden',
              ...(activeQuote && !wasTxDeclined && isSolanaBridgeEnabled
                ? {
                    boxShadow:
                      'var(--shadow-size-sm) var(--color-shadow-default)',
                    backgroundColor: 'var(--color-background-default)',
                    borderRadius: 8,
                  }
                : {}),
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
            {!wasTxDeclined &&
              activeQuote &&
              (isSolanaBridgeEnabled ? (
                <MultichainBridgeQuoteCard />
              ) : (
                <BridgeQuoteCard />
              ))}
            <Footer padding={0} flexDirection={FlexDirection.Column} gap={2}>
              <BridgeCTAButton
                onFetchNewQuotes={() => {
                  debouncedUpdateQuoteRequestInController(quoteParams);
                }}
                needsDestinationAddress={
                  isSolanaBridgeEnabled &&
                  isToOrFromSolana &&
                  !selectedDestinationAccount
                }
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
