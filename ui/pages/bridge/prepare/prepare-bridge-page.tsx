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
import { type TokenListMap } from '@metamask/assets-controllers';
import { zeroAddress } from 'ethereumjs-util';
import {
  formatChainIdToCaip,
  isSolanaChainId,
  isValidQuoteRequest,
  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
  getNativeAssetForChainId,
  isNativeAddress,
  UnifiedSwapBridgeEventName,
  GenericQuoteRequest,
} from '@metamask/bridge-controller';
import { Hex, parseCaipChainId } from '@metamask/utils';
import {
  setFromToken,
  setFromTokenInputValue,
  setSelectedQuote,
  setToChainId,
  setToToken,
  updateQuoteRequestParams,
  resetBridgeState,
  trackUnifiedSwapBridgeEvent,
  setFromChain,
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
  getHardwareWalletName,
  getIsQuoteExpired,
  getIsUnifiedUIEnabled,
  getIsSwap,
  BridgeAppState,
  getTxAlerts,
  getFromAccount,
  getIsStxEnabled,
  getIsGasIncluded,
} from '../../../ducks/bridge/selectors';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  ButtonIcon,
  IconName,
  Text,
} from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokensWithFiltering } from '../../../hooks/bridge/useTokensWithFiltering';
import { calcTokenValue } from '../../../../shared/lib/swaps-utils';
import {
  formatTokenAmount,
  isQuoteExpiredOrInvalid as isQuoteExpiredOrInvalidUtil,
} from '../utils/quote';
import { isNetworkAdded } from '../../../ducks/bridge/utils';
import MascotBackgroundAnimation from '../../swaps/mascot-background-animation/mascot-background-animation';
import { Column } from '../layout';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import {
  getCurrentKeyring,
  getEnabledNetworksByNamespace,
  getTokenList,
} from '../../../selectors';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { SECOND } from '../../../../shared/constants/time';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useIsMultichainSwap } from '../hooks/useIsMultichainSwap';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainNativeCurrency,
  getMultichainProviderConfig,
} from '../../../selectors/multichain';
import { MultichainBridgeQuoteCard } from '../quotes/multichain-bridge-quote-card';
import { TokenFeatureType } from '../../../../shared/types/security-alerts-api';
import { useTokenAlerts } from '../../../hooks/bridge/useTokenAlerts';
import { useDestinationAccount } from '../hooks/useDestinationAccount';
import { Toast, ToastContainer } from '../../../components/multichain';
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../../shared/constants/network';
import { useBridgeQueryParams } from '../../../hooks/bridge/useBridgeQueryParams';
import { useSmartSlippage } from '../../../hooks/bridge/useSmartSlippage';
import { useGasIncluded7702 } from '../hooks/useGasIncluded7702';
import { enableAllPopularNetworks } from '../../../store/controller-actions/network-order-controller';
import { useIsSendBundleSupported } from '../hooks/useIsSendBundleSupported';
import { BridgeInputGroup } from './bridge-input-group';
import { PrepareBridgePageFooter } from './prepare-bridge-page-footer';
import { DestinationAccountPickerModal } from './components/destination-account-picker-modal';

/**
 * Ensures that any missing network gets added to the NetworkEnabledMap (which handles network polling)
 *
 * @returns callback to enable a network config.
 */
export const useEnableMissingNetwork = () => {
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const dispatch = useDispatch();

  const enableMissingNetwork = useCallback(
    (chainId: Hex) => {
      const enabledNetworkKeys = Object.keys(enabledNetworksByNamespace ?? {});

      const caipChainId = formatChainIdToCaip(chainId);
      const { namespace } = parseCaipChainId(caipChainId);

      if (namespace) {
        const isPopularNetwork = FEATURED_NETWORK_CHAIN_IDS.includes(chainId);

        if (isPopularNetwork) {
          const isNetworkEnabled = enabledNetworkKeys.includes(chainId);
          if (!isNetworkEnabled) {
            // Bridging between popular networks indicates we want the 'select all' enabled
            // This way users can see their full briding tx activity
            dispatch(enableAllPopularNetworks());
          }
        }
      }
    },
    [dispatch, enabledNetworksByNamespace],
  );

  return enableMissingNetwork;
};

