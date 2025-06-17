import { migrate, version } from './168';

const oldVersion = 167;

describe('migration #168', () => {
  beforeEach(() => {
    // Mock global.sentry for tests
    global.sentry = {
      captureException: jest.fn(),
    };
  });

  afterEach(() => {
    // Clean up the mock
    delete global.sentry;
  });

  it('should update the version metadata', async () => {
    const oldState = {
      meta: {
        version: oldVersion,
      },
      data: {
        NetworkOrderController: {},
        PreferencesController: {
          preferences: {
            tokenNetworkFilter: {
              '0x1': true,
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.meta.version).toStrictEqual(version);
  });

  describe('when tokenNetworkFilter exists and has data', () => {
    it('should migrate tokenNetworkFilter to enabledNetworkMap', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: {
            preferences: {
              tokenNetworkFilter: {
                '0x1': true,
                '0x89': false,
                '0xa': true,
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as any).enabledNetworkMap,
      ).toStrictEqual({
        '0x1': true,
        '0x89': false,
        '0xa': true,
      });
    });
  });

  describe('when tokenNetworkFilter does not exist', () => {
    it('should return state unchanged', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: {
            preferences: {},
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data).toStrictEqual(oldState.data);
    });
  });

  describe('when preferences does not exist', () => {
    it('should return state unchanged', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: {},
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data).toStrictEqual(oldState.data);
    });
  });

  describe('when PreferencesController does not exist', () => {
    it('should return state unchanged', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data).toStrictEqual(oldState.data);
    });
  });

  describe('when NetworkOrderController does not exist', () => {
    it('should return state unchanged and log warning', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          PreferencesController: {
            preferences: {
              tokenNetworkFilter: {
                '0x1': true,
              },
            },
          },
        },
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const newState = await migrate(oldState);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Migration 168: NetworkOrderController is not present',
      );
      expect(newState.data).toStrictEqual(oldState.data);

      consoleSpy.mockRestore();
    });
  });

  describe('when NetworkOrderController is not an object', () => {
    it('should return state unchanged and capture exception', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: 'not an object',
          PreferencesController: {
            preferences: {
              tokenNetworkFilter: {
                '0x1': true,
              },
            },
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 168: NetworkOrderController is type 'string', expected object.",
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('when PreferencesController is not an object', () => {
    it('should return state unchanged and capture exception', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: 'not an object',
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 168: PreferencesController is type 'string', expected object.",
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('when preferences is not an object', () => {
    it('should return state unchanged and capture exception', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: {
            preferences: 'not an object',
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 168: preferences is type 'string', expected object.",
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('when tokenNetworkFilter is not an object', () => {
    it('should return state unchanged and capture exception', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: {
            preferences: {
              tokenNetworkFilter: 'not an object',
            },
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 168: tokenNetworkFilter is type 'string', expected object.",
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('preserves other state', () => {
    it('should not modify other parts of the state', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            orderedNetworkList: ['0x1', '0x89'],
            someOtherProperty: 'value',
          },
          PreferencesController: {
            preferences: {
              tokenNetworkFilter: {
                '0x1': true,
                '0x89': false,
              },
              someOtherPreference: 'value',
            },
            someOtherProperty: 'value',
          },
          SomeOtherController: {
            someProperty: 'value',
          },
        },
      };

      const newState = await migrate(oldState);

      // Check that enabledNetworkMap was set correctly
      expect(
        (newState.data.NetworkOrderController as any).enabledNetworkMap,
      ).toStrictEqual({
        '0x1': true,
        '0x89': false,
      });

      // Check that other properties are preserved
      expect(
        (newState.data.NetworkOrderController as any).orderedNetworkList,
      ).toStrictEqual(['0x1', '0x89']);
      expect(
        (newState.data.NetworkOrderController as any).someOtherProperty,
      ).toStrictEqual('value');
      expect(
        (newState.data.PreferencesController as any).preferences
          .someOtherPreference,
      ).toStrictEqual('value');
      expect(
        (newState.data.PreferencesController as any).someOtherProperty,
      ).toStrictEqual('value');
      expect(
        (newState.data.SomeOtherController as any).someProperty,
      ).toStrictEqual('value');
    });
  });
});
