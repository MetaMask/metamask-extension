import { cloneDeep } from 'lodash';
import { migrate, version } from './228';

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

  it('deletes MultichainBalancesController state', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        MultichainBalancesController: {
          balances: {},
        },
        OtherController: { foo: 'bar' },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).not.toHaveProperty(
      'MultichainBalancesController',
    );
    expect(versionedData.data.OtherController).toStrictEqual({ foo: 'bar' });
    expect(changedControllers.has('MultichainBalancesController')).toBe(true);
  });

  it('does nothing if MultichainBalancesController state is missing', async () => {
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
    expect(changedControllers.has('MultichainBalancesController')).toBe(false);
  });
});
