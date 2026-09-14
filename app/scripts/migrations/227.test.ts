import { cloneDeep } from 'lodash';
import { migrate, version } from './227';

const VERSION = version;
const PREVIOUS_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

const removedControllerStateKeys = [
  'AccountTracker',
  'CurrencyController',
  'MultichainAssetsController',
  'MultichainAssetsRatesController',
  'MultichainBalancesController',
  'TokenBalancesController',
  'TokenListController',
  'TokenRatesController',
];

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

  it('deletes state for removed legacy asset controllers', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: Object.fromEntries(
        removedControllerStateKeys.map((controllerName) => [
          controllerName,
          { legacy: true },
        ]),
      ),
    };
    oldStorage.data.OtherController = { retained: true };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual({
      OtherController: { retained: true },
    });
    expect(changedControllers).toStrictEqual(
      new Set(removedControllerStateKeys),
    );
  });

  it('retains TokensController state for ASSETS-3346 metadata healing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        TokensController: {
          allTokens: { '0x1': {} },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when removed controller state is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: PREVIOUS_VERSION },
      data: {
        OtherController: { retained: true },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });
});
