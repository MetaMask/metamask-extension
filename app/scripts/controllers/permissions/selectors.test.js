import { cloneDeep } from 'lodash';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import {
  getPermittedAccountsByOrigin,
  getPermittedChainsByOrigin,
  getOriginsWithSessionProperty,
} from './selectors';

describe('PermissionController selectors', () => {
  describe('getPermittedAccountsByOrigin', () => {
    it('memoizes and gets permitted accounts by origin', () => {
      const state1 = {
        subjects: {
          'foo.bar': {
            origin: 'foo.bar',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x1'],
                        },
                      },
                      optionalScopes: {
                        'bip122:000000000019d6689c085ae165831e93': {
                          accounts: [
                            'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                          ],
                        },
                      },
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
          },
          'bar.baz': {
            origin: 'bar.baz',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x2'],
                        },
                      },
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
          'baz.bizz': {
            origin: 'baz.fizz',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x1'],
                        },
                      },
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x2'],
                        },
                      },
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
          'no.accounts': {
            // we shouldn't see this in the result
            permissions: {
              foobar: {},
            },
          },
        },
      };

      const expected1 = new Map([
        ['foo.bar', ['0x1']],
        ['bar.baz', ['0x2']],
        ['baz.fizz', ['0x1', '0x2']],
      ]);

      const selected1 = getPermittedAccountsByOrigin(state1);

      expect(selected1).toStrictEqual(expected1);
      // The selector should return the memoized value if state.subjects is
      // the same object
      expect(selected1).toBe(getPermittedAccountsByOrigin(state1));

      // If we mutate the state, the selector return value should be different
      // from the first.
      const state2 = cloneDeep(state1);
      delete state2.subjects['foo.bar'];

      const expected2 = new Map([
        ['bar.baz', ['0x2']],
        ['baz.fizz', ['0x1', '0x2']],
      ]);

      const selected2 = getPermittedAccountsByOrigin(state2);

      expect(selected2).toStrictEqual(expected2);
      expect(selected2).not.toBe(selected1);
      // Since we didn't mutate the state at this point, the value should once
      // again be the memoized.
      expect(selected2).toBe(getPermittedAccountsByOrigin(state2));
    });
  });

  describe('getPermittedChainsByOrigin', () => {
    it('memoizes and gets permitted chains by origin', () => {
      const state1 = {
        subjects: {
          'foo.bar': {
            origin: 'foo.bar',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: [],
                        },
                      },
                      optionalScopes: {
                        'bip122:000000000019d6689c085ae165831e93': {
                          accounts: [],
                        },
                      },
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
          },
          'bar.baz': {
            origin: 'bar.baz',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:2': {
                          accounts: [],
                        },
                      },
                      optionalScopes: {},
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
          },
          'baz.bizz': {
            origin: 'baz.fizz',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: [],
                        },
                      },
                      optionalScopes: {
                        'eip155:2': {
                          accounts: [],
                        },
                      },
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
          },
          'no.chains': {
            // we shouldn't see this in the result
            permissions: {
              foobar: {},
            },
          },
        },
      };

      const expected1 = new Map([
        ['foo.bar', ['0x1']],
        ['bar.baz', ['0x2']],
        ['baz.fizz', ['0x1', '0x2']],
      ]);

      const selected1 = getPermittedChainsByOrigin(state1);

      expect(selected1).toStrictEqual(expected1);
      // The selector should return the memoized value if state.subjects is
      // the same object
      expect(selected1).toBe(getPermittedChainsByOrigin(state1));

      // If we mutate the state, the selector return value should be different
      // from the first.
      const state2 = cloneDeep(state1);
      delete state2.subjects['foo.bar'];

      const expected2 = new Map([
        ['bar.baz', ['0x2']],
        ['baz.fizz', ['0x1', '0x2']],
      ]);

      const selected2 = getPermittedChainsByOrigin(state2);

      expect(selected2).toStrictEqual(expected2);
      expect(selected2).not.toBe(selected1);
      // Since we didn't mutate the state at this point, the value should once
      // again be the memoized.
      expect(selected2).toBe(getPermittedChainsByOrigin(state2));
    });
  });

  describe('getOriginsWithSessionProperty', () => {
    it('returns origins that have the specified session property', () => {
      const state = {
        subjects: {
          'dapp1.example.com': {
            origin: 'dapp1.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      sessionProperties: {
                        solana_accountChanged_notifications: true,
                      },
                    },
                  },
                ],
              },
            },
          },
          'dapp2.example.com': {
            origin: 'dapp2.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      sessionProperties: {
                        another_property: 'value',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const result = getOriginsWithSessionProperty(
        state,
        'solana_accountChanged_notifications',
      );

      expect(result).toStrictEqual({
        'dapp1.example.com': true,
      });
    });

    it('returns empty object when no origins have the specified session property', () => {
      const state = {
        subjects: {
          'dapp1.example.com': {
            origin: 'dapp1.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      sessionProperties: {
                        some_property: 'value',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const result = getOriginsWithSessionProperty(
        state,
        'non_existent_property',
      );

      expect(result).toStrictEqual({});
    });

    it('returns multiple origins that have the specified session property', () => {
      const state = {
        subjects: {
          'dapp1.example.com': {
            origin: 'dapp1.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      sessionProperties: {
                        solana_accountChanged_notifications: true,
                      },
                    },
                  },
                ],
              },
            },
          },
          'dapp2.example.com': {
            origin: 'dapp2.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      sessionProperties: {
                        solana_accountChanged_notifications: false,
                      },
                    },
                  },
                ],
              },
            },
          },
          'dapp3.example.com': {
            origin: 'dapp3.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      sessionProperties: {
                        other_property: 'value',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const result = getOriginsWithSessionProperty(
        state,
        'solana_accountChanged_notifications',
      );

      expect(result).toStrictEqual({
        'dapp1.example.com': true,
        'dapp2.example.com': false,
      });
    });

    it('ignores origins without CAIP-25 permissions', () => {
      const state = {
        subjects: {
          'dapp1.example.com': {
            origin: 'dapp1.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      sessionProperties: {
                        solana_accountChanged_notifications: true,
                      },
                    },
                  },
                ],
              },
            },
          },
          'dapp2.example.com': {
            origin: 'dapp2.example.com',
            permissions: {
              eth_accounts: {
                caveats: [],
              },
            },
          },
        },
      };

      const result = getOriginsWithSessionProperty(
        state,
        'solana_accountChanged_notifications',
      );

      expect(result).toStrictEqual({
        'dapp1.example.com': true,
      });
    });

    it('ignores origins with CAIP-25 permissions but without sessionProperties', () => {
      const state = {
        subjects: {
          'dapp1.example.com': {
            origin: 'dapp1.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      // No sessionProperties
                    },
                  },
                ],
              },
            },
          },
          'dapp2.example.com': {
            origin: 'dapp2.example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      sessionProperties: {
                        solana_accountChanged_notifications: true,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const result = getOriginsWithSessionProperty(
        state,
        'solana_accountChanged_notifications',
      );

      expect(result).toStrictEqual({
        'dapp2.example.com': true,
      });
    });

    it('handles empty subjects', () => {
      const state = {
        subjects: {},
      };

      const result = getOriginsWithSessionProperty(state, 'any_property');

      expect(result).toStrictEqual({});
    });
  });
});