const PrepareBridgePage = ({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) => {
  const dispatch = useDispatch();
  const enableMissingNetwork = useEnableMissingNetwork();

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
  const isSendBundleSupportedForChain = useIsSendBundleSupported(fromChain);
  const gasIncluded = useSelector((state) =>
    getIsGasIncluded(state, isSendBundleSupportedForChain),
  );

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

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);

  const providerConfig = useMultichainSelector(getMultichainProviderConfig);
  const slippage = useSelector(getSlippage);

  const quoteRequest = useSelector(getQuoteRequest);
  const {
    isLoading,
    // This quote may be older than the refresh rate, but we keep it for display purposes
    activeQuote: unvalidatedQuote,
    quotesRefreshCount,
  } = useSelector(getBridgeQuotes);

  const isQuoteExpired = useSelector((state) =>
    getIsQuoteExpired(state as BridgeAppState, Date.now()),
  );

  const wasTxDeclined = useSelector(getWasTxDeclined);

  // Determine if the current quote is expired or does not match the currently
  // selected destination asset/chain.
  const isQuoteExpiredOrInvalid = isQuoteExpiredOrInvalidUtil({
    activeQuote: unvalidatedQuote,
    toToken,
    toChain,
    fromChain,
    isQuoteExpired,
    insufficientBal: quoteRequest.insufficientBal,
  });

  const activeQuote = isQuoteExpiredOrInvalid ? undefined : unvalidatedQuote;

  const selectedAccount = useSelector(getFromAccount);

  const gasIncluded7702 = useGasIncluded7702({
    isSwap,
    isSendBundleSupportedForChain,
    selectedAccount,
    fromChain,
  });

  const shouldShowMaxButton =
    fromToken && isNativeAddress(fromToken.address)
      ? gasIncluded || gasIncluded7702
      : true;

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

  const { tokenAlert } = useTokenAlerts();
  const {
    selectedDestinationAccount,
    setSelectedDestinationAccount,
    isDestinationAccountPickerOpen,
    setIsDestinationAccountPickerOpen,
  } = useDestinationAccount();

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
    selectedDestinationAccount && 'id' in selectedDestinationAccount
      ? selectedDestinationAccount.id
      : undefined,
  );

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

  // Scroll to bottom of the page when banners are shown
  const alertBannersRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      isEstimatedReturnLow ||
      isInsufficientGasForQuote ||
      isLowReturnBannerOpen ||
      tokenAlert ||
      txAlert ||
      isUsingHardwareWallet
    ) {
      alertBannersRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [
    isEstimatedReturnLow,
    isInsufficientGasForQuote,
    isLowReturnBannerOpen,
    tokenAlert,
    txAlert,
    isUsingHardwareWallet,
  ]);

  const isToOrFromSolana = useSelector(getIsToOrFromSolana);

  const quoteParams: Partial<GenericQuoteRequest> = useMemo(
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
      gasIncluded: gasIncluded || gasIncluded7702,
      gasIncluded7702,
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
      gasIncluded,
      gasIncluded7702,
    ],
  );

  const debouncedUpdateQuoteRequestInController = useCallback(
    debounce((...args: Parameters<typeof updateQuoteRequestParams>) => {
      dispatch(updateQuoteRequestParams(...args));
    }, 300),
    [dispatch],
  );

  useEffect(() => {
    return () => {
      debouncedUpdateQuoteRequestInController.cancel();
    };
  }, []);

  useEffect(() => {
    dispatch(setSelectedQuote(null));
    const eventProperties = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      stx_enabled: smartTransactionsEnabled,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_symbol_source: fromToken?.symbol ?? '',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_symbol_destination: toToken?.symbol ?? '',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      security_warnings: [txAlert?.descriptionId, tokenAlert?.titleId].filter(
        Boolean,
      ) as string[],
    };
    debouncedUpdateQuoteRequestInController(quoteParams, eventProperties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteParams]);

  // Use smart slippage defaults
  useSmartSlippage({
    fromChain,
    toChain,
    fromToken,
    toToken,
    isSwap,
  });

  // Trace swap/bridge view loaded
  useEffect(() => {
    endTrace({
      name: isSwap ? TraceName.SwapViewLoaded : TraceName.BridgeViewLoaded,
      timestamp: Date.now(),
    });

    if (!activeQuote) {
      // Reset controller and inputs on load if there's no restored active quote
      dispatch(resetBridgeState());
    }
  }, []);

  useBridgeQueryParams();

  const occurrences = toToken?.occurrences ?? toToken?.aggregators?.length;
  const toTokenIsNotNative =
    toToken?.address && !isNativeAddress(toToken?.address);

  const [showBlockExplorerToast, setShowBlockExplorerToast] = useState(false);
  const [blockExplorerToken, setBlockExplorerToken] =
    useState<BridgeToken | null>(null);
  const [toastTriggerCounter, setToastTriggerCounter] = useState(0);

  const getFromInputHeader = () => {
    if (isUnifiedUIEnabled) {
      return t('swapSelectToken');
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
      <DestinationAccountPickerModal
        isOpen={isDestinationAccountPickerOpen}
        onAccountSelect={(account) => {
          setSelectedDestinationAccount(account);
          setIsDestinationAccountPickerOpen(false);
        }}
        selectedAccount={selectedDestinationAccount}
        onClose={() => setIsDestinationAccountPickerOpen(false)}
      />

      <Column className="prepare-bridge-page" gap={4}>
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
          }}
          networkProps={{
            network: fromChain,
            networks: isSwap && !isUnifiedUIEnabled ? undefined : fromChains,
            onNetworkChange: (networkConfig) => {
              if (
                !isUnifiedUIEnabled &&
                networkConfig?.chainId &&
                networkConfig.chainId === toChain?.chainId
              ) {
                dispatch(setToChainId(null));
              }
              if (isNetworkAdded(networkConfig)) {
                enableMissingNetwork(networkConfig.chainId);
              }
              dispatch(
                setFromChain({
                  networkConfig,
                  selectedAccount,
                }),
              );
            },
            header: t('yourNetworks'),
          }}
          isMultiselectEnabled={isUnifiedUIEnabled || !isSwap}
          onMaxButtonClick={
            shouldShowMaxButton
              ? (value: string) => {
                  dispatch(setFromTokenInputValue(value));
                }
              : undefined
          }
          // Hides fiat amount string before a token quantity is entered.
          amountInFiat={
            fromAmountInCurrency.valueInCurrency.gt(0)
              ? fromAmountInCurrency.valueInCurrency.toString()
              : undefined
          }
          amountFieldProps={{
            testId: 'from-amount',
            autoFocus: true,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            value: fromAmount || undefined,
          }}
          containerProps={{
            paddingInline: 4,
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
          padding={4}
          gap={4}
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
              top: '-20px',
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
                dispatch(setSelectedQuote(null));
                // Track the flip event
                toChain?.chainId &&
                  fromToken &&
                  toToken &&
                  dispatch(
                    trackUnifiedSwapBridgeEvent(
                      UnifiedSwapBridgeEventName.InputSourceDestinationSwitched,
                      {
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        token_symbol_source: toToken?.symbol ?? null,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        token_symbol_destination: fromToken?.symbol ?? null,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        token_address_source:
                          toAssetId(
                            toToken.address ?? '',
                            formatChainIdToCaip(toToken.chainId ?? ''),
                          ) ??
                          getNativeAssetForChainId(toChain.chainId)?.assetId,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        token_address_destination:
                          toAssetId(
                            fromToken.address ?? '',
                            formatChainIdToCaip(fromToken.chainId ?? ''),
                          ) ?? null,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        chain_id_source: formatChainIdToCaip(toChain.chainId),
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        chain_id_destination: fromChain?.chainId
                          ? formatChainIdToCaip(fromChain?.chainId)
                          : null,
                        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        security_warnings: [],
                      },
                    ),
                  );

                setRotateSwitchTokens(!rotateSwitchTokens);

                const shouldFlipNetworks = isUnifiedUIEnabled || !isSwap;
                if (shouldFlipNetworks) {
                  // Handle account switching for Solana
                  dispatch(
                    setFromChain({
                      networkConfig: toChain,
                      token: toToken,
                      selectedAccount,
                    }),
                  );
                }
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
              dispatch(setToToken(bridgeToken));
            }}
            networkProps={
              isSwap && !isUnifiedUIEnabled
                ? undefined
                : {
                    network: toChain,
                    networks: toChains,
                    onNetworkChange: (networkConfig) => {
                      if (isNetworkAdded(networkConfig)) {
                        enableMissingNetwork(networkConfig.chainId);
                      }
                      dispatch(setToChainId(networkConfig.chainId));
                    },
                    header: t('yourNetworks'),
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
            isDestinationToken
          />

          <Column
            justifyContent={
              isLoading && !unvalidatedQuote
                ? JustifyContent.center
                : JustifyContent.flexEnd
            }
            width={BlockSize.Full}
            height={BlockSize.Full}
            gap={3}
          >
            {!wasTxDeclined && unvalidatedQuote && (
              <MultichainBridgeQuoteCard
                onOpenRecipientModal={() =>
                  setIsDestinationAccountPickerOpen(true)
                }
                onOpenSlippageModal={onOpenSettings}
                selectedDestinationAccount={selectedDestinationAccount}
              />
            )}
            {isNoQuotesAvailable && !isQuoteExpired && (
              <BannerAlert
                severity={BannerAlertSeverity.Danger}
                description={t('noOptionsAvailableMessage')}
                textAlign={TextAlign.Left}
              />
            )}
            {isLoading && !unvalidatedQuote ? (
              <>
                <Text
                  textAlign={TextAlign.Center}
                  color={TextColor.textAlternativeSoft}
                >
                  {t('swapFetchingQuotes')}
                </Text>
                <MascotBackgroundAnimation height="64" width="64" />
              </>
            ) : (
              <PrepareBridgePageFooter
                onFetchNewQuotes={() => {
                  debouncedUpdateQuoteRequestInController(quoteParams, {
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    stx_enabled: smartTransactionsEnabled,
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    token_symbol_source: fromToken?.symbol ?? '',
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    token_symbol_destination: toToken?.symbol ?? '',
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    security_warnings: [], // TODO populate security warnings
                  });
                }}
                needsDestinationAddress={
                  isToOrFromSolana && !selectedDestinationAccount
                }
              />
            )}
          </Column>
        </Column>
      </Column>

      {/** Alert banners */}
      <Column
        paddingInline={4}
        gap={4}
        backgroundColor={BackgroundColor.backgroundAlternativeSoft}
      >
        {isUsingHardwareWallet &&
          isTxSubmittable &&
          hardwareWalletName &&
          activeQuote && (
            <BannerAlert
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
            severity={BannerAlertSeverity.Danger}
            title={t(txAlert.titleId)}
            description={`${txAlert.description} ${t(txAlert.descriptionId)}`}
            textAlign={TextAlign.Left}
          />
        )}
        {isCannotVerifyTokenBannerOpen &&
          toToken &&
          toTokenIsNotNative &&
          occurrences &&
          Number(occurrences) < 2 && (
            <BannerAlert
              severity={BannerAlertSeverity.Warning}
              title={t('bridgeTokenCannotVerifyTitle')}
              description={t('bridgeTokenCannotVerifyDescription')}
              textAlign={TextAlign.Left}
              onClose={() => setIsCannotVerifyTokenBannerOpen(false)}
            />
          )}
        {tokenAlert && isTokenAlertBannerOpen && (
          <BannerAlert
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
          !isInsufficientBalance &&
          isInsufficientGasForQuote && (
            <BannerAlert
              title={t('bridgeValidationInsufficientGasTitle', [ticker])}
              severity={BannerAlertSeverity.Danger}
              description={t(
                isSwap
                  ? 'swapValidationInsufficientGasMessage'
                  : 'bridgeValidationInsufficientGasMessage',
                [ticker],
              )}
              textAlign={TextAlign.Left}
              actionButtonLabel={t('buyMoreAsset', [ticker])}
              actionButtonOnClick={() => openBuyCryptoInPdapp()}
            />
          )}
        {isEstimatedReturnLow && isLowReturnBannerOpen && activeQuote && (
          <BannerAlert
            title={t('lowEstimatedReturnTooltipTitle')}
            severity={BannerAlertSeverity.Warning}
            description={t('lowEstimatedReturnTooltipMessage', [
              BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE * 100,
            ])}
            textAlign={TextAlign.Left}
            onClose={() => setIsLowReturnBannerOpen(false)}
          />
        )}
        <div ref={alertBannersRef} />
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
