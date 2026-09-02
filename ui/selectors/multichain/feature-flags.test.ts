import { EXTENSION_TRUST_AND_SECURITY_TDP_FLAG } from '../../../shared/lib/assets/security-trust-feature-flags';
import {
  BFT_CHILD_PREFERENCES,
  getIsBasicFunctionalityConsolidationEnabled,
  getIsBasicFunctionalityToggleEnabled,
  getIsNetworkManagementEnabled,
  getIsSecurityTrustTdpEnabled,
  getIsTokenManagementFilterEnabled,
} from './feature-flags';

const buildState = (
  remoteFeatureFlags: Record<string, unknown> = {},
  isBasicFunctionalityConsolidatedEnabled = false,
): {
  metamask: {
    remoteFeatureFlags: Record<string, unknown>;
    preferences: {
      isBasicFunctionalityConsolidatedEnabled: boolean;
    };
  };
} => ({
  metamask: {
    remoteFeatureFlags,
    preferences: {
      isBasicFunctionalityConsolidatedEnabled,
    },
  },
});

const buildBftState = (
  useExternalServices: boolean,
  remoteFlag = true,
  childOverrides: Partial<
    Record<(typeof BFT_CHILD_PREFERENCES)[number], boolean>
  > = {},
) => ({
  ...buildState({ extensionBasicFunctionalityToggle: remoteFlag }, false),
  metamask: {
    ...buildState().metamask,
    remoteFeatureFlags: {
      extensionBasicFunctionalityToggle: remoteFlag,
    },
    useExternalServices,
    ...Object.fromEntries(
      BFT_CHILD_PREFERENCES.map((preference) => [
        preference,
        childOverrides[preference] ?? useExternalServices,
      ]),
    ),
  },
});

