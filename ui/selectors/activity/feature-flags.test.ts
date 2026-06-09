import { getIsActivityListRedesignEnabled } from './feature-flags';

const buildState = (
  remoteFeatureFlags: Record<string, unknown> = {},
): { metamask: { remoteFeatureFlags: Record<string, unknown> } } => ({
  metamask: {
    remoteFeatureFlags,
  },
});

describe('getIsActivityListRedesignEnabled', () => {
  it('returns true when the version-gated flag is enabled', () => {
    expect(
      getIsActivityListRedesignEnabled(
        buildState({
          extensionUxActivityListRedesign: {
            enabled: true,
            minimumVersion: '0.0.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ),
    ).toBe(true);
  });

  it('returns false when the flag is disabled', () => {
    expect(
      getIsActivityListRedesignEnabled(
        buildState({
          extensionUxActivityListRedesign: {
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
      getIsActivityListRedesignEnabled(buildState() as any),
    ).toBe(false);
  });
});
