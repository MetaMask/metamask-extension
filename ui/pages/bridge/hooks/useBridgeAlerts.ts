import { shallowEqual, useSelector } from 'react-redux';
import { useMemo } from 'react';
import {
  type BridgeAppState,
  getBridgeUnavailableQuoteReason,
  getFormattedPriceImpactFiat,
  getFormattedPriceImpactPercentage,
  getToToken,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BannerAlertSeverity } from '../../../components/component-library';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainNativeCurrency } from '../../../selectors/multichain';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { isQuoteExpiredOrInvalid } from '../utils/quote';
import { type BridgeAlert } from '../prepare/types';
import { useSecurityAlerts } from './useSecurityAlerts';

/**
 * Merges tx, token, and validation alert data used for displaying {@link BannerAlert}
 * and {@link BridgeAlertModal} components
 */
export const useBridgeAlerts = () => {
  const t = useI18nContext();

  const formattedPriceImpactPercentage = useSelector(
    getFormattedPriceImpactPercentage,
  );
  const formattedPriceImpactFiat = useSelector(getFormattedPriceImpactFiat);

  const {
    isNoQuotesAvailable,
    isInsufficientGasForQuote,
    isInsufficientBalance,
    isStockMarketClosed,
    isQuoteExpired,
    isPriceImpactWarning,
    isPriceImpactError,
  } = useSelector(
    (state: BridgeAppState) => getValidationErrors(state, Date.now()),
    shallowEqual,
  );
  const bridgeUnavailableQuotesReason = useSelector(
    getBridgeUnavailableQuoteReason,
  );

  const toToken = useSelector(getToToken);
  const ticker = useMultichainSelector(getMultichainNativeCurrency);

  const { tokenAlerts, txAlert } = useSecurityAlerts();
  const { openBuyCryptoInPdapp } = useRamps();

  const { isLoading, activeQuote: unvalidatedQuote } =
    useSelector(getBridgeQuotes);
  const activeQuote = isQuoteExpiredOrInvalid({
    activeQuote: unvalidatedQuote ?? null,
    toToken,
    isQuoteExpired,
  })
    ? undefined
    : unvalidatedQuote;
  const isSwap =
    activeQuote?.quote.srcChainId === activeQuote?.quote.destChainId;

  return useMemo(() => {
    const alertsById: Partial<Record<BridgeAlert['id'], BridgeAlert>> = {};
    const confirmationAlerts: BridgeAlert[] = [];
    const bannerAlerts: BridgeAlert[] = [];

    // Append alert to the appropriate alert lists
    const categorizeAlert = (alert: BridgeAlert) => {
      alertsById[alert.id] = alert;

      if (alert.isConfirmationAlert) {
        confirmationAlerts.push(alert);
      }

      if (alert.bannerAlertProps) {
        bannerAlerts.push(alert);
      }
    };

    tokenAlerts.forEach((alert) => {
      categorizeAlert({
        ...alert,
        isDismissable: true,
        isConfirmationAlert: true,
        bannerAlertProps: {
          severity:
            alert.severity === 'danger'
              ? BannerAlertSeverity.Danger
              : BannerAlertSeverity.Warning,
          'data-testid': 'bridge-token-warning-alert',
        },
      });
    });

    if (isStockMarketClosed) {
      categorizeAlert({
        id: 'market-closed',
        severity: 'danger',
        title: t('bridgeMarketClosedTitle'),
        description: t('bridgeMarketClosedDescription'),
        isConfirmationAlert: false,
        bannerAlertProps: {
          severity: BannerAlertSeverity.Danger,
        },
      });
    }

    if (isNoQuotesAvailable && !isStockMarketClosed && !isQuoteExpired) {
      categorizeAlert({
        id: 'no-quotes',
        severity: 'danger',
        description: t(bridgeUnavailableQuotesReason),
        isConfirmationAlert: false,
        bannerAlertProps: {
          severity: BannerAlertSeverity.Danger,
        },
      });
    }

    if (txAlert && activeQuote) {
      categorizeAlert({
        ...txAlert,
        isDismissable: false,
        isConfirmationAlert: false,
        bannerAlertProps: {
          severity: BannerAlertSeverity.Danger,
        },
      });
    }

    if (
      !isLoading &&
      activeQuote &&
      !isInsufficientBalance &&
      isInsufficientGasForQuote
    ) {
      categorizeAlert({
        id: 'insufficient-gas',
        severity: 'danger',
        title: t('bridgeValidationInsufficientGasTitle', [ticker]),
        description: t(
          isSwap
            ? 'swapValidationInsufficientGasMessage'
            : 'bridgeValidationInsufficientGasMessage',
          [ticker],
        ),
        isConfirmationAlert: false,
        bannerAlertProps: {
          severity: BannerAlertSeverity.Danger,
          actionButtonLabel: t('buyMoreAsset', [ticker]),
          actionButtonOnClick: () => openBuyCryptoInPdapp(),
        },
      });
    }

    if (isPriceImpactWarning) {
      categorizeAlert({
        id: 'price-impact',
        severity: 'warning',
        title: t('bridgePriceImpactHigh'),
        description: t('bridgePriceImpactHighDescription', [
          formattedPriceImpactPercentage,
        ]),
        isConfirmationAlert: false,
      });
    }

    if (isPriceImpactError) {
      categorizeAlert({
        id: 'price-impact',
        severity: 'danger',
        title: t('bridgePriceImpactVeryHigh'),
        description: t('bridgePriceImpactVeryHighDescription', [
          formattedPriceImpactPercentage,
        ]),
        isConfirmationAlert: true,
        alertModalErrorMessage: formattedPriceImpactFiat
          ? t('bridgePriceImpactFiatAlert', [formattedPriceImpactFiat])
          : undefined,
      });
    }

    return {
      alertsById,
      /** A list of alerts to be displayed as BannerAlerts */
      bannerAlerts,
      /** A sorted list of error alerts to be displayed in the confirmation modal */
      confirmationAlerts,
    };
  }, [
    activeQuote,
    bridgeUnavailableQuotesReason,
    formattedPriceImpactPercentage,
    formattedPriceImpactFiat,
    isInsufficientBalance,
    isInsufficientGasForQuote,
    isLoading,
    isNoQuotesAvailable,
    isQuoteExpired,
    isPriceImpactError,
    isPriceImpactWarning,
    isStockMarketClosed,
    isSwap,
    openBuyCryptoInPdapp,
    ticker,
    tokenAlerts,
    txAlert,
    t,
  ]);
};
