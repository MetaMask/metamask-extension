import { getIsTokenManagementFilterEnabled } from './feature-flags';

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

  it('returns false when the flag is missing', () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getIsTokenManagementFilterEnabled(buildState() as any),
    ).toBe(false);
  });
});
