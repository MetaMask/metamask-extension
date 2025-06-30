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
import { type TokenListMap } from '@metamask/assets-controllers';
import { toChecksumAddress, zeroAddress } from 'ethereumjs-util';
import {
  formatChainIdToCaip,
  isSolanaChainId,
  isValidQuoteRequest,
  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
  getNativeAssetForChainId,
  isNativeAddress,
  UnifiedSwapBridgeEventName,
  BRIDGE_DEFAULT_SLIPPAGE,
} from '@metamask/bridge-controller';
import {
  setFromToken,
  setFromTokenInputValue,
  setSelectedQuote,
  setToChainId,
  setToToken,
  updateQuoteRequestParams,
  resetBridgeState,
  setSlippage,
  trackUnifiedSwapBridgeEvent,
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
  getIsToOrFromSolana,
  getIsSolanaSwap,
  getQuoteRefreshRate,
  getHardwareWalletName,
  getIsQuoteExpired,
  getIsUnifiedUIEnabled,
  getIsSwap,
  BridgeAppState,
  isBridgeSolanaEnabled,
  getTxAlerts,
} from '../../../ducks/bridge/selectors';
import {
  AvatarFavicon,
  AvatarFaviconSize,
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
import { useTokensWithFiltering } from '../../../hooks/bridge/useTokensWithFiltering';
import {
  setActiveNetworkWithError,
  setSelectedAccount,
} from '../../../store/actions';
import { calcTokenValue } from '../../../../shared/lib/swaps-utils';
import {
  formatTokenAmount,
  isQuoteExpiredOrInvalid as isQuoteExpiredOrInvalidUtil,
} from '../utils/quote';
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
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import { useCountdownTimer } from '../../../hooks/bridge/useCountdownTimer';
import {
  getCurrentKeyring,
  getSelectedEvmInternalAccount,
  getSelectedInternalAccount,
  getTokenList,
} from '../../../selectors';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { SECOND } from '../../../../shared/constants/time';
import { SOLANA_USDC_ASSET } from '../../../../shared/constants/bridge';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useIsMultichainSwap } from '../hooks/useIsMultichainSwap';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getLastSelectedNonEvmAccount,
  getMultichainIsEvm,
  getMultichainNativeCurrency,
  getMultichainProviderConfig,
} from '../../../selectors/multichain';
import { MultichainBridgeQuoteCard } from '../quotes/multichain-bridge-quote-card';
import { BridgeQuoteCard } from '../quotes/bridge-quote-card';
import { TokenFeatureType } from '../../../../shared/types/security-alerts-api';
import { useTokenAlerts } from '../../../hooks/bridge/useTokenAlerts';
import { useDestinationAccount } from '../hooks/useDestinationAccount';
import { Toast, ToastContainer } from '../../../components/multichain';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import type { BridgeToken } from '../../../ducks/bridge/types';
import {
  fetchAssetMetadata,
  toAssetId,
} from '../../../../shared/lib/asset-utils';
import { getSmartTransactionsEnabled } from '../../../../shared/modules/selectors';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { BridgeInputGroup } from './bridge-input-group';
import { BridgeCTAButton } from './bridge-cta-button';
import { DestinationAccountPicker } from './components/destination-account-picker';

