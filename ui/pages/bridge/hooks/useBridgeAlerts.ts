import { shallowEqual, useSelector } from 'react-redux';
import { useMemo } from 'react';
import {
  type BridgeAppState,
  getActiveQuotePriceData,
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
import { useAssetSecurityData } from './useAssetSecurityData';

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

  const {
    assetIsMalicious,
    assetIsSuspicious,
    assetMaliciousLocalizedFeatures,
    assetSuspiciousLocalizedFeatures,
  } = useAssetSecurityData(toToken);

  const { txAlert } = useSecurityAlerts(toToken);
  const { openBuyCryptoInPdapp } = useRamps();

  const activeQuotePriceData = useSelector(getActiveQuotePriceData);

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

    if (isStockMarketClosed) {
      categorizeAlert({
        id: 'market-closed',
        isDismissable: false,
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
        isDismissable: false,
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

    if (toToken && (assetIsMalicious || assetIsSuspicious)) {
      categorizeAlert({
        id: 'token-security',
        severity: assetIsMalicious ? 'danger' : 'warning',
        title: t(
          assetIsMalicious
            ? 'bridgeTokenIsMaliciousBanner'
            : 'bridgeTokenIsSuspiciousBanner',
          [toToken.symbol],
        ),
        description: '',
        modalProps: {
          title: t(
            assetIsMalicious
              ? 'bridgeMaliciousTokenTitle'
              : 'bridgeSuspiciousTokenTitle',
          ),
          description: t(
            assetIsMalicious
              ? 'bridgeTokenIsMaliciousModalDescription'
              : 'bridgeTokenIsSuspiciousModalDescription',
            [toToken.symbol],
          ),
          alertModalErrorMessage: assetIsMalicious
            ? t('bridgeTokenIsMaliciousModalDescription', [toToken.symbol])
            : undefined,
          infoList: assetIsMalicious
            ? assetMaliciousLocalizedFeatures
            : assetSuspiciousLocalizedFeatures,
        },
        isConfirmationAlert: assetIsMalicious,
        isDismissable: false,
        openModalOnClick: true,
        bannerAlertProps: {
          severity: assetIsMalicious
            ? BannerAlertSeverity.Danger
            : BannerAlertSeverity.Warning,
        },
      });
    }

    if (unvalidatedQuote && !activeQuotePriceData) {
      categorizeAlert({
        id: 'price-data-unavailable',
        severity: 'danger',
        isDismissable: false,
        title: t('bridgeNoPriceInfoTitle'),
        description: t('bridgePriceDataUnavailableError'),
        isConfirmationAlert: true,
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
        isDismissable: false,
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
        isDismissable: false,
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
        isDismissable: false,
        severity: 'danger',
        title: t('bridgePriceImpactVeryHigh'),
        description: t('bridgePriceImpactVeryHighDescription', [
          formattedPriceImpactPercentage,
        ]),
        isConfirmationAlert: true,
        modalProps: formattedPriceImpactFiat
          ? {
              alertModalErrorMessage: t('bridgePriceImpactFiatAlert', [
                formattedPriceImpactFiat,
              ]),
            }
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
    unvalidatedQuote,
    activeQuotePriceData,
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
    toToken,
    assetIsMalicious,
    assetIsSuspicious,
    assetMaliciousLocalizedFeatures,
    assetSuspiciousLocalizedFeatures,
    txAlert,
    t,
  ]);
};
