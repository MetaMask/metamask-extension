import {
  getIsNetworkManagementEnabled,
  getIsTokenManagementFilterEnabled,
} from './feature-flags';

const buildState = (
  remoteFeatureFlags: Record<string, unknown> = {},
): { metamask: { remoteFeatureFlags: Record<string, unknown> } } => ({
  metamask: {
    remoteFeatureFlags,
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
