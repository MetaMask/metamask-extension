import {
  CaveatConstraint,
  CaveatMutatorOperation,
  PermissionType,
} from '@metamask/permission-controller';
import { NonEmptyArray } from '@metamask/controller-utils';
import * as Scope from './scope';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  caip25EndowmentBuilder,
  Caip25EndowmentPermissionName,
  Caip25CaveatMutatorFactories,
  removeScope,
} from './caip25permissions';

jest.mock('./scope', () => ({
  validateAndFlattenScopes: jest.fn(),
  assertScopesSupported: jest.fn(),
}));
const MockScope = jest.mocked(Scope);

const { removeAccount } = Caip25CaveatMutatorFactories[Caip25CaveatType];

describe('endowment:caip25', () => {
  beforeEach(() => {
    MockScope.validateAndFlattenScopes.mockReturnValue({
      flattenedRequiredScopes: {},
      flattenedOptionalScopes: {},
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('builds the expected permission specification', () => {
    const specification = caip25EndowmentBuilder.specificationBuilder({
      methodHooks: {
        findNetworkClientIdByChainId: jest.fn(),
      },
    });
    expect(specification).toStrictEqual({
      permissionType: PermissionType.Endowment,
      targetName: Caip25EndowmentPermissionName,
      endowmentGetter: expect.any(Function),
      allowedCaveats: [Caip25CaveatType],
      validator: expect.any(Function),
    });

    expect(specification.endowmentGetter()).toBeNull();
  });

  describe('caveat mutator removeScope', () => {
    it('can remove a caveat', () => {
      const ethereumGoerliCaveat = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
          },
        },
        optionalScopes: {
          'eip155:5': {
            methods: ['eth_call'],
            notifications: ['accountsChanged'],
          },
        },
        sessionProperties: {},
        isMultichainOrigin: true,
      };
      const result = removeScope('eip155:5', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.updateValue,
        value: {
          requiredScopes: {
            'eip155:1': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
            },
          },
          optionalScopes: {},
        },
      });
    });

    it('can revoke the entire permission when a requiredScope is removed', () => {
      const ethereumGoerliCaveat = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
          },
        },
        optionalScopes: {
          'eip155:5': {
            methods: ['eth_call'],
            notifications: ['accountsChanged'],
          },
        },
        sessionProperties: {},
        isMultichainOrigin: true,
      };
      const result = removeScope('eip155:1', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.revokePermission,
      });
    });

    it('can noop when nothing is removed', () => {
      const ethereumGoerliCaveat = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
          },
        },
        optionalScopes: {
          'eip155:5': {
            methods: ['eth_call'],
            notifications: ['accountsChanged'],
          },
        },
        sessionProperties: {},
        isMultichainOrigin: true,
      };
      const result = removeScope('eip155:2', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.noop,
      });
    });
  });

  describe('caveat mutator removeAccount', () => {
    it('can remove an account', () => {
      const ethereumGoerliCaveat: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: true,
      };
      const result = removeAccount('0x1', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.updateValue,
        value: {
          requiredScopes: {
            'eip155:1': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
              accounts: ['eip155:1:0x2'],
            },
          },
          optionalScopes: {},
          isMultichainOrigin: true,
        },
      });
    });

    it('can remove an account in multiple scopes in optional and required', () => {
      const ethereumGoerliCaveat: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
          'eip155:2': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:2:0x1', 'eip155:2:0x2'],
          },
        },
        optionalScopes: {
          'eip155:3': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:3:0x1', 'eip155:3:0x2'],
          },
        },
        isMultichainOrigin: true,
      };
      const result = removeAccount('0x1', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.updateValue,
        value: {
          requiredScopes: {
            'eip155:1': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
              accounts: ['eip155:1:0x2'],
            },
            'eip155:2': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
              accounts: ['eip155:2:0x2'],
            },
          },
          optionalScopes: {
            'eip155:3': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
              accounts: ['eip155:3:0x2'],
            },
          },
          isMultichainOrigin: true,
        },
      });
    });

    it('can noop when nothing is removed', () => {
      const ethereumGoerliCaveat: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {
          'eip155:5': {
            methods: ['eth_call'],
            notifications: ['accountsChanged'],
          },
        },
        isMultichainOrigin: true,
      };
      const result = removeAccount('0x3', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.noop,
      });
    });
  });

  describe('permission validator', () => {
    const findNetworkClientIdByChainId = jest.fn();
    const { validator } = caip25EndowmentBuilder.specificationBuilder({
      findNetworkClientIdByChainId,
    });

    it('throws an error if there is not exactly one caveat', () => {
      expect(() => {
        validator({
          caveats: [
            {
              type: 'caveatType',
              value: {},
            },
            {
              type: 'caveatType',
              value: {},
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      }).toThrow(
        new Error(
          `${Caip25EndowmentPermissionName} error: Invalid caveats. There must be a single caveat of type "${Caip25CaveatType}".`,
        ),
      );

      expect(() => {
        validator({
          caveats: [] as unknown as NonEmptyArray<CaveatConstraint>,
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      }).toThrow(
        new Error(
          `${Caip25EndowmentPermissionName} error: Invalid caveats. There must be a single caveat of type "${Caip25CaveatType}".`,
        ),
      );
    });

    it('throws an error if there is no CAIP-25 caveat', () => {
      expect(() => {
        validator({
          caveats: [
            {
              type: 'NotCaip25Caveat',
              value: {},
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      }).toThrow(
        new Error(
          `${Caip25EndowmentPermissionName} error: Invalid caveats. There must be a single caveat of type "${Caip25CaveatType}".`,
        ),
      );
    });

    it('throws an error if the CAIP-25 caveat is malformed', () => {
      expect(() => {
        validator({
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                missingRequiredScopes: {},
                optionalScopes: {},
                isMultichainOrigin: true,
              },
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      }).toThrow(
        new Error(
          `${Caip25EndowmentPermissionName} error: Received invalid value for caveat of type "${Caip25CaveatType}".`,
        ),
      );

      expect(() => {
        validator({
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                missingOptionalScopes: {},
                isMultichainOrigin: true,
              },
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      }).toThrow(
        new Error(
          `${Caip25EndowmentPermissionName} error: Received invalid value for caveat of type "${Caip25CaveatType}".`,
        ),
      );

      expect(() => {
        validator({
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {},
                isMultichainOrigin: 'NotABoolean',
              },
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      }).toThrow(
        new Error(
          `${Caip25EndowmentPermissionName} error: Received invalid value for caveat of type "${Caip25CaveatType}".`,
        ),
      );
    });

    it('validates and flattens the ScopesObjects', () => {
      try {
        validator({
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  'eip155:1': {
                    methods: ['eth_chainId'],
                    notifications: [],
                    accounts: ['eip155:1:0xdead'],
                  },
                },
                optionalScopes: {
                  'eip155:5': {
                    methods: [],
                    notifications: [],
                    accounts: ['eip155:5:0xbeef'],
                  },
                },
                isMultichainOrigin: true,
              },
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      } catch (err) {
        // noop
      }
      expect(MockScope.validateAndFlattenScopes).toHaveBeenCalledWith(
        {
          'eip155:1': {
            methods: ['eth_chainId'],
            notifications: [],
            accounts: ['eip155:1:0xdead'],
          },
        },
        {
          'eip155:5': {
            methods: [],
            notifications: [],
            accounts: ['eip155:5:0xbeef'],
          },
        },
      );
    });

    it('asserts the validated and flattened required scopes are supported', () => {
      MockScope.validateAndFlattenScopes.mockReturnValue({
        flattenedRequiredScopes: {
          'eip155:1': {
            methods: ['flattened_required'],
            notifications: [],
          },
        },
        flattenedOptionalScopes: {
          'eip155:1': {
            methods: ['flattened_optional'],
            notifications: [],
          },
        },
      });
      try {
        validator({
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  'eip155:1': {
                    methods: ['eth_chainId'],
                    notifications: [],
                    accounts: ['eip155:1:0xdead'],
                  },
                },
                optionalScopes: {
                  'eip155:5': {
                    methods: [],
                    notifications: [],
                    accounts: ['eip155:5:0xbeef'],
                  },
                },
                isMultichainOrigin: true,
              },
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      } catch (err) {
        // noop
      }
      expect(MockScope.assertScopesSupported).toHaveBeenCalledWith(
        {
          'eip155:1': {
            methods: ['flattened_required'],
            notifications: [],
          },
        },
        expect.objectContaining({
          isChainIdSupported: expect.any(Function),
        }),
      );
      const isChainIdSupportedBody =
        MockScope.assertScopesSupported.mock.calls[0][1].isChainIdSupported.toString();
      expect(isChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
    });

    it('asserts the validated and flattened optional scopes are supported', () => {
      MockScope.validateAndFlattenScopes.mockReturnValue({
        flattenedRequiredScopes: {
          'eip155:1': {
            methods: ['flattened_required'],
            notifications: [],
          },
        },
        flattenedOptionalScopes: {
          'eip155:1': {
            methods: ['flattened_optional'],
            notifications: [],
          },
        },
      });
      try {
        validator({
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  'eip155:1': {
                    methods: ['eth_chainId'],
                    notifications: [],
                    accounts: ['eip155:1:0xdead'],
                  },
                },
                optionalScopes: {
                  'eip155:5': {
                    methods: [],
                    notifications: [],
                    accounts: ['eip155:5:0xbeef'],
                  },
                },
                isMultichainOrigin: true,
              },
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      } catch (err) {
        // noop
      }
      expect(MockScope.assertScopesSupported).toHaveBeenCalledWith(
        {
          'eip155:1': {
            methods: ['flattened_optional'],
            notifications: [],
          },
        },
        expect.objectContaining({
          isChainIdSupported: expect.any(Function),
        }),
      );
      const isChainIdSupportedBody =
        MockScope.assertScopesSupported.mock.calls[1][1].isChainIdSupported.toString();
      expect(isChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
    });

    it('throws if the input requiredScopes does not match the output of validateAndFlattenScopes', () => {
      MockScope.validateAndFlattenScopes.mockReturnValue({
        flattenedRequiredScopes: {},
        flattenedOptionalScopes: {
          'eip155:5': {
            methods: [],
            notifications: [],
            accounts: ['eip155:5:0xbeef'],
          },
        },
      });
      expect(() => {
        validator({
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  'eip155:1': {
                    methods: ['eth_chainId'],
                    notifications: [],
                    accounts: ['eip155:1:0xdead'],
                  },
                },
                optionalScopes: {
                  'eip155:5': {
                    methods: [],
                    notifications: [],
                    accounts: ['eip155:5:0xbeef'],
                  },
                },
                isMultichainOrigin: true,
              },
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      }).toThrow(/Expected values to be strictly deep-equal/u);
    });

    it('throws if the input optionalScopes does not match the output of validateAndFlattenScopes', () => {
      MockScope.validateAndFlattenScopes.mockReturnValue({
        flattenedRequiredScopes: {
          'eip155:1': {
            methods: ['eth_chainId'],
            notifications: [],
            accounts: ['eip155:1:0xdead'],
          },
        },
        flattenedOptionalScopes: {},
      });
      expect(() => {
        validator({
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  'eip155:1': {
                    methods: ['eth_chainId'],
                    notifications: [],
                    accounts: ['eip155:1:0xdead'],
                  },
                },
                optionalScopes: {
                  'eip155:5': {
                    methods: [],
                    notifications: [],
                    accounts: ['eip155:5:0xbeef'],
                  },
                },
                isMultichainOrigin: true,
              },
            },
          ],
          date: 1234,
          id: '1',
          invoker: 'test.com',
          parentCapability: Caip25EndowmentPermissionName,
        });
      }).toThrow(/Expected values to be strictly deep-equal/u);
    });

    it('does not throw if the input requiredScopes and optionalScopes ScopesObject are already validated and flattened', () => {
      MockScope.validateAndFlattenScopes.mockReturnValue({
        flattenedRequiredScopes: {
          'eip155:1': {
            methods: ['eth_chainId'],
            notifications: [],
            accounts: ['eip155:1:0xdead'],
          },
        },
        flattenedOptionalScopes: {
          'eip155:5': {
            methods: [],
            notifications: [],
            accounts: ['eip155:5:0xbeef'],
          },
        },
      });
      validator({
        caveats: [
          {
            type: Caip25CaveatType,
            value: {
              requiredScopes: {
                'eip155:1': {
                  methods: ['eth_chainId'],
                  notifications: [],
                  accounts: ['eip155:1:0xdead'],
                },
              },
              optionalScopes: {
                'eip155:5': {
                  methods: [],
                  notifications: [],
                  accounts: ['eip155:5:0xbeef'],
                },
              },
              isMultichainOrigin: true,
            },
          },
        ],
        date: 1234,
        id: '1',
        invoker: 'test.com',
        parentCapability: Caip25EndowmentPermissionName,
      });
    });
  });
});
