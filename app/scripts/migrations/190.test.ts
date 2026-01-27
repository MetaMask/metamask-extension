import { migrate, version } from './190';

const oldVersion = 189;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const newState = await migrate(oldState);

    expect(newState.meta.version).toStrictEqual(version);
  });

  describe('enabledNetworkMap cleaning', () => {
    it('should remove malformed chain IDs from eip155 namespace', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkEnablementController: {
            enabledNetworkMap: {
              eip155: {
                '0x1': true, // Valid hex
                'eip155:1': false, // Malformed - should be '0x1' for EVM
                '0x89': true, // Valid hex
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkEnablementController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        eip155: {
          '0x1': true,
          '0x89': true,
        },
      });
    });

    it('should remove malformed chain IDs from non-EVM namespaces', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkEnablementController: {
            enabledNetworkMap: {
              solana: {
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true, // Valid CAIP
                solana: false, // Malformed - missing reference
                'solana:': false, // Malformed - empty reference
              },
              bip122: {
                'bip122:000000000019d6689c085ae165831e93': true, // Valid CAIP
                bitcoin: false, // Malformed
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkEnablementController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        solana: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
        },
        bip122: {
          'bip122:000000000019d6689c085ae165831e93': true,
        },
      });
    });

    it('should handle mixed valid and invalid chain IDs', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkEnablementController: {
            enabledNetworkMap: {
              eip155: {
                '0x1': true, // Valid
                '0x89': false, // Valid
                notahex: true, // Invalid
              },
              solana: {
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true, // Valid
                'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': true, // Valid
                solana: false, // Invalid
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkEnablementController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        eip155: {
          '0x1': true,
          '0x89': false,
        },
        solana: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
          'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': true,
        },
      });
    });

    it('should remove entire namespace if all chain IDs are invalid', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkEnablementController: {
            enabledNetworkMap: {
              eip155: {
                '0x1': true, // Valid
              },
              solana: {
                solana: true, // Invalid
                invalidid: false, // Invalid
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkEnablementController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        eip155: {
          '0x1': true,
        },
        // solana namespace removed because all chain IDs were invalid
      });
    });

    it('should handle missing NetworkEnablementController', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          SomeOtherController: {},
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data).toStrictEqual({
        SomeOtherController: {},
      });
    });

    it('should handle missing enabledNetworkMap', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkEnablementController: {
            someOtherProperty: 'value',
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data).toStrictEqual({
        NetworkEnablementController: {
          someOtherProperty: 'value',
        },
      });
    });

    it('should handle empty enabledNetworkMap', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkEnablementController: {
            enabledNetworkMap: {},
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkEnablementController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({});
    });

    it('should not modify valid enabledNetworkMap', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkEnablementController: {
            enabledNetworkMap: {
              eip155: {
                '0x1': true,
                '0x89': false,
              },
              solana: {
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(
        (newState.data.NetworkEnablementController as Record<string, unknown>)
          .enabledNetworkMap,
      ).toStrictEqual({
        eip155: {
          '0x1': true,
          '0x89': false,
        },
        solana: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
        },
      });
    });
  });
});
