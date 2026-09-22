import {
  getBasicFunctionalityConsolidationPlan,
  isBasicFunctionalitySocialLoginUser,
  profileAliasesIncludeSocialIdentifier,
  shouldRepairBasicFunctionalitySocialMigrationNotice,
  shouldStartBasicFunctionalityConsolidation,
} from './basic-functionality-consolidation';

describe('getBasicFunctionalityConsolidationPlan', () => {
  const allEnabled = {
    useExternalServices: true,
    useCurrencyRateCheck: true,
    securityAlertsEnabled: true,
    usePhishDetect: true,
    useMultiAccountBalanceChecker: true,
    useSafeChainsListValidation: true,
    useTokenDetection: true,
    useTransactionSimulations: true,
    use4ByteResolution: true,
    openSeaEnabled: true,
    useNftDetection: true,
    useExternalNameSources: true,
    useAddressBarEnsResolution: true,
  };

  const allDisabled = {
    useExternalServices: false,
    useCurrencyRateCheck: false,
    securityAlertsEnabled: false,
    usePhishDetect: false,
    useMultiAccountBalanceChecker: false,
    useSafeChainsListValidation: false,
    useTokenDetection: false,
    useTransactionSimulations: false,
    use4ByteResolution: false,
    openSeaEnabled: false,
    useNftDetection: false,
    useExternalNameSources: false,
    useAddressBarEnsResolution: false,
  };

  it('schedules a toast for mixed settings', () => {
    expect(
      getBasicFunctionalityConsolidationPlan(
        { ...allEnabled, useTokenDetection: false },
        false,
      ),
    ).toStrictEqual({
      landingState: true,
      notification: 'toast',
      isConsistent: false,
    });
  });

  it('schedules no notice for consistent settings', () => {
    expect(
      getBasicFunctionalityConsolidationPlan(allDisabled, false),
    ).toStrictEqual({
      landingState: false,
      notification: null,
      isConsistent: true,
    });
  });

  it('schedules a modal and enables BFT for social-login users', () => {
    expect(
      getBasicFunctionalityConsolidationPlan(allDisabled, true),
    ).toStrictEqual({
      landingState: true,
      notification: 'modal',
      isConsistent: true,
    });
  });
});

describe('isBasicFunctionalitySocialLoginUser', () => {
  it('treats persisted linked-social profiles as social-login wallets', () => {
    expect(
      isBasicFunctionalitySocialLoginUser({
        firstTimeFlowType: 'import',
        hasLinkedSocialLoginProfile: true,
      }),
    ).toBe(true);
  });
});

describe('profileAliasesIncludeSocialIdentifier', () => {
  it('detects linked social identifiers in profile aliases', () => {
    expect(
      profileAliasesIncludeSocialIdentifier([
        {
          identifierIds: [{ id: 'abc', type: 'SRP' }],
        },
        {
          identifierIds: [{ id: 'def', type: 'GOOGLE' }],
        },
      ]),
    ).toBe(true);
  });

  it('returns false when aliases only contain SRP identifiers', () => {
    expect(
      profileAliasesIncludeSocialIdentifier([
        {
          identifierIds: [{ id: 'abc', type: 'SRP' }],
        },
      ]),
    ).toBe(false);
  });
});

describe('shouldRepairBasicFunctionalitySocialMigrationNotice', () => {
  it('schedules repair for consolidated social wallets missing the modal', () => {
    expect(
      shouldRepairBasicFunctionalitySocialMigrationNotice({
        hasConsolidationMarker: true,
        useExternalServices: true,
        isSocialLogin: true,
        migrationNotification: null,
        migrationNotificationDismissed: false,
      }),
    ).toBe(true);
  });

  it('does not repair when the modal is already scheduled', () => {
    expect(
      shouldRepairBasicFunctionalitySocialMigrationNotice({
        hasConsolidationMarker: true,
        useExternalServices: true,
        isSocialLogin: true,
        migrationNotification: 'modal',
        migrationNotificationDismissed: false,
      }),
    ).toBe(false);
  });

  it('does not repair when the notice was dismissed', () => {
    expect(
      shouldRepairBasicFunctionalitySocialMigrationNotice({
        hasConsolidationMarker: true,
        useExternalServices: true,
        isSocialLogin: true,
        migrationNotification: null,
        migrationNotificationDismissed: true,
      }),
    ).toBe(false);
  });
});

describe('shouldStartBasicFunctionalityConsolidation', () => {
  it('starts when the remote flag is on for an unmarked wallet', () => {
    expect(
      shouldStartBasicFunctionalityConsolidation({
        isRemoteFlagEnabled: true,
        isBuildFlagEnabled: false,
        useExternalServices: true,
        hasConsolidationMarker: false,
      }),
    ).toBe(true);
  });

  it('starts for BF-off wallets when the build flag is on', () => {
    expect(
      shouldStartBasicFunctionalityConsolidation({
        isRemoteFlagEnabled: false,
        isBuildFlagEnabled: true,
        useExternalServices: false,
        hasConsolidationMarker: false,
      }),
    ).toBe(true);
  });

  it('does not start for BF-on wallets when only the build flag is on', () => {
    expect(
      shouldStartBasicFunctionalityConsolidation({
        isRemoteFlagEnabled: false,
        isBuildFlagEnabled: true,
        useExternalServices: true,
        hasConsolidationMarker: false,
      }),
    ).toBe(false);
  });

  it('does not start when the wallet is already marked', () => {
    expect(
      shouldStartBasicFunctionalityConsolidation({
        isRemoteFlagEnabled: true,
        isBuildFlagEnabled: true,
        useExternalServices: false,
        hasConsolidationMarker: true,
      }),
    ).toBe(false);
  });
});
