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
  type GenericQuoteRequest,
  getNativeAssetForChainId,
  isNativeAddress,
} from '@metamask/bridge-controller';
import type { BridgeToken } from '@metamask/bridge-controller';
import {
  setFromToken,
  setFromTokenInputValue,
  setSelectedQuote,
  setToChainId,
  setToToken,
  updateQuoteRequestParams,
  resetBridgeState,
  setSlippage,
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
  getIsToOrFromSolana,
  getQuoteRefreshRate,
  getHardwareWalletName,
  getIsQuoteExpired,
  BridgeAppState,
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
  setActiveNetwork,
  setActiveNetworkWithError,
  setSelectedAccount,
} from '../../../store/actions';
import { calcTokenValue } from '../../../../shared/lib/swaps-utils';
import { formatTokenAmount } from '../utils/quote';
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
import {
  fetchAssetMetadata,
  toAssetId,
} from '../../../../shared/lib/asset-utils';
import { BridgeInputGroup } from './bridge-input-group';
import { BridgeCTAButton } from './bridge-cta-button';
import { DestinationAccountPicker } from './components/destination-account-picker';
import { TmpBridgeToken } from './types';

const PrepareBridgePage = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const isSwap = useIsMultichainSwap();

  const fromToken = useSelector(getFromToken);
  const fromTokens = useSelector(getTokenList) as TokenListMap;

  const toToken = useSelector(getToToken) as TmpBridgeToken;

  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const fromChain = useSelector(getFromChain);
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

  const providerConfig = useMultichainSelector(getMultichainProviderConfig);
  const slippage = useSelector(getSlippage);

  const quoteRequest = useSelector(getQuoteRequest);
  const {
    isLoading,
    activeQuote: activeQuote_,
    isQuoteGoingToRefresh,
  } = useSelector(getBridgeQuotes);
  const refreshRate = useSelector(getQuoteRefreshRate);

  const isQuoteExpired = useSelector((state) =>
    getIsQuoteExpired(state as BridgeAppState, Date.now()),
  );

  const wasTxDeclined = useSelector(getWasTxDeclined);
  // If latest quote is expired and user has sufficient balance
  // set activeQuote to undefined to hide stale quotes but keep inputs filled
  const activeQuote =
    isQuoteExpired &&
    (!quoteRequest.insufficientBal ||
      // insufficientBal is always true for solana
      (fromChain && isSolanaChainId(fromChain.chainId)))
      ? undefined
      : activeQuote_;

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
  const hardwareWalletName = useSelector(getHardwareWalletName);
  const isTxSubmittable = useIsTxSubmittable();
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
    fromToken,
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
            image: srcAsset.icon ?? destAsset.iconUrl ?? '',
            address: destAsset.address,
          }),
        );
        dispatch(
          setFromToken({
            ...srcAsset,
            chainId: srcChainId,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            image: srcAsset.icon || srcAsset.iconUrl || '',
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
  const tokenAlertBannerRef = useRef<HTMLDivElement>(null);
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

  const isToOrFromSolana = useSelector(getIsToOrFromSolana);

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
    debounce((p: Partial<GenericQuoteRequest>) => {
      dispatch(updateQuoteRequestParams(p));
    }, 300),
    [],
  );

  useEffect(() => {
    dispatch(setSelectedQuote(null));
    debouncedUpdateQuoteRequestInController(quoteParams);
  }, [quoteParams, debouncedUpdateQuoteRequestInController]);

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
            image: tokenMetadata.image || '',
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
    };

    handleToken();
  }, [fromChain, fromToken, fromTokens, search, isFromTokensLoading]);

  // Set the default destination token and slippage for swaps
  useEffect(() => {
    if (isSwap) {
      dispatch(setSlippage(undefined));
      if (fromChain && !toToken) {
        dispatch(setToChainId(fromChain.chainId));
        dispatch(setToToken(SOLANA_USDC_ASSET));
      }
    }
  }, []);

  const occurrences = Number(toToken?.occurrences ?? 0);
  const toTokenIsNotNative =
    toToken?.address && !isNativeAddress(toToken?.address);

  const isSolanaBridgeEnabled = useSelector(isBridgeSolanaEnabled);

  const [showBlockExplorerToast, setShowBlockExplorerToast] = useState(false);
  const [blockExplorerToken, setBlockExplorerToken] =
    useState<BridgeToken | null>(null);
  const [toastTriggerCounter, setToastTriggerCounter] = useState(0);

  return (
    <>
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
            networks: isSwap ? undefined : fromChains,
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
          isMultiselectEnabled={!isSwap}
          onMaxButtonClick={(value: string) => {
            dispatch(setFromTokenInputValue(value));
          }}
          amountInFiat={fromAmountInCurrency.valueInCurrency.toString()}
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
                    // Switch accounts to switch to solana
                    dispatch(setSelectedAccount(selectedSolanaAccount.address));
                  } else {
                    dispatch(setSelectedAccount(selectedEvmAccount.address));
                  }
                  toChainClientId &&
                    dispatch(setActiveNetwork(toChainClientId));
                  fromChain?.chainId &&
                    dispatch(setToChainId(fromChain.chainId));
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              toChain || isSwap ? toTokenListGenerator : undefined
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
                marginInline={4}
                marginBottom={10}
                severity={BannerAlertSeverity.Danger}
                description={t('noOptionsAvailableMessage')}
                textAlign={TextAlign.Left}
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
