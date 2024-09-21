import { migrate } from './107';

describe('migration #107', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 106 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 107 });
  });

  it('does nothing if no CachedBalancesController state', async () => {
    const oldData = {
      some: 'data',
    };

    const oldStorage = {
      meta: { version: 106 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('migrates balances correctly and removes CachedBalancesController', async () => {
    const cachedBalancesMock = {
      '0x1': {
        '0xAccount1': '0x100',
        '0xAccount2': '0x200',
      },
      '0x2': {
        '0xAccount3': '0x300',
      },
    };

    const oldData = {
      CachedBalancesController: {
        cachedBalances: cachedBalancesMock,
      },
      AccountTracker: {},
    };

    const oldStorage = {
      meta: { version: 106 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.CachedBalancesController).toBeUndefined();
    expect(newStorage.data.AccountTracker).toStrictEqual({
      accountsByChainId: {
        '0x1': {
          '0xAccount1': { address: '0xAccount1', balance: '0x100' },
          '0xAccount2': { address: '0xAccount2', balance: '0x200' },
        },
        '0x2': {
          '0xAccount3': { address: '0xAccount3', balance: '0x300' },
        },
      },
    });
  });

  it('preserves existing AccountTracker data when not overlapping with cachedBalances data', async () => {
    const cachedBalancesMock = {
      '0x1': {
        '0xAccount1': '0x100',
      },
    };

    const existingAccountTrackerData = {
      accountsByChainId: {
        '0x2': {
          '0xAccount4': { address: '0xAccount4', balance: '0x400' },
        },
      },
    };

    const oldData = {
      CachedBalancesController: {
        cachedBalances: cachedBalancesMock,
      },
      AccountTracker: existingAccountTrackerData,
    };

    const oldStorage = {
      meta: { version: 106 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.AccountTracker).toStrictEqual({
      accountsByChainId: {
        '0x1': {
          '0xAccount1': { address: '0xAccount1', balance: '0x100' },
        },
        ...existingAccountTrackerData.accountsByChainId,
      },
    });
  });

  it('preserves existing AccountTracker data when it already has a chainId/accountAddress combo in the cachedBalances data', async () => {
    const cachedBalancesMock = {
      '0x1': {
        '0xAccount1': '0x100',
      },
      '0x4': {
        '0xAccount3': '0x400',
      },
    };

    const existingAccountTrackerData = {
      accountsByChainId: {
        '0x1': {
          '0xAccount1': { address: '0xAccount1', balance: '0x400' },
        },
        '0x2': {
          '0xAccount4': { address: '0xAccount4', balance: '0x400' },
        },
      },
    };

    const oldData = {
      CachedBalancesController: {
        cachedBalances: cachedBalancesMock,
      },
      AccountTracker: existingAccountTrackerData,
    };

    const oldStorage = {
      meta: { version: 106 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.AccountTracker).toStrictEqual({
      accountsByChainId: {
        '0x1': {
          '0xAccount1': { address: '0xAccount1', balance: '0x400' },
        },
        '0x2': {
          '0xAccount4': { address: '0xAccount4', balance: '0x400' },
        },
        '0x4': {
          '0xAccount3': { address: '0xAccount3', balance: '0x400' },
        },
      },
    });
  });
});
