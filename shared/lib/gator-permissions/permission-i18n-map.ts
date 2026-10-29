import type {
  I18nFunction,
  TranslationKeys,
} from '@metamask/7715-permission-types';

/**
 * Builds a lookup map for every {@link TranslationKeys} entry using the given
 * i18n function. Ensures at compile time that all keys the package can emit
 * (e.g. `SchemaElement.labelKey`) have a corresponding translation.
 * @param t
 */
export function buildPermissionI18nMap(
  t: I18nFunction,
): Record<TranslationKeys, string> {
  return {
    account: t('account'),
    amount: t('amount'),
    confirmFieldAllowance: t('confirmFieldAllowance'),
    confirmFieldAvailablePerDay: t('confirmFieldAvailablePerDay'),
    confirmFieldFrequency: t('confirmFieldFrequency'),
    confirmFieldTotalExposure: t('confirmFieldTotalExposure'),
    gatorPermissionsExpirationDate: t('gatorPermissionsExpirationDate'),
    gatorPermissionsInitialAllowance: t('gatorPermissionsInitialAllowance'),
    gatorPermissionsJustification: t('gatorPermissionsJustification'),
    gatorPermissionsMaxAllowance: t('gatorPermissionsMaxAllowance'),
    gatorPermissionsRevocationMethods: t('gatorPermissionsRevocationMethods'),
    gatorPermissionsStartDate: t('gatorPermissionsStartDate'),
    gatorPermissionsStreamingAmountLabel: t(
      'gatorPermissionsStreamingAmountLabel',
    ),
    gatorPermissionsStreamRate: t('gatorPermissionsStreamRate'),
    gatorPermissionTokenPeriodicFrequencyLabel: t(
      'gatorPermissionTokenPeriodicFrequencyLabel',
    ),
    gatorPermissionTokenStreamFrequencyLabel: t(
      'gatorPermissionTokenStreamFrequencyLabel',
    ),
    payee: t('payee'),
    recipient: t('recipient'),
    redeemer: t('redeemer'),
    redeemers: t('redeemers'),
    requestFrom: t('requestFrom'),
    revokeTokenApprovals: t('revokeTokenApprovals'),
    unknownPermissionType: t('unknownPermissionType'),
  };
}
