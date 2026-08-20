import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'clsx';
import { BigNumber } from 'bignumber.js';
import { debounce } from 'lodash';
import {
  FeatureId,
  formatChainIdToCaip,
  isValidQuoteRequest,
  isNativeAddress,
  isSolanaChainId,
  UnifiedSwapBridgeEventName,
  type BridgeController,
  formatAddressToCaipReference,
} from '@metamask/bridge-controller';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import {
  setFromToken,
  setFromTokenInputValue,
  setSelectedQuote,
  updateQuoteRequestParams,
  trackUnifiedSwapBridgeEvent,
  setIsSrcAssetPickerOpen,
  setIsDestAssetPickerOpen,
  setWasTxDeclined,
} from '../../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getQuoteRequest,
  getSlippage,
  getIsSlippageUserOverride,
  getToChain,
  getToToken,
  getWasTxDeclined,
  getFromAmountInCurrency,
  getFromTokenConversionRate,
  getIsFiatToggleEnabled,
  getIsToOrFromNonEvm,
  getFromAccount,
  getIsStxEnabled,
  getValidatedFromValue,
  getQuoteRequestInsufficientBal,
} from '../../../ducks/bridge/selectors';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  ButtonIcon,
  IconName,
} from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
import { isNetworkAdded } from '../../../ducks/bridge/utils';
import { Column } from '../layout';
import { SECOND } from '../../../../shared/constants/time';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainProviderConfig } from '../../../selectors/multichain';
import { Toast, ToastContainer } from '../../../components/multichain';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { useLatestBalance } from '../../../hooks/bridge/useLatestBalance';
import { useSelectedTokenSecurityData } from '../../../hooks/bridge/useSelectedTokenSecurityData';
import { MarketClosedModal } from '../../../components/app/assets/market-closed-modal';
import { isArcTokenUSDC } from '../../../components/app/assets/enablement/arc';
import {
  MultichainBridgeQuoteCard,
  MultichainBridgeQuoteCardSkeleton,
} from '../quotes/multichain-bridge-quote-card';
import { useDestinationAccount } from '../hooks/useDestinationAccount';
import { useBridgeAlerts } from '../hooks/useBridgeAlerts';
import { useSecurityAlerts } from '../hooks/useSecurityAlerts';
import { useGasIncludedSupport } from '../hooks/useGasIncludedSupport';
import { getTokenSecurityAssetKey } from '../utils/token-security';
import { useDispatch } from '../../../store/hooks';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getCurrencySymbol } from '../../../helpers/utils/common.util';
import { useSourceInputAmount } from '../../../hooks/bridge/useSourceInputAmount';
import { BridgeInputGroup } from './bridge-input-group';
import { PrepareBridgePageFooter } from './prepare-bridge-page-footer';
import { DestinationAccountPickerModal } from './components/destination-account-picker-modal';
import { BridgeAlertModal } from './components/bridge-alert-modal';
import { BridgeAlertBannerList } from './components/bridge-alert-banner-list';

