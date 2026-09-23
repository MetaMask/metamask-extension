import { cloneDeep } from 'lodash';
import { migrate, version } from './229';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('adds hasLinkedSocialLoginProfile when missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          preferences: {
            isBasicFunctionalityConsolidatedEnabled: true,
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(
      (
        versionedData.data.PreferencesController as {
          preferences: { hasLinkedSocialLoginProfile: boolean };
        }
      ).preferences.hasLinkedSocialLoginProfile,
    ).toBe(false);
  });
});
