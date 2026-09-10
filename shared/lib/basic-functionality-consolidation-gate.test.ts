import type { FeatureFlags } from '@metamask/remote-feature-flag-controller';
import type { Preferences } from '../types/preferences';
import type { BasicFunctionalityPreferenceState } from './basic-functionality-consolidation';
import {
  getIsBasicFunctionalityConsolidationGateEnabled,
  isBasicFunctionalityConsistent,
} from './basic-functionality-consolidation-gate';

const allEnabled: BasicFunctionalityPreferenceState = {
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

const allDisabled: BasicFunctionalityPreferenceState = {
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

function gatePreferences(
  preferenceState: BasicFunctionalityPreferenceState,
  isBasicFunctionalityConsolidatedEnabled: boolean,
): BasicFunctionalityPreferenceState & { preferences: Preferences } {
  return {
    ...preferenceState,
    preferences: {
      isBasicFunctionalityConsolidatedEnabled,
    } as Preferences,
  };
}

describe('isBasicFunctionalityConsistent', () => {
  it('returns true when Basic Functionality and every child are on', () => {
    expect(isBasicFunctionalityConsistent(allEnabled)).toBe(true);
  });

  it('returns true when Basic Functionality and every child are off', () => {
    expect(isBasicFunctionalityConsistent(allDisabled)).toBe(true);
  });

  it('returns false when a child preference is mixed', () => {
    expect(
      isBasicFunctionalityConsistent({
        ...allEnabled,
        useTokenDetection: false,
      }),
    ).toBe(false);
  });
});

describe('getIsBasicFunctionalityConsolidationGateEnabled', () => {
  const mixedPreferences = gatePreferences(
    { ...allEnabled, useTokenDetection: false },
    false,
  );

  it('returns true when the remote flag is off but the wallet was consolidated at onboarding (build flag)', () => {
    expect(
      getIsBasicFunctionalityConsolidationGateEnabled({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
        preferencesState: gatePreferences(allEnabled, true),
      }),
    ).toBe(true);
  });

  it('returns false when the remote flag is off and there is no persisted cohort', () => {
    expect(
      getIsBasicFunctionalityConsolidationGateEnabled({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: false },
        preferencesState: gatePreferences(allEnabled, false),
      }),
    ).toBe(false);
  });

  it('returns false when the remote flag is missing and there is no persisted cohort', () => {
    expect(
      getIsBasicFunctionalityConsolidationGateEnabled({
        remoteFeatureFlags: {},
        preferencesState: gatePreferences(allEnabled, false),
      }),
    ).toBe(false);
  });

  it('returns true when the remote flag is on and the persisted cohort is set', () => {
    expect(
      getIsBasicFunctionalityConsolidationGateEnabled({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        preferencesState: gatePreferences(
          { ...allEnabled, useTokenDetection: false },
          true,
        ),
      }),
    ).toBe(true);
  });

  it('returns true when the remote flag is on and prefs are consistent all-on', () => {
    expect(
      getIsBasicFunctionalityConsolidationGateEnabled({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        preferencesState: gatePreferences(allEnabled, false),
      }),
    ).toBe(true);
  });

  it('returns true when the remote flag is on and prefs are consistent all-off', () => {
    expect(
      getIsBasicFunctionalityConsolidationGateEnabled({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        preferencesState: gatePreferences(allDisabled, false),
      }),
    ).toBe(true);
  });

  it('returns false when the remote flag is on, prefs are mixed, and there is no cohort', () => {
    expect(
      getIsBasicFunctionalityConsolidationGateEnabled({
        remoteFeatureFlags: { extensionBasicFunctionalityToggle: true },
        preferencesState: mixedPreferences,
      }),
    ).toBe(false);
  });

  it('reads a version-gated remote flag', () => {
    const remoteFeatureFlags: FeatureFlags = {
      extensionBasicFunctionalityToggle: {
        enabled: true,
        minimumVersion: '0.0.0',
      },
    };

    expect(
      getIsBasicFunctionalityConsolidationGateEnabled({
        remoteFeatureFlags,
        preferencesState: gatePreferences(allEnabled, false),
      }),
    ).toBe(true);
  });
});