const PrepareBridgePage = ({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) => {
  const dispatch = useDispatch();

  const t = useI18nContext();
  const { formatCurrency } = useFormatters();

  const fromChain = useSelector(getFromChain);

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const selectedTokenSecurityData = useSelectedTokenSecurityData(
    fromToken,
    toToken,
  );

  const fromChains = useSelector(getFromChains);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);
  const validatedFromValue = useSelector(getValidatedFromValue);
  const fromAmountInCurrency = useSelector(getFromAmountInCurrency);
  const fromTokenConversionRate = useSelector(
    getFromTokenConversionRate,
  ).valueInCurrency;
  const isFiatToggleEnabled = useSelector(getIsFiatToggleEnabled);
  const currency = useSelector(getCurrentCurrency);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);

  const providerConfig = useMultichainSelector(getMultichainProviderConfig);
  const slippage = useSelector(getSlippage);
  const isSlippageUserOverride = useSelector(getIsSlippageUserOverride);

  const quoteRequest = useSelector(getQuoteRequest);
  const {
    isLoading,
    // This quote may be older than the refresh rate, but we keep it for display purposes
    activeQuote: unvalidatedQuote,
  } = useSelector(getBridgeQuotes);
  const { dest } = unvalidatedQuote?.quote ?? {};

  const wasTxDeclined = useSelector(getWasTxDeclined);

  const isQuoteRequestInsufficientBal = useSelector(
    getQuoteRequestInsufficientBal,
  );
  const { securityWarnings } = useSecurityAlerts(toToken);
  const { confirmationAlerts, alertsById } = useBridgeAlerts();

  const selectedAccount = useSelector(getFromAccount);

  const { gasIncluded, gasIncluded7702, nativeGasIncluded } =
    useGasIncludedSupport();

  const shouldShowMaxButton =
    fromToken &&
    // Always show for non-native tokens. Arc ERC20 USDC considered as native.
    (isNativeAddress(fromToken.assetId) || isArcTokenUSDC(fromToken.assetId))
      ? !isSolanaChainId(fromToken.chainId) &&
        (gasIncluded || gasIncluded7702 || nativeGasIncluded)
      : true;
  const locale = useSelector(getIntlLocale);

  const sourceInputAmount = useSourceInputAmount({
    enabled: isFiatToggleEnabled,
    sourceAmount: fromAmount,
    conversionRate: fromTokenConversionRate,
    sourceToken: fromToken,
    destinationToken: toToken,
    onSourceAmountChange: (value) => dispatch(setFromTokenInputValue(value)),
  });

  let sourceSecondaryDisplay: string | undefined;
  if (sourceInputAmount.isFiatPrimary && fromToken) {
    sourceSecondaryDisplay = formatTokenAmount(
      locale,
      sourceInputAmount.tokenAmount || '0',
      fromToken.symbol,
      BigNumber.ROUND_DOWN,
    );
  } else if (fromTokenConversionRate) {
    sourceSecondaryDisplay = fromAmountInCurrency.valueInCurrency.isZero()
      ? formatCurrency('0', currency, {
          currencyDisplay: 'narrowSymbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : formatCurrencyAmount(
          fromAmountInCurrency.valueInCurrency.toString(),
          currency,
          2,
        );
  }

  const destinationTokenAmount = dest?.normalizedAmount;
  const destinationFiatAmount = dest?.valueInCurrency;
  const isDestinationFiatPrimary =
    sourceInputAmount.isFiatPrimary && Boolean(destinationFiatAmount);
  let destinationAmount = '0';
  if (isDestinationFiatPrimary) {
    destinationAmount = destinationFiatAmount
      ? new BigNumber(destinationFiatAmount).toFixed(2)
      : '0';
  } else if (destinationTokenAmount) {
    destinationAmount = formatTokenAmount(locale, destinationTokenAmount);
  }

  let destinationSecondaryDisplay: string | undefined;
  if (isDestinationFiatPrimary && destinationTokenAmount) {
    destinationSecondaryDisplay = formatTokenAmount(
      locale,
      destinationTokenAmount,
      toToken.symbol,
      BigNumber.ROUND_DOWN,
    );
  } else if (destinationFiatAmount) {
    destinationSecondaryDisplay = formatCurrencyAmount(
      destinationFiatAmount,
      currency,
      2,
    );
  }

  const {
    selectedDestinationAccount,
    setSelectedDestinationAccount,
    isDestinationAccountPickerOpen,
    setIsDestinationAccountPickerOpen,
  } = useDestinationAccount();

  useLatestBalance();

  const [rotateSwitchTokens, setRotateSwitchTokens] = useState(false);

  // Background updates are debounced when the switch button is clicked
  // To prevent putting the frontend in an unexpected state, prevent the user
  // from switching tokens within the debounce period
  const [isSwitchingTemporarilyDisabled, setIsSwitchingTemporarilyDisabled] =
    useState(false);
  const isFirstRotateEffectRef = useRef(true);
  useEffect(() => {
    if (isFirstRotateEffectRef.current) {
      isFirstRotateEffectRef.current = false;
      return undefined;
    }
    queueMicrotask(() => {
      setIsSwitchingTemporarilyDisabled(true);
    });
    const switchButtonTimer = setTimeout(() => {
      setIsSwitchingTemporarilyDisabled(false);
    }, SECOND);

    return () => {
      clearTimeout(switchButtonTimer);
    };
  }, [rotateSwitchTokens]);

  // Scroll to CTA of the page after quotes load
  const footerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // If quotes are still loading, don't scroll to the footer area
    if (isLoading) {
      return;
    }
    footerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [isLoading]);

  const isToOrFromNonEvm = useSelector(getIsToOrFromNonEvm);
  const fromTokenAssetId = fromToken?.assetId;
  const toTokenAssetId = toToken?.assetId;
  const fromTokenChainId = fromToken?.chainId;
  const toTokenChainId = toToken?.chainId;
  const selectedAccountAddress = selectedAccount?.address;
  const selectedDestinationAccountAddress = selectedDestinationAccount?.address;
  const providerConfigRpcUrl = providerConfig?.rpcUrl;
  const quoteParams:
    | Parameters<BridgeController['updateBridgeQuoteRequestParams']>[0]
    | undefined = useMemo(() => {
    if (!selectedAccountAddress) {
      return undefined;
    }
    return {
      srcTokenAddress: fromTokenAssetId
        ? formatAddressToCaipReference(fromTokenAssetId)
        : undefined,
      destTokenAddress: toTokenAssetId
        ? formatAddressToCaipReference(toTokenAssetId)
        : undefined,
      srcTokenAmount: validatedFromValue,
      srcChainId: fromTokenChainId,
      destChainId: toTokenChainId,
      // This override allows quotes to be returned when the rpcUrl is a forked network
      // Otherwise quotes get filtered out by the bridge-api when the wallet's real
      // balance is less than the tenderly balance
      insufficientBal: providerConfigRpcUrl?.includes('localhost')
        ? true
        : isQuoteRequestInsufficientBal,
      ...(slippage === undefined ? {} : { slippage }),
      walletAddress: selectedAccountAddress,
      destWalletAddress: selectedDestinationAccountAddress,
      gasIncluded,
      gasIncluded7702,
    };
  }, [
    fromTokenAssetId,
    toTokenAssetId,
    validatedFromValue,
    fromTokenChainId,
    toTokenChainId,
    slippage,
    selectedAccountAddress,
    selectedDestinationAccountAddress,
    providerConfigRpcUrl,
    gasIncluded,
    gasIncluded7702,
    isQuoteRequestInsufficientBal,
  ]);

  // `useRef` is used here to manually memoize a function reference.
  // `useCallback` and React Compiler don't understand that `debounce` returns an inline function reference.
  // The function contains reactive dependencies, but they are `dispatch` and an action,
  // making it safe not to worry about recreating this function on dependency updates.
  const debouncedUpdateQuoteRequestInController = useRef(
    debounce((...args: Parameters<typeof updateQuoteRequestParams>) => {
      dispatch(updateQuoteRequestParams(...args));
    }, 300),
  );
  const previousSlippageRef = useRef(slippage);

  useEffect(() => {
    const previousSlippage = previousSlippageRef.current;
    previousSlippageRef.current = slippage;

    if (!quoteParams) {
      return;
    }

    const isHydrationOnlySlippageChange =
      !isSlippageUserOverride &&
      previousSlippage === undefined &&
      slippage !== undefined;

    if (isHydrationOnlySlippageChange) {
      return;
    }

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
      token_security_type_destination: toToken?.securityData?.type ?? null,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      security_warnings: securityWarnings,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      usd_amount_source: fromAmountInCurrency.usd.toNumber(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
    };
    debouncedUpdateQuoteRequestInController.current(
      quoteParams,
      eventProperties,
    );
  }, [quoteParams, isSlippageUserOverride, slippage]);

  // Trace swap/bridge view loaded
  useEffect(() => {
    endTrace({
      name: TraceName.SwapViewLoaded,
      timestamp: Date.now(),
    });

    return () => {
      // This `ref` is safe from unintended mutations, because it points to a function reference, not any reactive node or element.
      debouncedUpdateQuoteRequestInController.current.cancel();
    };
  }, []);

  const [showBlockExplorerToast, setShowBlockExplorerToast] = useState(false);
  const [blockExplorerToken, setBlockExplorerToken] =
    useState<BridgeToken | null>(null);
  const [toastTriggerCounter, setToastTriggerCounter] = useState(0);
  const isInitialQuoteLoading = isLoading && !unvalidatedQuote;

  const [alertModalProps, setAlertModalProps] = useState<
    Pick<
      React.ComponentProps<typeof BridgeAlertModal>,
      'variant' | 'isOpen' | 'alertId'
    >
  >({});

  const [isMarketClosedModalOpen, setIsMarketClosedModalOpen] = useState(false);

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
      <BridgeAlertModal
        {...alertModalProps}
        onClose={() => setAlertModalProps({})}
      />

      <MarketClosedModal
        isOpen={isMarketClosedModalOpen}
        onClose={() => setIsMarketClosedModalOpen(false)}
      />

      <Column
        className="prepare-bridge-page"
        gap={4}
        data-testid="parent-selector-bridge-quote"
      >
        <BridgeInputGroup
          setIsAssetPickerOpen={(isOpen) =>
            dispatch(setIsSrcAssetPickerOpen(isOpen))
          }
          token={fromToken}
          tokenSecurityData={
            selectedTokenSecurityData[
              getTokenSecurityAssetKey(fromToken.assetId)
            ]
          }
          onAmountChange={sourceInputAmount.handleAmountChange}
          onMaxButtonClick={
            shouldShowMaxButton
              ? (value: string) => {
                  dispatch(setFromTokenInputValue(value));
                }
              : undefined
          }
          // Hides fiat amount string before a token quantity is entered.
          secondaryDisplay={sourceSecondaryDisplay}
          amountInputPrefix={
            sourceInputAmount.isFiatPrimary
              ? getCurrencySymbol(currency)
              : undefined
          }
          onAmountTypeToggle={
            sourceInputAmount.canToggle
              ? sourceInputAmount.togglePrimaryDenomination
              : undefined
          }
          amountFieldProps={{
            testId: 'from-amount',
            autoFocus: true,
            value: sourceInputAmount.amount,
          }}
          containerProps={{
            paddingInline: 4,
          }}
          buttonProps={{ testId: 'bridge-source-button' }}
          onBlockExplorerClick={(token) => {
            setBlockExplorerToken(token);
            setShowBlockExplorerToast(true);
            setToastTriggerCounter((prev) => prev + 1);
          }}
          isDestination={false}
        />

        <Column
          padding={4}
          gap={4}
          backgroundColor={BackgroundColor.backgroundDefault}
          style={{
            position: 'relative',
          }}
        >
          <Box
            className="prepare-bridge-page__switch-tokens flex"
            backgroundColor={BoxBackgroundColor.BackgroundSection}
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
              iconName={IconName.SwapVertical}
              color={IconColor.iconAlternative}
              disabled={
                isSwitchingTemporarilyDisabled ||
                !isValidQuoteRequest(quoteRequest, false) ||
                (toChain && !isNetworkAdded(fromChains, toChain.chainId))
              }
              onClick={() => {
                const previousDestAmount = dest?.normalizedAmount;
                dispatch(setSelectedQuote(null));
                if (!toChain || !fromToken || !toToken) {
                  return;
                }
                // Track the flip event
                dispatch(
                  trackUnifiedSwapBridgeEvent(
                    UnifiedSwapBridgeEventName.InputSourceDestinationSwitched,
                    {
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      token_symbol_source: toToken.symbol,
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      token_symbol_destination: fromToken.symbol,
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      token_address_source: toToken.assetId,
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      token_address_destination: fromToken.assetId,
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
                      token_security_type_destination:
                        toToken?.securityData?.type ?? null,
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      security_warnings: securityWarnings,
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
                    },
                  ),
                );

                setRotateSwitchTokens(!rotateSwitchTokens);

                dispatch(setFromToken(toToken));
                previousDestAmount &&
                  dispatch(
                    setFromTokenInputValue(
                      formatTokenAmount(locale, previousDestAmount),
                    ),
                  );
              }}
            />
          </Box>

          <Box
            className="px-4"
            style={{
              borderTop: '1px solid var(--color-border-muted)',
              marginTop: '-16px',
            }}
          />

          <BridgeInputGroup
            setIsAssetPickerOpen={(isOpen) =>
              dispatch(setIsDestAssetPickerOpen(isOpen))
            }
            token={toToken}
            tokenSecurityData={
              selectedTokenSecurityData[
                getTokenSecurityAssetKey(toToken.assetId)
              ]
            }
            secondaryDisplay={destinationSecondaryDisplay}
            amountInputPrefix={
              isDestinationFiatPrimary ? getCurrencySymbol(currency) : undefined
            }
            amountFieldProps={{
              testId: 'to-amount',
              readOnly: true,
              disabled: true,
              value: destinationAmount,
              autoFocus: false,
              className: destinationTokenAmount
                ? 'amount-input defined'
                : 'amount-input',
            }}
            showAmountSkeleton={isInitialQuoteLoading}
            buttonProps={{ testId: 'bridge-destination-button' }}
            onBlockExplorerClick={(token) => {
              setBlockExplorerToken(token);
              setShowBlockExplorerToast(true);
              setToastTriggerCounter((prev) => prev + 1);
            }}
            isDestination={true}
          />
        </Column>

        {/** Alert banners */}
        {quoteParams && <BridgeAlertBannerList quoteParams={quoteParams} />}

        {/* Quote details - displayed below the swap form */}
        {(isInitialQuoteLoading || (!wasTxDeclined && unvalidatedQuote)) && (
          <Column paddingInline={4} gap={2}>
            {isInitialQuoteLoading ? (
              <MultichainBridgeQuoteCardSkeleton />
            ) : (
              <MultichainBridgeQuoteCard
                onOpenRecipientModal={() =>
                  setIsDestinationAccountPickerOpen(true)
                }
                onOpenPriceImpactWarningModal={() =>
                  alertsById['price-impact'] &&
                  setAlertModalProps({
                    isOpen: true,
                    variant: 'alert-details',
                    alertId: 'price-impact',
                  })
                }
                onOpenSlippageModal={onOpenSettings}
                selectedDestinationAccount={selectedDestinationAccount}
              />
            )}
          </Column>
        )}

        {!isInitialQuoteLoading && (
          <Column
            justifyContent={JustifyContent.flexEnd}
            width={BlockSize.Full}
            height={BlockSize.Full}
            gap={3}
            paddingInline={4}
            paddingTop={4}
            paddingBottom={4}
            backgroundColor={BackgroundColor.backgroundDefault}
            style={{ position: 'sticky', bottom: 0 }}
          >
            <PrepareBridgePageFooter
              onFetchNewQuotes={() => {
                if (wasTxDeclined) {
                  dispatch(setWasTxDeclined(false));
                }
                if (!quoteParams) {
                  return;
                }
                setAlertModalProps({});
                debouncedUpdateQuoteRequestInController.current(quoteParams, {
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
                  token_security_type_destination:
                    toToken?.securityData?.type ?? null,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  security_warnings: securityWarnings,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  usd_amount_source: fromAmountInCurrency.usd.toNumber(),
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
                });
              }}
              needsDestinationAddress={
                isToOrFromNonEvm && !selectedDestinationAccount
              }
              inputPrimaryDenomination={sourceInputAmount.selectedDenomination}
              onOpenRecipientModal={() =>
                setIsDestinationAccountPickerOpen(true)
              }
              onOpenAlertModals={
                confirmationAlerts.length > 0
                  ? () =>
                      setAlertModalProps({
                        isOpen: true,
                        variant: 'submit-cta',
                      })
                  : undefined
              }
              onOpenMarketClosedModal={() => setIsMarketClosedModalOpen(true)}
            />
          </Column>
        )}
        <div ref={footerRef} />
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
                  src={toToken.iconUrl ?? undefined}
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
