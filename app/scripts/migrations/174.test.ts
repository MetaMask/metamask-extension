import { migrate, version } from './174';

const oldVersion = 173;
const newVersion = 174;

describe(`migration #${newVersion}`, () => {
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
        NetworkOrderController: {
          enabledNetworkMap: {
            eip155: {
              '0x1': true,
            },
            solana: {
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.meta.version).toStrictEqual(version);
  });

  describe('when enabledNetworkMap exists and bip122 namespace is missing', () => {
    it('should add bip122 namespace as empty object', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            enabledNetworkMap: {
              eip155: {
                '0x1': true,
                '0x89': false,
              },
              solana: {
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
              },
            },
            orderedNetworkList: ['0x1', '0x89'],
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        eip155: {
          '0x1': true,
          '0x89': false,
        },
        solana: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
        },
        bip122: {},
      });
    });

    it('should preserve other NetworkOrderController properties', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            enabledNetworkMap: {
              eip155: {
                '0x1': true,
              },
            },
            orderedNetworkList: ['0x1'],
            someOtherProperty: 'preserved',
          },
        },
      };

      const newState = await migrate(oldState);

      const networkOrderController = newState.data
        .NetworkOrderController as Record<string, unknown>;

      expect(networkOrderController.enabledNetworkMap).toStrictEqual({
        eip155: {
          '0x1': true,
        },
        bip122: {},
      });
      expect(networkOrderController.orderedNetworkList).toStrictEqual(['0x1']);
      expect(networkOrderController.someOtherProperty).toStrictEqual(
        'preserved',
      );
    });
  });

  describe('when bip122 namespace already exists', () => {
    it('should not modify enabledNetworkMap', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            enabledNetworkMap: {
              eip155: {
                '0x1': true,
              },
              solana: {
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
              },
              bip122: {
                'bip122:000000000019d6689c085ae165831e93': true,
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        eip155: {
          '0x1': true,
        },
        solana: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
        },
        bip122: {
          'bip122:000000000019d6689c085ae165831e93': true,
        },
      });
    });

    it('should not modify state even if bip122 is empty', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            enabledNetworkMap: {
              eip155: {
                '0x1': true,
              },
              bip122: {},
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        eip155: {
          '0x1': true,
        },
        bip122: {},
      });
    });
  });

  describe('when NetworkOrderController does not exist', () => {
    it('should return state unchanged', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          SomeOtherController: {
            someProperty: 'value',
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data).toStrictEqual(oldState.data);
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
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          `Migration ${newVersion}: NetworkOrderController is type 'string', expected object in state.`,
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('when enabledNetworkMap does not exist', () => {
    it('should return state unchanged', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            orderedNetworkList: ['0x1'],
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data).toStrictEqual(oldState.data);
    });
  });

  describe('when enabledNetworkMap is not an object', () => {
    it('should return state unchanged and capture exception', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            enabledNetworkMap: 'not an object',
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          `Migration ${newVersion}: enabledNetworkMap is type 'string', expected object in NetworkOrderController.`,
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
            enabledNetworkMap: {
              eip155: {
                '0x1': true,
              },
            },
            orderedNetworkList: ['0x1', '0x89'],
            someOtherProperty: 'value',
          },
          PreferencesController: {
            preferences: {
              somePreference: 'value',
            },
            someOtherProperty: 'value',
          },
          SomeOtherController: {
            someProperty: 'value',
          },
        },
      };

      const newState = await migrate(oldState);

      // Check that bip122 namespace was added
      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        eip155: {
          '0x1': true,
        },
        bip122: {},
      });

      // Check that other properties are preserved
      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .orderedNetworkList,
      ).toStrictEqual(['0x1', '0x89']);
      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .someOtherProperty,
      ).toStrictEqual('value');
      expect(
        (
          (newState.data.PreferencesController as Record<string, unknown>)
            .preferences as Record<string, unknown>
        ).somePreference,
      ).toStrictEqual('value');
      expect(
        (newState.data.PreferencesController as Record<string, unknown>)
          .someOtherProperty,
      ).toStrictEqual('value');
      expect(
        (newState.data.SomeOtherController as Record<string, unknown>)
          .someProperty,
      ).toStrictEqual('value');
    });
  });

  describe('edge cases', () => {
    it('should handle empty enabledNetworkMap', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            enabledNetworkMap: {},
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        bip122: {},
      });
    });

    it('should handle enabledNetworkMap with only other namespaces', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {
            enabledNetworkMap: {
              solana: {
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
              },
              someCustomNamespace: {
                'custom:123': true,
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        solana: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
        },
        someCustomNamespace: {
          'custom:123': true,
        },
        bip122: {},
      });
    });
  });
});
