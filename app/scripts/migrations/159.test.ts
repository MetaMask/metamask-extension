import { migrate } from './159';

const expectedVersion = 159;
const previousVersion = 158;

describe(`migration #${expectedVersion}`, () => {
  it('does nothing if state has not PreferencesController property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {},
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };
    const newVersionedData = await migrate(oldVersionedData);
    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state has not state.PreferencesController is not an object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        PreferencesController: 'not-an-object',
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);
    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.PreferencesController has no shouldShowAggregatedBalancePopover property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        PreferencesController: {},
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);
    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('deletes state.PreferencesController.shouldShowAggregatedBalancePopover property if it is found', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        PreferencesController: {
          shouldShowAggregatedBalancePopover: true,
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        PreferencesController: {},
      },
    };

    const newVersionedData = await migrate(oldVersionedData);
    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });
});