const PrepareBridgePage = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const fromChain = useSelector(getFromChain);
  const isUnifiedUIEnabled = useSelector((state: BridgeAppState) =>
    getIsUnifiedUIEnabled(state, fromChain?.chainId),
  );

  // Check the two types of swaps
  const isSwapFromQuote = useSelector(getIsSwap);
  const isSwapFromUrl = useIsMultichainSwap();

  // Use the appropriate value based on unified UI setting
  const isSwap = isUnifiedUIEnabled ? isSwapFromQuote : isSwapFromUrl;

  const fromToken = useSelector(getFromToken);
  const fromTokens = useSelector(getTokenList) as TokenListMap;

  const toToken = useSelector(getToToken);

  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const toChain = useSelector(getToChain);

  const isFromTokensLoading = useMemo(() => {
    // This is an EVM token list. Solana tokens should not trigger loading state.
    if (fromChain && isSolanaChainId(fromChain.chainId)) {
      return false;
    }
    return Object.keys(fromTokens).length === 0;
  }, [fromTokens, fromChain]);

  const fromAmount = useSelector(getFromAmount);
  const fromAmountInCurrency = useSelector(getFromAmountInCurrency);

  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);

  const providerConfig = useMultichainSelector(getMultichainProviderConfig);
  const slippage = useSelector(getSlippage);

  const quoteRequest = useSelector(getQuoteRequest);
  const {
    isLoading,
    activeQuote: activeQuote_,
    isQuoteGoingToRefresh,
    quotesRefreshCount,
  } = useSelector(getBridgeQuotes);
  const refreshRate = useSelector(getQuoteRefreshRate);

  const isQuoteExpired = useSelector((state) =>
    getIsQuoteExpired(state as BridgeAppState, Date.now()),
  );

  const wasTxDeclined = useSelector(getWasTxDeclined);

  // Determine if the current quote is expired or does not match the currently
  // selected destination asset/chain.
  const isQuoteExpiredOrInvalid = isQuoteExpiredOrInvalidUtil({
    activeQuote: activeQuote_,
    toToken,
    toChain,
    fromChain,
    isQuoteExpired,
    insufficientBal: quoteRequest.insufficientBal,
  });

  const activeQuote = isQuoteExpiredOrInvalid ? undefined : activeQuote_;

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
  const isUsingHardwareWallet = isHardwareKeyring(keyring?.type);
  const hardwareWalletName = useSelector(getHardwareWalletName);
  const isTxSubmittable = useIsTxSubmittable();
  const locale = useSelector(getIntlLocale);

  const ticker = useMultichainSelector(getMultichainNativeCurrency);
  const {
    isEstimatedReturnLow,
    isNoQuotesAvailable,
    isInsufficientGasForQuote,
    isInsufficientBalance,
  } = useSelector(getValidationErrors);
  const txAlert = useSelector(getTxAlerts);
  const { openBuyCryptoInPdapp } = useRamps();

  const nativeAsset = useMemo(
    () =>
      fromChain?.chainId ? getNativeAssetForChainId(fromChain.chainId) : null,
    [fromChain?.chainId],
  );
  const nativeAssetBalance = useLatestBalance(nativeAsset);

  const { tokenAlert } = useTokenAlerts();
  const srcTokenBalance = useLatestBalance(fromToken);
  const { selectedDestinationAccount, setSelectedDestinationAccount } =
    useDestinationAccount(isSwap);

  const {
    filteredTokenListGenerator: toTokenListGenerator,
    isLoading: isToTokensLoading,
  } = useTokensWithFiltering(
    toChain?.chainId ?? fromChain?.chainId,
    fromChain?.chainId === toChain?.chainId && fromToken && fromChain
      ? (() => {
          // Determine the address format based on chain type
          // We need to make evm tokens lowercase for comparison as sometimes they are checksummed
          let address = '';
          if (isNativeAddress(fromToken.address)) {
            address = '';
          } else if (isSolanaChainId(fromChain.chainId)) {
            address = fromToken.address || '';
          } else {
            address = fromToken.address?.toLowerCase() || '';
          }

          return {
            ...fromToken,
            address,
            // Ensure chainId is in CAIP format for proper comparison
            chainId: formatChainIdToCaip(fromChain.chainId),
          };
        })()
      : null,
    selectedDestinationAccount !== null && 'id' in selectedDestinationAccount
      ? selectedDestinationAccount.id
      : undefined,
  );

  const { flippedRequestProperties } = useRequestProperties();
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();

  const millisecondsUntilNextRefresh = useCountdownTimer();

  const [rotateSwitchTokens, setRotateSwitchTokens] = useState(false);

  // Resets the banner visibility when the estimated return is low
  const [isLowReturnBannerOpen, setIsLowReturnBannerOpen] = useState(true);
  useEffect(() => setIsLowReturnBannerOpen(true), [quotesRefreshCount]);

  // Resets the banner visibility when new alerts found
  const [isTokenAlertBannerOpen, setIsTokenAlertBannerOpen] = useState(true);
  useEffect(() => setIsTokenAlertBannerOpen(true), [tokenAlert]);

  // Resets the banner visibility when toToken is changed
  const [isCannotVerifyTokenBannerOpen, setIsCannotVerifyTokenBannerOpen] =
    useState(true);
  useEffect(() => setIsCannotVerifyTokenBannerOpen(true), [toToken?.address]);

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
          }),
        );
        dispatch(
          setFromToken({
            ...srcAsset,
            chainId: srcChainId,
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
  const tokenAlertBannerRef = useRef<HTMLDivElement>(null);
  const fromAssetsPageFixAppliedRef = useRef<boolean>(false);

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
    nativeAssetBalance,
    isInsufficientGasForQuote,
    isLowReturnBannerOpen,
  ]);

  const isToOrFromSolana = useSelector(getIsToOrFromSolana);
  const isSolanaSwap = useSelector(getIsSolanaSwap);

  const isDestinationSolana = useMemo(() => {
    if (!toChain?.chainId) {
      return false;
    }
    return isSolanaChainId(toChain.chainId);
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
      // This override allows quotes to be returned when the rpcUrl is a forked network
      // Otherwise quotes get filtered out by the bridge-api when the wallet's real
      // balance is less than the tenderly balance
      insufficientBal: providerConfig?.rpcUrl?.includes('localhost')
        ? true
        : undefined,
      slippage,
      walletAddress: selectedAccount?.address ?? '',
      destWalletAddress: selectedDestinationAccount?.address,
    }),
    [
      fromToken?.address,
      fromToken?.decimals,
      toToken?.address,
      fromAmount,
      fromChain?.chainId,
      toChain?.chainId,
      slippage,
      selectedAccount?.address,
      selectedDestinationAccount?.address,
      providerConfig?.rpcUrl,
    ],
  );

  const debouncedUpdateQuoteRequestInController = useCallback(
    debounce((...args: Parameters<typeof updateQuoteRequestParams>) => {
      dispatch(updateQuoteRequestParams(...args));
    }, 300),
    [dispatch],
  );

  // When entering the page for the first time emit an event for the page viewed
  useEffect(() => {
    trackCrossChainSwapsEvent({
      event: MetaMetricsEventName.ActionPageViewed,
      properties: {
        chain_id_source: formatChainIdToCaip(fromChain?.chainId ?? ''),
        token_symbol_source: fromToken?.symbol ?? '',
        token_address_source: fromToken?.address ?? '',
        chain_id_destination: formatChainIdToCaip(toChain?.chainId ?? ''),
        token_symbol_destination: toToken?.symbol ?? '',
        token_address_destination: toToken?.address ?? '',
      },
    });

    return () => {
      debouncedUpdateQuoteRequestInController.cancel();
    };
  }, []);

  useEffect(() => {
    dispatch(setSelectedQuote(null));
    debouncedUpdateQuoteRequestInController(quoteParams, {
      stx_enabled: smartTransactionsEnabled,
      token_symbol_source: fromToken?.symbol ?? '',
      token_symbol_destination: toToken?.symbol ?? '',
      security_warnings: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteParams]);

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

    const handleToken = async () => {
      if (isSolanaChainId(fromChain.chainId)) {
        const tokenAddress = tokenAddressFromUrl;
        const assetId = toAssetId(
          tokenAddress,
          formatChainIdToCaip(fromChain.chainId),
        );
        if (!assetId) {
          removeTokenFromUrl();
          return;
        }

        const tokenMetadata = await fetchAssetMetadata(
          tokenAddress,
          fromChain.chainId,
        );
        if (!tokenMetadata) {
          removeTokenFromUrl();
          return;
        }

        dispatch(
          setFromToken({
            ...tokenMetadata,
            chainId: fromChain.chainId,
          }),
        );
        removeTokenFromUrl();
        return;
      }

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
    };

    handleToken();
  }, [fromChain, fromToken, fromTokens, search, isFromTokensLoading]);

  // Set slippage based on swap type
  const slippageInitializedRef = useRef(false);
  useEffect(() => {
    if (isSwap && fromChain && toChain && !slippageInitializedRef.current) {
      slippageInitializedRef.current = true;
      // For Solana swaps, use undefined (AUTO), otherwise use default 0.5%
      const targetSlippage = isSolanaSwap ? undefined : BRIDGE_DEFAULT_SLIPPAGE;
      dispatch(setSlippage(targetSlippage));
    }
  }, [isSwap, isSolanaSwap, fromChain, toChain, dispatch]);

  // Trace swap/bridge view loaded
  useEffect(() => {
    endTrace({
      name: isSwap ? TraceName.SwapViewLoaded : TraceName.BridgeViewLoaded,
      timestamp: Date.now(),
    });
  }, []);

  // Set the default destination token for swaps (only when unified UI is disabled)
  useEffect(() => {
    // Only set default token when unified UI is disabled (preserve existing behavior)
    if (!isUnifiedUIEnabled && isSwap && fromChain && !toToken) {
      dispatch(setToChainId(fromChain.chainId));
      dispatch(setToToken(SOLANA_USDC_ASSET));
    }
  }, [isSwap, dispatch, fromChain, toToken, isUnifiedUIEnabled]);

  // Edge-case fix: if user lands with USDC selected for both sides on Solana,
  // switch destination to SOL (native asset).
  useEffect(() => {
    if (
      !isSwap ||
      !fromChain ||
      !isSolanaChainId(fromChain.chainId) ||
      !fromToken?.address ||
      !toToken?.address ||
      fromAssetsPageFixAppliedRef.current // Prevent multiple applications of the fix as it's only needed initially.
    ) {
      return;
    }

    const isBothUsdc =
      fromToken.address.toLowerCase() ===
        SOLANA_USDC_ASSET.address.toLowerCase() &&
      toToken.address.toLowerCase() === SOLANA_USDC_ASSET.address.toLowerCase();

    if (isBothUsdc) {
      const solNativeAsset = getNativeAssetForChainId(fromChain.chainId);
      dispatch(setToToken(solNativeAsset));
      fromAssetsPageFixAppliedRef.current = true;
    }
  }, [isSwap, fromChain?.chainId, fromToken?.address, toToken?.address]);

  const occurrences = Number(
    toToken?.occurrences ?? toToken?.aggregators?.length ?? 0,
  );
  const toTokenIsNotNative =
    toToken?.address && !isNativeAddress(toToken?.address);

  const isSolanaBridgeEnabled = useSelector(isBridgeSolanaEnabled);

  const [showBlockExplorerToast, setShowBlockExplorerToast] = useState(false);
  const [blockExplorerToken, setBlockExplorerToken] =
    useState<BridgeToken | null>(null);
  const [toastTriggerCounter, setToastTriggerCounter] = useState(0);

  const getFromInputHeader = () => {
    if (isUnifiedUIEnabled) {
      return t('yourNetworks');
    }
    return isSwap ? t('swapSwapFrom') : t('bridgeFrom');
  };

  const getToInputHeader = () => {
    if (isUnifiedUIEnabled) {
      return t('swapSelectToken');
    }
    return isSwap ? t('swapSwapTo') : t('bridgeTo');
  };

  return (
    <>
      <Column className="prepare-bridge-page" gap={8}>
        <BridgeInputGroup
          header={getFromInputHeader()}
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
            if (token.address === toToken?.address) {
              dispatch(setToToken(null));
            }
            bridgeToken.address &&
              trackInputEvent({
                input: 'token_source',
                value: bridgeToken.address,
              });
          }}
          networkProps={{
            network: fromChain,
            networks: isSwap && !isUnifiedUIEnabled ? undefined : fromChains,
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
              if (
                isSolanaChainId(networkConfig.chainId) &&
                selectedSolanaAccount
              ) {
                dispatch(setSelectedAccount(selectedSolanaAccount.address));
              } else if (isNetworkAdded(networkConfig)) {
                dispatch(setSelectedAccount(selectedEvmAccount.address));
                dispatch(
                  setActiveNetworkWithError(
                    networkConfig.rpcEndpoints[
                      networkConfig.defaultRpcEndpointIndex
                    ].networkClientId || networkConfig.chainId,
                  ),
                );
              }
              dispatch(setFromToken(null));
              dispatch(setFromTokenInputValue(null));
            },
            header: t('yourNetworks'),
          }}
          isMultiselectEnabled={isUnifiedUIEnabled || !isSwap}
          onMaxButtonClick={(value: string) => {
            dispatch(setFromTokenInputValue(value));
          }}
          // Hides fiat amount string before a token quantity is entered.
          amountInFiat={
            fromAmountInCurrency.valueInCurrency.gt(0)
              ? fromAmountInCurrency.valueInCurrency.toString()
              : undefined
          }
          balanceAmount={srcTokenBalance}
          amountFieldProps={{
            testId: 'from-amount',
            autoFocus: true,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            value: fromAmount || undefined,
          }}
          isTokenListLoading={isFromTokensLoading}
          buttonProps={{ testId: 'bridge-source-button' }}
          onBlockExplorerClick={(token) => {
            setBlockExplorerToken(token);
            setShowBlockExplorerToast(true);
            setToastTriggerCounter((prev) => prev + 1);
          }}
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
                (toChain && !isNetworkAdded(toChain))
              }
              onClick={() => {
                // Track the flip event
                toChain?.chainId &&
                  fromToken &&
                  toToken &&
                  dispatch(
                    trackUnifiedSwapBridgeEvent(
                      UnifiedSwapBridgeEventName.InputSourceDestinationFlipped,
                      {
                        token_symbol_source: toToken?.symbol ?? null,
                        token_symbol_destination: fromToken?.symbol ?? null,
                        token_address_source:
                          toAssetId(
                            toToken.address ?? '',
                            formatChainIdToCaip(toToken.chainId ?? ''),
                          ) ??
                          getNativeAssetForChainId(toChain.chainId)?.assetId,
                        token_address_destination:
                          toAssetId(
                            fromToken.address ?? '',
                            formatChainIdToCaip(fromToken.chainId ?? ''),
                          ) ?? null,
                        chain_id_source: formatChainIdToCaip(toChain.chainId),
                        chain_id_destination: fromChain?.chainId
                          ? formatChainIdToCaip(fromChain?.chainId)
                          : null,
                        security_warnings: [],
                      },
                    ),
                  );

                setRotateSwitchTokens(!rotateSwitchTokens);

                flippedRequestProperties &&
                  trackCrossChainSwapsEvent({
                    event: MetaMetricsEventName.InputSourceDestinationFlipped,
                    properties: flippedRequestProperties,
                  });

                const shouldFlipNetworks = isUnifiedUIEnabled || !isSwap;
                if (shouldFlipNetworks) {
                  // Handle account switching for Solana
                  if (
                    toChain?.chainId &&
                    formatChainIdToCaip(toChain.chainId) ===
                      MultichainNetworks.SOLANA &&
                    selectedSolanaAccount
                  ) {
                    dispatch(setSelectedAccount(selectedSolanaAccount.address));
                  } else {
                    dispatch(setSelectedAccount(selectedEvmAccount.address));
                  }

                  // Get the network client ID for switching
                  const toChainClientId =
                    toChain?.defaultRpcEndpointIndex !== undefined &&
                    toChain?.rpcEndpoints
                      ? toChain.rpcEndpoints[toChain.defaultRpcEndpointIndex]
                      : undefined;
                  const networkClientId =
                    toChainClientId && 'networkClientId' in toChainClientId
                      ? toChainClientId.networkClientId
                      : toChain?.chainId;

                  if (networkClientId) {
                    dispatch(setActiveNetworkWithError(networkClientId));
                  }
                  if (fromChain?.chainId) {
                    dispatch(setToChainId(fromChain.chainId));
                  }
                }
                dispatch(setFromToken(toToken));
                dispatch(setToToken(fromToken));
              }}
            />
          </Box>

          <BridgeInputGroup
            header={getToInputHeader()}
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
              isSwap && !isUnifiedUIEnabled
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
                      const destNativeAsset = getNativeAssetForChainId(
                        networkConfig.chainId,
                      );
                      dispatch(setToToken(destNativeAsset));
                    },
                    header: getToInputHeader(),
                    shouldDisableNetwork: isUnifiedUIEnabled
                      ? undefined
                      : ({ chainId }) => chainId === fromChain?.chainId,
                  }
            }
            customTokenListGenerator={
              toChain &&
              (isSwapFromUrl || toChain.chainId !== fromChain?.chainId)
                ? toTokenListGenerator
                : undefined
            }
            amountInFiat={
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
            buttonProps={{ testId: 'bridge-destination-button' }}
            onBlockExplorerClick={(token) => {
              setBlockExplorerToken(token);
              setShowBlockExplorerToast(true);
              setToastTriggerCounter((prev) => prev + 1);
            }}
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

          <Column
            height={BlockSize.Full}
            justifyContent={JustifyContent.center}
          >
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
                  nativeAssetBalance={nativeAssetBalance}
                  srcTokenBalance={srcTokenBalance}
                  onFetchNewQuotes={() => {
                    debouncedUpdateQuoteRequestInController(quoteParams, {
                      stx_enabled: smartTransactionsEnabled,
                      token_symbol_source: fromToken?.symbol ?? '',
                      token_symbol_destination: toToken?.symbol ?? '',
                      security_warnings: [], // TODO populate security warnings
                    });
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
                              fromAmount,
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
          {isUsingHardwareWallet &&
            isTxSubmittable &&
            hardwareWalletName &&
            activeQuote && (
              <BannerAlert
                marginInline={4}
                marginBottom={3}
                title={t('hardwareWalletSubmissionWarningTitle')}
                textAlign={TextAlign.Left}
              >
                <ul style={{ listStyle: 'disc' }}>
                  <li>
                    <Text variant={TextVariant.bodyMd}>
                      {t('hardwareWalletSubmissionWarningStep1', [
                        hardwareWalletName,
                      ])}
                    </Text>
                  </li>
                  <li>
                    <Text variant={TextVariant.bodyMd}>
                      {t('hardwareWalletSubmissionWarningStep2', [
                        hardwareWalletName,
                      ])}
                    </Text>
                  </li>
                </ul>
              </BannerAlert>
            )}
          {txAlert && activeQuote && (
            <BannerAlert
              marginInline={4}
              marginBottom={10}
              severity={BannerAlertSeverity.Danger}
              title={t(txAlert.titleId)}
              description={`${txAlert.description} ${t(txAlert.descriptionId)}`}
              textAlign={TextAlign.Left}
            />
          )}
          {isNoQuotesAvailable && !isQuoteExpired && (
            <BannerAlert
              marginInline={4}
              marginBottom={10}
              severity={BannerAlertSeverity.Danger}
              description={t('noOptionsAvailableMessage')}
              textAlign={TextAlign.Left}
            />
          )}
          {isCannotVerifyTokenBannerOpen &&
            isEvm &&
            toToken &&
            toTokenIsNotNative &&
            toToken.address !== SOLANA_USDC_ASSET.address &&
            occurrences < 2 && (
              <BannerAlert
                severity={BannerAlertSeverity.Warning}
                title={t('bridgeTokenCannotVerifyTitle')}
                description={t('bridgeTokenCannotVerifyDescription')}
                marginInline={4}
                marginBottom={3}
                textAlign={TextAlign.Left}
                onClose={() => setIsCannotVerifyTokenBannerOpen(false)}
              />
            )}
          {tokenAlert && isTokenAlertBannerOpen && (
            <BannerAlert
              ref={tokenAlertBannerRef}
              marginInline={4}
              marginBottom={3}
              title={tokenAlert.titleId ? t(tokenAlert.titleId) : ''}
              severity={
                tokenAlert.type === TokenFeatureType.MALICIOUS
                  ? BannerAlertSeverity.Danger
                  : BannerAlertSeverity.Warning
              }
              description={
                tokenAlert.descriptionId
                  ? t(tokenAlert.descriptionId)
                  : tokenAlert.description
              }
              textAlign={TextAlign.Left}
              onClose={() => setIsTokenAlertBannerOpen(false)}
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
          {isEstimatedReturnLow && isLowReturnBannerOpen && activeQuote && (
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
        </Column>
      </Column>
      {showBlockExplorerToast && blockExplorerToken && (
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ToastContainer>
            <Toast
              key={toastTriggerCounter}
              text={t('bridgeBlockExplorerLinkCopied')}
              onClose={() => setShowBlockExplorerToast(false)}
              autoHideTime={2500}
              startAdornment={
                <AvatarFavicon
                  name={blockExplorerToken.symbol}
                  size={AvatarFaviconSize.Sm}
                  src={blockExplorerToken.image}
                />
              }
            />
          </ToastContainer>
        </div>
      )}
    </>
  );
};

export default PrepareBridgePage;
