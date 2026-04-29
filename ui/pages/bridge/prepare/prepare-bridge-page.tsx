import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'clsx';
import { debounce } from 'lodash';
import {
  formatChainIdToCaip,
  isValidQuoteRequest,
  isNativeAddress,
  UnifiedSwapBridgeEventName,
  type BridgeController,
  formatAddressToCaipReference,
} from '@metamask/bridge-controller';
import { BRIDGE_ONLY_CHAINS } from '../../../../shared/constants/bridge';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import {
  setFromToken,
  setFromTokenInputValue,
  setSelectedQuote,
  setToToken,
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
  getToChain,
  getToChains,
  getToToken,
  getWasTxDeclined,
  getFromAmountInCurrency,
  getValidationErrors,
  getIsToOrFromNonEvm,
  getFromAccount,
  getIsStxEnabled,
  getIsGasIncluded,
  getValidatedFromValue,
  getIsSrcAssetPickerOpen,
  getIsDestAssetPickerOpen,
  getBridgeUnavailableQuoteReason,
} from '../../../ducks/bridge/selectors';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  ButtonIcon,
  IconName,
} from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatTokenAmount } from '../utils/quote';
import { isNetworkAdded } from '../../../ducks/bridge/utils';
import { Column } from '../layout';
import { getCurrentKeyring } from '../../../selectors';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { SECOND } from '../../../../shared/constants/time';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainProviderConfig } from '../../../selectors/multichain';
import { Toast, ToastContainer } from '../../../components/multichain';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { useLatestBalance } from '../../../hooks/bridge/useLatestBalance';
import { MarketClosedModal } from '../../../components/app/assets/market-closed-modal';
import { useGasIncluded7702 } from '../hooks/useGasIncluded7702';
import { useIsSendBundleSupported } from '../hooks/useIsSendBundleSupported';
import {
  MultichainBridgeQuoteCard,
  MultichainBridgeQuoteCardSkeleton,
} from '../quotes/multichain-bridge-quote-card';
import { useDestinationAccount } from '../hooks/useDestinationAccount';
import { useBridgeAlerts } from '../hooks/useBridgeAlerts';
import { useSecurityAlerts } from '../hooks/useSecurityAlerts';
import { useEnsureNetworkEnabled } from '../hooks/useEnsureNetworkEnabled';
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

  const fromChain = useSelector(getFromChain);

  const isSendBundleSupportedForChain = useIsSendBundleSupported(fromChain);
  const gasIncluded = useSelector((state) =>
    getIsGasIncluded(state, isSendBundleSupportedForChain),
  );

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const toChain = useSelector(getToChain);

  const isSwap = fromToken.chainId === toToken.chainId;

  const fromAmount = useSelector(getFromAmount);
  const validatedFromValue = useSelector(getValidatedFromValue);
  const fromAmountInCurrency = useSelector(getFromAmountInCurrency);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);

  const providerConfig = useMultichainSelector(getMultichainProviderConfig);
  const slippage = useSelector(getSlippage);

  const quoteRequest = useSelector(getQuoteRequest);
  const {
    isLoading,
    // This quote may be older than the refresh rate, but we keep it for display purposes
    activeQuote: unvalidatedQuote,
  } = useSelector(getBridgeQuotes);

  const wasTxDeclined = useSelector(getWasTxDeclined);
  const isSrcAssetPickerOpen = useSelector(getIsSrcAssetPickerOpen);
  const isDestAssetPickerOpen = useSelector(getIsDestAssetPickerOpen);

  const { isInsufficientBalance, isInsufficientNativeReserve } =
    useSelector(getValidationErrors);
  const { securityWarnings } = useSecurityAlerts(toToken);
  const { confirmationAlerts, alertsById } = useBridgeAlerts();

  const selectedAccount = useSelector(getFromAccount);

  const gasIncluded7702 = useGasIncluded7702({
    isSwap,
    isSendBundleSupportedForChain,
    selectedAccount,
    fromChain,
  });

  const keyring = useSelector(getCurrentKeyring);
  const isUsingHardwareWallet = isHardwareKeyring(keyring?.type);

  const effectiveGasIncluded = gasIncluded;
  const effectiveGasIncluded7702 = !isUsingHardwareWallet && gasIncluded7702;

  const shouldShowMaxButton =
    fromToken && isNativeAddress(fromToken.assetId)
      ? effectiveGasIncluded || effectiveGasIncluded7702
      : true;
  const locale = useSelector(getIntlLocale);

  const {
    selectedDestinationAccount,
    setSelectedDestinationAccount,
    isDestinationAccountPickerOpen,
    setIsDestinationAccountPickerOpen,
  } = useDestinationAccount();

  useLatestBalance();

  const ensureNetworkEnabled = useEnsureNetworkEnabled();

  const [rotateSwitchTokens, setRotateSwitchTokens] = useState(false);

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
  const quoteParams:
    | Parameters<BridgeController['updateBridgeQuoteRequestParams']>[0]
    | undefined = useMemo(() => {
    if (!selectedAccount?.address) {
      return undefined;
    }
    return {
      srcTokenAddress: fromToken?.assetId
        ? formatAddressToCaipReference(fromToken.assetId)
        : undefined,
      destTokenAddress: toToken?.assetId
        ? formatAddressToCaipReference(toToken.assetId)
        : undefined,
      srcTokenAmount: validatedFromValue,
      srcChainId: fromToken?.chainId,
      destChainId: toToken?.chainId,
      // This override allows quotes to be returned when the rpcUrl is a forked network
      // Otherwise quotes get filtered out by the bridge-api when the wallet's real
      // balance is less than the tenderly balance
      insufficientBal: providerConfig?.rpcUrl?.includes('localhost')
        ? true
        : isInsufficientBalance || isInsufficientNativeReserve,
      slippage,
      walletAddress: selectedAccount.address,
      destWalletAddress: selectedDestinationAccount?.address,
      gasIncluded: effectiveGasIncluded || effectiveGasIncluded7702,
      gasIncluded7702: effectiveGasIncluded7702,
    };
  }, [
    fromToken?.assetId,
    toToken?.assetId,
    validatedFromValue,
    fromToken?.chainId,
    toToken?.chainId,
    slippage,
    selectedAccount?.address,
    selectedDestinationAccount?.address,
    providerConfig?.rpcUrl,
    effectiveGasIncluded,
    effectiveGasIncluded7702,
    isInsufficientBalance,
    isInsufficientNativeReserve,
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

  useEffect(() => {
    dispatch(setSelectedQuote(null));
    if (!quoteParams) {
      return;
    }
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
      security_warnings: securityWarnings,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      usd_amount_source: fromAmountInCurrency.usd.toNumber(),
    };
    debouncedUpdateQuoteRequestInController.current(
      quoteParams,
      eventProperties,
    );
  }, [quoteParams]);

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

      <Column className="prepare-bridge-page" gap={4}>
        <BridgeInputGroup
          isAssetPickerOpen={isSrcAssetPickerOpen}
          setIsAssetPickerOpen={(isOpen) =>
            dispatch(setIsSrcAssetPickerOpen(isOpen))
          }
          header={t('swapSelectToken')}
          token={fromToken}
          accountAddress={selectedAccount?.address}
          onAmountChange={(e) => {
            dispatch(setFromTokenInputValue(e));
          }}
          onAssetChange={async (token) => {
            await ensureNetworkEnabled(token.chainId);
            dispatch(setFromToken(token));
          }}
          networks={fromChains}
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
            className="prepare-bridge-page__switch-tokens"
            display={Display.Flex}
            backgroundColor={BackgroundColor.backgroundSection}
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
                const previousDestAmount =
                  unvalidatedQuote?.toTokenAmount?.amount;
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
                      security_warnings: securityWarnings,
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
                dispatch(setToToken(fromToken));
              }}
            />
          </Box>

          <Box
            paddingInline={4}
            style={{
              borderTop: '1px solid var(--color-border-muted)',
              marginTop: '-16px',
            }}
          />

          <BridgeInputGroup
            isAssetPickerOpen={isDestAssetPickerOpen}
            setIsAssetPickerOpen={(isOpen) =>
              dispatch(setIsDestAssetPickerOpen(isOpen))
            }
            header={t('swapSelectToken')}
            accountAddress={
              selectedDestinationAccount?.address ?? selectedAccount.address
            }
            token={toToken}
            // If the fromChain is a bridge-only chain, disable it in the toChain picker
            disabledChainId={
              fromChain?.chainId &&
              BRIDGE_ONLY_CHAINS.includes(fromChain.chainId)
                ? fromChain.chainId
                : undefined
            }
            onAssetChange={async (newToToken) => {
              await ensureNetworkEnabled(newToToken.chainId);
              dispatch(setToToken(newToToken));
            }}
            networks={toChains}
            amountInFiat={
              unvalidatedQuote?.toTokenAmount?.valueInCurrency ?? undefined
            }
            amountFieldProps={{
              testId: 'to-amount',
              readOnly: true,
              disabled: true,
              value: unvalidatedQuote?.toTokenAmount?.amount
                ? formatTokenAmount(
                    locale,
                    unvalidatedQuote.toTokenAmount.amount,
                  )
                : '0',
              autoFocus: false,
              className: unvalidatedQuote?.toTokenAmount?.amount
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
            paddingBottom={4}
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
                  security_warnings: securityWarnings,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  usd_amount_source: fromAmountInCurrency.usd.toNumber(),
                });
              }}
              needsDestinationAddress={
                isToOrFromNonEvm && !selectedDestinationAccount
              }
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
