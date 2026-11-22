import { cloneDeep } from 'lodash';
import { migrate, version } from './222';

const VERSION = version;
const PREVIOUS_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${VERSION}`, () => {
  it('bumps the version', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('deletes EnsController state', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        EnsController: {
          ensResolutionsByAddress: { '0x123': 'vitalik.eth' },
        },
        OtherController: { foo: 'bar' },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).not.toHaveProperty('EnsController');
    expect(versionedData.data.OtherController).toStrictEqual({ foo: 'bar' });
    expect(changedControllers.has('EnsController')).toBe(true);
  });

  it('does nothing if EnsController state is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        OtherController: { foo: 'bar' },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual({
      OtherController: { foo: 'bar' },
    });
    expect(changedControllers.has('EnsController')).toBe(false);
  });
});
