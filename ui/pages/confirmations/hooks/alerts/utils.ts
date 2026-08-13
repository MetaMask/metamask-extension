import {
  BlockaidReason,
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  Alert,
  AlertSeverity,
} from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SecurityAlertResponse } from '../../types/confirm';

/** Reason to description translation key mapping. Grouped by translations. */
export const REASON_TO_DESCRIPTION_TKEY = Object.freeze({
  [BlockaidReason.approvalFarming]: 'blockaidDescriptionApproveFarming',
  [BlockaidReason.permitFarming]: 'blockaidDescriptionApproveFarming',
  [BlockaidReason.setApprovalForAll]: 'blockaidDescriptionApproveFarming',

  [BlockaidReason.blurFarming]: 'blockaidDescriptionMarketplaceFarming',
  [BlockaidReason.seaportFarming]: 'blockaidDescriptionMarketplaceFarming',

  [BlockaidReason.errored]: 'blockaidDescriptionErrored',

  [BlockaidReason.maliciousDomain]: 'blockaidDescriptionMaliciousDomain',

  [BlockaidReason.rawSignatureFarming]: 'blockaidDescriptionHighRiskSignature',
  [BlockaidReason.tradeOrderFarming]: 'blockaidDescriptionHighRiskSignature',

  [BlockaidReason.rawNativeTokenTransfer]: 'blockaidDescriptionTransferFarming',
  [BlockaidReason.transferFarming]: 'blockaidDescriptionTransferFarming',
  [BlockaidReason.transferFromFarming]: 'blockaidDescriptionTransferFarming',

  [BlockaidReason.other]: 'blockaidDescriptionRiskSignals',
});

/**
 * Amount-bearing variants of banner descriptions, used when a formatted fiat
 * total of outgoing assets is available. The amount is injected as $1.
 */
export const REASON_TO_DESCRIPTION_WITH_AMOUNT_TKEY = Object.freeze({
  [BlockaidReason.maliciousDomain]:
    'blockaidDescriptionMaliciousDomainWithAmount',

  [BlockaidReason.rawNativeTokenTransfer]:
    'blockaidDescriptionTransferFarmingWithAmount',
  [BlockaidReason.transferFarming]:
    'blockaidDescriptionTransferFarmingWithAmount',
  [BlockaidReason.transferFromFarming]:
    'blockaidDescriptionTransferFarmingWithAmount',
});

/**
 * Marketplace display names injected into
 * blockaidDescriptionMarketplaceFarming as $1. Product names are not
 * localized.
 */
export const REASON_TO_MARKETPLACE_NAME = Object.freeze({
  [BlockaidReason.blurFarming]: 'Blur',
  [BlockaidReason.seaportFarming]: 'OpenSea',
});

/** Reason to title translation key mapping. */
export const REASON_TO_TITLE_TKEY = Object.freeze({
  [BlockaidReason.approvalFarming]: 'blockaidTitleHighRiskApproval',
  [BlockaidReason.permitFarming]: 'blockaidTitleHighRiskApproval',
  [BlockaidReason.setApprovalForAll]: 'blockaidTitleHighRiskApproval',

  [BlockaidReason.blurFarming]: 'blockaidTitleHighRiskApproval',
  [BlockaidReason.seaportFarming]: 'blockaidTitleHighRiskApproval',

  [BlockaidReason.errored]: 'blockaidTitleMayNotBeSafe',

  [BlockaidReason.maliciousDomain]: 'blockaidTitleSiteFlaggedUnsafe',

  [BlockaidReason.rawSignatureFarming]: 'blockaidTitleHighRiskSignature',
  [BlockaidReason.tradeOrderFarming]: 'blockaidTitleHighRiskSignature',

  [BlockaidReason.rawNativeTokenTransfer]: 'blockaidTitleHighRiskTransfer',
  [BlockaidReason.transferFarming]: 'blockaidTitleHighRiskTransfer',
  [BlockaidReason.transferFromFarming]: 'blockaidTitleHighRiskTransfer',

  [BlockaidReason.other]: 'blockaidTitleRiskSignalsDetected',
});

/**
 * Reason to request-type noun translation key mapping. The noun is composed
 * into the confirm-anyway modal message ("...high-risk signals in this
 * approval").
 */
