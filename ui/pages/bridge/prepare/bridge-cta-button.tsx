import React, { useContext, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  Button,
  ButtonLink,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import {
  getFromAmount,
  getToToken,
  getBridgeQuotes,
  getValidationErrors,
  getWasTxDeclined,
  getIsQuoteExpired,
  BridgeAppState,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import {
  AlignItems,
  BlockSize,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import { Row } from '../layout';
import {
  ConnectionStatus,
  createHardwareWalletError,
  HardwareWalletType,
  useHardwareWalletConfig,
  useHardwareWalletState,
} from '../../../contexts/hardware-wallets';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsHardwareWalletRecoveryLocation,
} from '../../../../shared/constants/metametrics';
import {
  buildHardwareWalletRecoverySegmentProperties,
  getHardwareWalletMetricDeviceModel,
  mapHardwareWalletRecoveryErrorType,
  mapHardwareWalletTypeToMetricDeviceType,
} from '../../../../shared/lib/hardware-wallet-recovery-metrics';

export const BridgeCTAButton = ({
  onFetchNewQuotes,
  needsDestinationAddress = false,
  onOpenRecipientModal,
  onOpenPriceImpactWarningModal,
  onOpenMarketClosedModal,
}: {
  onFetchNewQuotes: () => void;
  needsDestinationAddress?: boolean;
  onOpenRecipientModal?: () => void;
  onOpenPriceImpactWarningModal: () => void;
  onOpenMarketClosedModal?: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const toToken = useSelector(getToToken);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);

  const isQuoteExpired = useSelector((state) =>
    getIsQuoteExpired(state as BridgeAppState, Date.now()),
  );
  const { submitBridgeTransaction, isSubmitting } =
    useSubmitBridgeTransaction();

  const {
    isNoQuotesAvailable,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    isTxAlertPresent,
    isTxAlertLoading,
    isStockMarketClosed: isMarketClosed,
    isPriceImpactError,
  } = useSelector(
    (state) => getValidationErrors(state as BridgeAppState, Date.now()),
    shallowEqual,
  );

  const wasTxDeclined = useSelector(getWasTxDeclined);

  const isTxSubmittable = useIsTxSubmittable();

  const { trackEvent } = useContext(MetaMetricsContext);

  const { isHardwareWalletAccount, walletType } = useHardwareWalletConfig();
  const { connectionState } = useHardwareWalletState();

  const hardwareWalletName = useMemo(
    () => (walletType ? t(walletType) : undefined),
    [t, walletType],
  );

  const isHardwareWalletReady = useMemo(() => {
    if (!isHardwareWalletAccount) {
      return true;
    }
    return [ConnectionStatus.Connected, ConnectionStatus.Ready].includes(
      connectionState.status,
    );
  }, [connectionState.status, isHardwareWalletAccount]);

  const label = useMemo(() => {
    if (wasTxDeclined) {
      return { key: 'youDeclinedTheTransaction' };
    }

    if (!fromAmount) {
      if (!toToken) {
        return {
          key: needsDestinationAddress
            ? 'bridgeSelectTokenAmountAndAccount'
            : 'bridgeSelectTokenAndAmount',
        };
      }
      return {
        key: needsDestinationAddress
          ? 'bridgeSelectDestinationAccount'
          : 'bridgeEnterAmount',
      };
    }

    if (isMarketClosed) {
      return { key: 'bridgeMarketClosedAction' };
    }

    if (needsDestinationAddress) {
      return { key: 'bridgeSelectDestinationAccount' };
    }

    if (isQuoteExpired && !isLoading) {
      return { key: 'bridgeQuoteExpired' };
    }

    if (isLoading && !isTxSubmittable && !activeQuote) {
      return undefined;
    }

    if (isInsufficientGasBalance || isNoQuotesAvailable) {
      return undefined;
    }

    if (isInsufficientBalance || isInsufficientGasForQuote) {
      return { key: 'alertReasonInsufficientBalance' };
    }

    if (isTxSubmittable || isTxAlertPresent || isTxAlertLoading) {
      if (isHardwareWalletAccount && !isHardwareWalletReady) {
        return hardwareWalletName
          ? { key: 'connectHardwareDevice', args: [hardwareWalletName] }
          : { key: 'connect' };
      }
      return { key: 'swap' };
    }

    return { key: 'swapSelectToken' };
  }, [
    isLoading,
    isTxAlertPresent,
    isTxAlertLoading,
    fromAmount,
    toToken,
    isTxSubmittable,
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    wasTxDeclined,
    isQuoteExpired,
    isMarketClosed,
    needsDestinationAddress,
    activeQuote,
    isNoQuotesAvailable,
    isHardwareWalletAccount,
    isHardwareWalletReady,
    hardwareWalletName,
  ]);

  // Label for the secondary button that re-starts quote fetching
  const secondaryButtonLabel = useMemo(() => {
    if (wasTxDeclined || isQuoteExpired) {
      return 'bridgeFetchNewQuotes';
    }
    return undefined;
  }, [wasTxDeclined, isQuoteExpired]);

  return (activeQuote || needsDestinationAddress || isMarketClosed) &&
    !secondaryButtonLabel ? (
    <Button
      width={BlockSize.Full}
      size={ButtonSize.Lg}
      variant={ButtonVariant.Primary}
      data-testid="bridge-cta-button"
      style={{ boxShadow: 'none' }}
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClick={async () => {
        if (isMarketClosed) {
          onOpenMarketClosedModal?.();
          return;
        }

        if (needsDestinationAddress && onOpenRecipientModal) {
          onOpenRecipientModal();
          return;
        }

        if (activeQuote && isTxSubmittable && !isSubmitting) {
          if (isPriceImpactError) {
            onOpenPriceImpactWarningModal();
          } else {
            if (isHardwareWalletAccount && !isHardwareWalletReady) {
              const connectionError =
                connectionState.status === ConnectionStatus.ErrorState
                  ? connectionState.error
                  : undefined;
              const walletTypeForMetrics =
                walletType ?? HardwareWalletType.Ledger;
              const errorForMetrics =
                connectionError ??
                createHardwareWalletError(
                  ErrorCode.DeviceDisconnected,
                  walletTypeForMetrics,
                );
              const errorType =
                mapHardwareWalletRecoveryErrorType(errorForMetrics);
              const deviceType =
                mapHardwareWalletTypeToMetricDeviceType(walletType);
              if (deviceType) {
                trackEvent({
                  category: MetaMetricsEventCategory.Accounts,
                  event: MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
                  properties: buildHardwareWalletRecoverySegmentProperties({
                    location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
                    deviceType,
                    deviceModel:
                      getHardwareWalletMetricDeviceModel(errorForMetrics),
                    errorType,
                    errorTypeViewCount: 1,
                    error: errorForMetrics,
                  }),
                }).catch(() => {
                  // Analytics must not block or surface errors to the user.
                });
              }
            }
            await submitBridgeTransaction(activeQuote);
          }
        }
      }}
      loading={isSubmitting}
      disabled={
        (!needsDestinationAddress &&
          !isMarketClosed &&
          (!isTxSubmittable || isQuoteExpired)) ||
        isSubmitting
      }
    >
      {label?.key ? t(label.key, label.args) : ''}
    </Button>
  ) : (
    <Row
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={1}
    >
      <Text
        variant={TextVariant.bodyMd}
        textAlign={TextAlign.Center}
        color={TextColor.textAlternative}
      >
        {label?.key ? t(label.key, label.args) : ''}
      </Text>
      {secondaryButtonLabel && (
        <ButtonLink
          as="a"
          variant={TextVariant.bodyMd}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => {
            if (wasTxDeclined) {
              dispatch(setWasTxDeclined(false));
            }
            onFetchNewQuotes();
          }}
        >
          {t(secondaryButtonLabel)}
        </ButtonLink>
      )}
    </Row>
  );
};
