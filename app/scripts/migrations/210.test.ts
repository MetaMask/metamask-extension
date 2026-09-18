import { cloneDeep } from 'lodash';
import { migrate, version } from './210';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes the legacy `delegations` state from DelegationController', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        DelegationController: {
          delegations: {
            '0xabc': {
              tags: ['tag1'],
              chainId: '0x1',
              delegation: {
                delegate: '0x1',
                delegator: '0x2',
                authority: '0x0',
                caveats: [],
                salt: '0x0',
                signature: '0xdeadbeef',
              },
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.DelegationController).toStrictEqual({});
    expect(changedControllers).toStrictEqual(new Set(['DelegationController']));
  });

  it('removes the `delegations` state even when it is empty', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        DelegationController: {
          delegations: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.DelegationController).toStrictEqual({});
    expect(changedControllers).toStrictEqual(new Set(['DelegationController']));
  });

  it('preserves other properties on DelegationController', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        DelegationController: {
          delegations: { '0xabc': { foo: 'bar' } },
          someOtherKey: 'left-alone',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.DelegationController).toStrictEqual({
      someOtherKey: 'left-alone',
    });
    expect(changedControllers).toStrictEqual(new Set(['DelegationController']));
  });

  it('does nothing when DelegationController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        SomeOtherController: {},
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when DelegationController is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        DelegationController: 'invalid',
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when DelegationController has no `delegations` property', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        DelegationController: {
          someOtherKey: 'left-alone',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });
});