export const REASON_TO_REQUEST_TYPE_TKEY = Object.freeze({
  [BlockaidReason.approvalFarming]: 'blockaidRequestTypeApproval',
  [BlockaidReason.permitFarming]: 'blockaidRequestTypeApproval',
  [BlockaidReason.setApprovalForAll]: 'blockaidRequestTypeApproval',
  [BlockaidReason.blurFarming]: 'blockaidRequestTypeApproval',
  [BlockaidReason.seaportFarming]: 'blockaidRequestTypeApproval',

  [BlockaidReason.rawSignatureFarming]: 'blockaidRequestTypeSignature',
  [BlockaidReason.tradeOrderFarming]: 'blockaidRequestTypeSignature',

  [BlockaidReason.rawNativeTokenTransfer]: 'blockaidRequestTypeTransfer',
  [BlockaidReason.transferFarming]: 'blockaidRequestTypeTransfer',
  [BlockaidReason.transferFromFarming]: 'blockaidRequestTypeTransfer',

  [BlockaidReason.maliciousDomain]: 'blockaidRequestTypeRequest',
  [BlockaidReason.other]: 'blockaidRequestTypeRequest',
});

/**
 * Returns the corresponding AlertSeverity based on the provided BlockaidResultType.
 *
 * @param severity - The BlockaidResultType to determine the AlertSeverity for.
 * @returns The AlertSeverity corresponding to the provided BlockaidResultType.
 */
export function getProviderAlertSeverity(
  severity: BlockaidResultType,
): AlertSeverity {
  switch (severity) {
    case BlockaidResultType.Malicious:
      return Severity.Danger;
    case BlockaidResultType.Warning:
      return Severity.Warning;
    default:
      return Severity.Info;
  }
}

/**
 * Returns the localized banner description for a security alert reason.
 *
 * @param reason - The Blockaid reason.
 * @param t - The translation function.
 * @param sendingFiatTotal - Formatted fiat total of outgoing assets, or null
 * when unavailable. When present, amount-bearing copy variants are used.
 * @returns The localized description.
 */
export function getProviderAlertMessage(
  reason: BlockaidReason,
  t: ReturnType<typeof useI18nContext>,
  sendingFiatTotal?: string | null,
): string {
  const withAmountKey =
    REASON_TO_DESCRIPTION_WITH_AMOUNT_TKEY[
      reason as keyof typeof REASON_TO_DESCRIPTION_WITH_AMOUNT_TKEY
    ];

  if (withAmountKey && sendingFiatTotal) {
    return t(withAmountKey, [sendingFiatTotal]);
  }

  const marketplaceName =
    REASON_TO_MARKETPLACE_NAME[
      reason as keyof typeof REASON_TO_MARKETPLACE_NAME
    ];

  if (marketplaceName) {
    return t('blockaidDescriptionMarketplaceFarming', [marketplaceName]);
  }

  return t(
    REASON_TO_DESCRIPTION_TKEY[
      reason as keyof typeof REASON_TO_DESCRIPTION_TKEY
    ] || REASON_TO_DESCRIPTION_TKEY.other,
  );
}

/**
 * Normalizes a security alert response into an Alert object.
 *
 * @param securityAlertResponse - The security alert response to normalize.
 * @param t - The translation function.
 * @param reportUrl - URL to report.
 * @param sendingFiatTotal - Formatted fiat total of outgoing assets, or null
 * when unavailable.
 * @returns The normalized Alert object.
 */
export function normalizeProviderAlert(
  securityAlertResponse: SecurityAlertResponse,
  t: ReturnType<typeof useI18nContext>,
  reportUrl?: string,
  sendingFiatTotal?: string | null,
): Alert {
  return {
    key: securityAlertResponse.securityAlertId || '',
    reason: t(
      REASON_TO_TITLE_TKEY[
        securityAlertResponse.reason as keyof typeof REASON_TO_TITLE_TKEY
      ] || 'blockaidTitleRiskSignalsDetected',
    ),
    severity: getProviderAlertSeverity(
      securityAlertResponse.result_type as BlockaidResultType,
    ),
    alertDetails: securityAlertResponse.features,
    message: getProviderAlertMessage(
      securityAlertResponse.reason as BlockaidReason,
      t,
      sendingFiatTotal,
    ),
    provider: SecurityProvider.Blockaid, // TODO: Remove this once we support more providers and implement a way to determine it.
    reportUrl,
  };
}
