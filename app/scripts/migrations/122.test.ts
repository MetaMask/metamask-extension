import { migrate, version } from './122';

const oldVersion = 121;

describe('migration #122', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('set useTransactionSimulations to true in PreferencesController', () => {
    it('sets useTransactionSimulations to true', async () => {
      const oldStorage = {
        PreferencesController: {
          useTransactionSimulations: false,
        },
      };

      const expectedState = {
        PreferencesController: {
          useTransactionSimulations: true,
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: oldStorage,
      });

      expect(transformedState.data).toEqual(expectedState);
    });

    it('should not update useTransactionSimulations value if it was set true in initial state', async () => {
      const oldStorage = {
        PreferencesController: {
          useTransactionSimulations: true,
        },
      };

      const expectedState = {
        PreferencesController: {
          useTransactionSimulations: true,
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: oldStorage,
      });

      expect(transformedState.data).toEqual(expectedState);
    });
  });
});