describe('getIsTokenManagementFilterEnabled', () => {
  it('returns true when the flag is true', () => {
    expect(
      getIsTokenManagementFilterEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionUxTokenManagementFilter: true }) as any,
      ),
    ).toBe(true);
  });

  it('returns false when the flag is false', () => {
    expect(
      getIsTokenManagementFilterEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionUxTokenManagementFilter: false }) as any,
      ),
    ).toBe(false);
  });

  it('returns true for a version-gated flag whose minimumVersion is satisfied', () => {
    expect(
      getIsTokenManagementFilterEnabled(
        buildState({
          extensionUxTokenManagementFilter: {
            enabled: true,
            minimumVersion: '0.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(true);
  });

  it('returns false for a version-gated flag whose minimumVersion is in the future', () => {
    expect(
      getIsTokenManagementFilterEnabled(
        buildState({
          extensionUxTokenManagementFilter: {
            enabled: true,
            minimumVersion: '999.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false when the version-gated flag is explicitly disabled', () => {
    expect(
      getIsTokenManagementFilterEnabled(
        buildState({
          extensionUxTokenManagementFilter: {
            enabled: false,
            minimumVersion: '0.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false for malformed objects missing the minimumVersion field', () => {
    expect(
      getIsTokenManagementFilterEnabled(
        buildState({
          extensionUxTokenManagementFilter: {
            enabled: true,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false when the flag is missing', () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getIsTokenManagementFilterEnabled(buildState() as any),
    ).toBe(false);
  });
});

describe('getIsNetworkManagementEnabled', () => {
  it('returns true when the flag is true', () => {
    expect(
      getIsNetworkManagementEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionUxNetworkManagement: true }) as any,
      ),
    ).toBe(true);
  });

  it('returns false when the flag is false', () => {
    expect(
      getIsNetworkManagementEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionUxNetworkManagement: false }) as any,
      ),
    ).toBe(false);
  });

  it('returns true for a version-gated flag whose minimumVersion is satisfied', () => {
    expect(
      getIsNetworkManagementEnabled(
        buildState({
          extensionUxNetworkManagement: {
            enabled: true,
            minimumVersion: '0.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(true);
  });

  it('returns false for a version-gated flag whose minimumVersion is in the future', () => {
    expect(
      getIsNetworkManagementEnabled(
        buildState({
          extensionUxNetworkManagement: {
            enabled: true,
            minimumVersion: '999.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false when the version-gated flag is explicitly disabled', () => {
    expect(
      getIsNetworkManagementEnabled(
        buildState({
          extensionUxNetworkManagement: {
            enabled: false,
            minimumVersion: '0.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false for malformed objects missing the minimumVersion field', () => {
    expect(
      getIsNetworkManagementEnabled(
        buildState({
          extensionUxNetworkManagement: {
            enabled: true,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false when the flag is missing', () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getIsNetworkManagementEnabled(buildState() as any),
    ).toBe(false);
  });
});

describe('getIsBasicFunctionalityToggleEnabled', () => {
  it('returns true when the flag is true', () => {
    expect(
      getIsBasicFunctionalityToggleEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionBasicFunctionalityToggle: true }) as any,
      ),
    ).toBe(true);
  });

  it('returns false when the flag is false', () => {
    expect(
      getIsBasicFunctionalityToggleEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionBasicFunctionalityToggle: false }) as any,
      ),
    ).toBe(false);
  });

  it('returns true for a version-gated flag whose minimumVersion is satisfied', () => {
    expect(
      getIsBasicFunctionalityToggleEnabled(
        buildState({
          extensionBasicFunctionalityToggle: {
            enabled: true,
            minimumVersion: '0.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(true);
  });

  it('returns false for a version-gated flag whose minimumVersion is in the future', () => {
    expect(
      getIsBasicFunctionalityToggleEnabled(
        buildState({
          extensionBasicFunctionalityToggle: {
            enabled: true,
            minimumVersion: '999.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false when the flag is missing', () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getIsBasicFunctionalityToggleEnabled(buildState() as any),
    ).toBe(false);
  });
});

describe('getIsBasicFunctionalityConsolidationEnabled', () => {
  it('returns true for an all-on legacy BFT user when the remote flag is enabled', () => {
    expect(
      getIsBasicFunctionalityConsolidationEnabled(
        buildBftState(true) as unknown as Parameters<
          typeof getIsBasicFunctionalityConsolidationEnabled
        >[0],
      ),
    ).toBe(true);
  });

  it('returns true for an all-off legacy BFT user when the remote flag is enabled', () => {
    expect(
      getIsBasicFunctionalityConsolidationEnabled(
        buildBftState(false) as unknown as Parameters<
          typeof getIsBasicFunctionalityConsolidationEnabled
        >[0],
      ),
    ).toBe(true);
  });

  it('returns true for a mixed legacy BFT user when the remote flag is enabled', () => {
    expect(
      getIsBasicFunctionalityConsolidationEnabled(
        buildBftState(true, true, {
          useTokenDetection: false,
        }) as unknown as Parameters<
          typeof getIsBasicFunctionalityConsolidationEnabled
        >[0],
      ),
    ).toBe(true);
  });

  it('returns false for a consistent legacy BFT user when the remote flag is disabled', () => {
    expect(
      getIsBasicFunctionalityConsolidationEnabled(
        buildBftState(true, false) as unknown as Parameters<
          typeof getIsBasicFunctionalityConsolidationEnabled
        >[0],
      ),
    ).toBe(false);
  });

  it('returns true when the remote flag and persisted cohort marker are both true', () => {
    expect(
      getIsBasicFunctionalityConsolidationEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionBasicFunctionalityToggle: true }, true) as any,
      ),
    ).toBe(true);
  });

  it('returns true when the remote flag is true but the persisted cohort marker is false', () => {
    expect(
      getIsBasicFunctionalityConsolidationEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionBasicFunctionalityToggle: true }, false) as any,
      ),
    ).toBe(true);
  });

  it('returns false when the persisted cohort marker is true but the remote flag is false', () => {
    expect(
      getIsBasicFunctionalityConsolidationEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildState({ extensionBasicFunctionalityToggle: false }, true) as any,
      ),
    ).toBe(false);
  });
});

describe('getIsSecurityTrustTdpEnabled', () => {
  it('returns true for a version-gated flag whose minimumVersion is satisfied', () => {
    expect(
      getIsSecurityTrustTdpEnabled(
        buildState({
          [EXTENSION_TRUST_AND_SECURITY_TDP_FLAG]: {
            enabled: true,
            minimumVersion: '0.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(true);
  });

  it('returns false for a version-gated flag whose minimumVersion is in the future', () => {
    expect(
      getIsSecurityTrustTdpEnabled(
        buildState({
          [EXTENSION_TRUST_AND_SECURITY_TDP_FLAG]: {
            enabled: true,
            minimumVersion: '999.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false when the version-gated flag is explicitly disabled', () => {
    expect(
      getIsSecurityTrustTdpEnabled(
        buildState({
          [EXTENSION_TRUST_AND_SECURITY_TDP_FLAG]: {
            enabled: false,
            minimumVersion: '0.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(false);
  });

  it('returns false when the flag is missing', () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getIsSecurityTrustTdpEnabled(buildState() as any),
    ).toBe(false);
  });
});
