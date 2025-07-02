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

  [BlockaidReason.blurFarming]: 'blockaidDescriptionBlurFarming',

  [BlockaidReason.errored]: 'blockaidDescriptionErrored', // TODO: change in i8n

  [BlockaidReason.seaportFarming]: 'blockaidDescriptionSeaportFarming',

  [BlockaidReason.maliciousDomain]: 'blockaidDescriptionMaliciousDomain',

  [BlockaidReason.rawSignatureFarming]: 'blockaidDescriptionMightLoseAssets',
  [BlockaidReason.tradeOrderFarming]: 'blockaidDescriptionMightLoseAssets',

  [BlockaidReason.rawNativeTokenTransfer]: 'blockaidDescriptionTransferFarming',
  [BlockaidReason.transferFarming]: 'blockaidDescriptionTransferFarming',
  [BlockaidReason.transferFromFarming]: 'blockaidDescriptionTransferFarming',

  [BlockaidReason.other]: 'blockaidDescriptionMightLoseAssets',
});

/** Reason to title translation key mapping. */
export const REASON_TO_TITLE_TKEY = Object.freeze({
  [BlockaidReason.errored]: 'blockaidTitleMayNotBeSafe',
  [BlockaidReason.rawSignatureFarming]: 'blockaidTitleSuspicious',
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
 * Normalizes a security alert response into an Alert object.
 *
 * @param securityAlertResponse - The security alert response to normalize.
 * @param t - The translation function.
 * @param reportUrl - URL to report.
 * @returns The normalized Alert object.
 */
export function normalizeProviderAlert(
  securityAlertResponse: SecurityAlertResponse,
  t: ReturnType<typeof useI18nContext>,
  reportUrl?: string,
): Alert {
  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    key: securityAlertResponse.securityAlertId || '',
    reason: t(
      REASON_TO_TITLE_TKEY[
        securityAlertResponse.reason as keyof typeof REASON_TO_TITLE_TKEY
      ] || 'blockaidTitleDeceptive',
    ),
    severity: getProviderAlertSeverity(
      securityAlertResponse.result_type as BlockaidResultType,
    ),
    alertDetails: securityAlertResponse.features,
    message: t(
      REASON_TO_DESCRIPTION_TKEY[
        securityAlertResponse.reason as keyof typeof REASON_TO_DESCRIPTION_TKEY
      ] || REASON_TO_DESCRIPTION_TKEY.other,
    ),
    provider: SecurityProvider.Blockaid, // TODO: Remove this once we support more providers and implement a way to determine it.
    reportUrl,
  };
}
