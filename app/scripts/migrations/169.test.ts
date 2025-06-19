import { migrate, version } from './169';

const oldVersion = 168;

describe('migration #169', () => {
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
        MultichainNetworkController: {
          selectedMultichainNetworkChainId: '0x1',
          isEvmSelected: true,
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.meta.version).toStrictEqual(version);
  });

  describe('when tokenNetworkFilter exists and has data', () => {
    it('should migrate tokenNetworkFilter to enabledNetworkMap for EVM networks', async () => {
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        'eip155:1': true,
        'eip155:137': false,
        'eip155:10': true,
      });
    });

    it('should migrate tokenNetworkFilter to enabledNetworkMap for non-EVM networks', async () => {
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
              },
            },
          },
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: 'solana:mainnet',
            isEvmSelected: false,
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        'solana:mainnet': true,
      });
    });
  });

  describe('when tokenNetworkFilter does not exist', () => {
    it('should return state unchanged and log warning', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: {
            preferences: {},
          },
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const newState = await migrate(oldState);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Migration 169: tokenNetworkFilter is not present in preferences - skipping migration',
      );
      expect(newState.data).toStrictEqual(oldState.data);

      consoleSpy.mockRestore();
    });
  });

  describe('when preferences does not exist', () => {
    it('should return state unchanged and log warning', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: {},
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const newState = await migrate(oldState);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Migration 169: preferences is not present in PreferencesController',
      );
      expect(newState.data).toStrictEqual(oldState.data);

      consoleSpy.mockRestore();
    });
  });

  describe('when PreferencesController does not exist', () => {
    it('should return state unchanged and log warning', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const newState = await migrate(oldState);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Migration 169: PreferencesController is not present in state',
      );
      expect(newState.data).toStrictEqual(oldState.data);

      consoleSpy.mockRestore();
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const newState = await migrate(oldState);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Migration 169: NetworkOrderController is not present in state',
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 169: NetworkOrderController is type 'string', expected object in state.",
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 169: PreferencesController is type 'string', expected object in state.",
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 169: preferences is type 'string', expected object in PreferencesController.",
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 169: tokenNetworkFilter is type 'string', expected object.",
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('when MultichainNetworkController does not exist', () => {
    it('should return state unchanged and capture exception', async () => {
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

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(new Error());
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('when MultichainNetworkController is not an object', () => {
    it('should return state unchanged and capture exception', async () => {
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
          MultichainNetworkController: 'not an object',
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(new Error());
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('when selectedMultichainNetworkChainId is invalid', () => {
    it('should return state unchanged and capture exception when undefined', async () => {
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
          MultichainNetworkController: {
            isEvmSelected: false,
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 169: selectedMultichainNetworkChainId is type 'undefined', expected string.",
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });

    it('should return state unchanged and capture exception when not a string', async () => {
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: 123,
            isEvmSelected: false,
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 169: selectedMultichainNetworkChainId is type 'number', expected string.",
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });
  });

  describe('when multichainNetworkConfigurationsByChainId is invalid', () => {
    it('should return state unchanged and capture exception when not an object', async () => {
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            multichainNetworkConfigurationsByChainId: 'not an object',
            isEvmSelected: true,
          },
        },
      };

      const sentrySpy = jest
        .spyOn(global.sentry, 'captureException')
        .mockImplementation();

      const newState = await migrate(oldState);

      expect(sentrySpy).toHaveBeenCalledWith(
        new Error(
          "Migration 169: multichainNetworkConfigurationsByChainId is type 'string', expected object.",
        ),
      );
      expect(newState.data).toStrictEqual(oldState.data);

      sentrySpy.mockRestore();
    });

    it('should continue migration when multichainNetworkConfigurationsByChainId is undefined', async () => {
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        'eip155:1': true,
      });
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
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
          SomeOtherController: {
            someProperty: 'value',
          },
        },
      };

      const newState = await migrate(oldState);

      // Check that enabledNetworkMap was set correctly
      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        'eip155:1': true,
        'eip155:137': false,
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
        ).someOtherPreference,
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

  describe('CAIP chain ID formatting', () => {
    it('should correctly format EVM chain IDs to CAIP format', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          NetworkOrderController: {},
          PreferencesController: {
            preferences: {
              tokenNetworkFilter: {
                '0x1': true, // Ethereum mainnet
                '0x89': false, // Polygon
                '0xa': true, // Optimism
                '0xa4b1': true, // Arbitrum One
              },
            },
          },
          MultichainNetworkController: {
            selectedMultichainNetworkChainId: '0x1',
            isEvmSelected: true,
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkOrderController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        'eip155:1': true, // Ethereum mainnet
        'eip155:137': false, // Polygon
        'eip155:10': true, // Optimism
        'eip155:42161': true, // Arbitrum One
      });
    });
  });
});
