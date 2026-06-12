import { migrate, version } from './191';

const VERSION = version;
const oldVersion = VERSION - 1;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if TokenListController state does not exist', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual({});
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if TokenListController state is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: 'not an object',
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.TokenListController).toBe('not an object');
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if preventPollingOnNetworkRestart does not exist', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          someOtherProperty: 'value',
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.TokenListController).toStrictEqual({
      someOtherProperty: 'value',
    });
    expect(changedControllers.size).toBe(0);
  });

  it('removes preventPollingOnNetworkRestart from TokenListController state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          preventPollingOnNetworkRestart: false,
          someOtherProperty: 'value',
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.TokenListController).toStrictEqual({
      someOtherProperty: 'value',
    });
    expect(changedControllers.has('TokenListController')).toBe(true);
  });

  it('removes preventPollingOnNetworkRestart when it is true', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          preventPollingOnNetworkRestart: true,
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.TokenListController).toStrictEqual({});
    expect(changedControllers.has('TokenListController')).toBe(true);
  });

  it('preserves other TokenListController state properties', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenListController: {
          preventPollingOnNetworkRestart: false,
          tokensChainsCache: {},
          anotherProperty: 123,
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.TokenListController).toStrictEqual({
      tokensChainsCache: {},
      anotherProperty: 123,
    });
    expect(changedControllers.has('TokenListController')).toBe(true);
  });
});
