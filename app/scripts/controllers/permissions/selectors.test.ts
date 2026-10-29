/* eslint-disable @typescript-eslint/naming-convention */
import { cloneDeep } from 'lodash';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import type { CaipChainId } from '@metamask/utils';
import {
  getAuthorizedScopesByOrigin,
  getPermittedAccountsByOrigin,
  getPermittedAccountsForScopesByOrigin,
  getPermittedChainsByOrigin,
  getOriginsWithSessionProperty,
  type PermissionControllerState,
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

      const selected1 = getPermittedAccountsByOrigin(
        state1 as unknown as PermissionControllerState,
      );

      expect(selected1).toStrictEqual(expected1);
      // The selector should return the memoized value if state.subjects is
      // the same object
      expect(selected1).toBe(
        getPermittedAccountsByOrigin(
          state1 as unknown as Parameters<
            typeof getPermittedAccountsByOrigin
          >[0],
        ),
      );

      // If we mutate the state, the selector return value should be different
      // from the first.
      const state2 = cloneDeep(state1);
      delete (state2.subjects as Record<string, unknown>)['foo.bar'];

      const expected2 = new Map([
        ['bar.baz', ['0x2']],
        ['baz.fizz', ['0x1', '0x2']],
      ]);

      const selected2 = getPermittedAccountsByOrigin(
        state2 as unknown as PermissionControllerState,
      );

      expect(selected2).toStrictEqual(expected2);
      expect(selected2).not.toBe(selected1);
      // Since we didn't mutate the state at this point, the value should once
      // again be the memoized.
      expect(selected2).toBe(
        getPermittedAccountsByOrigin(
          state2 as unknown as Parameters<
            typeof getPermittedAccountsByOrigin
          >[0],
        ),
      );
    });

    it('reads the CAIP-25 caveat when it is not the first caveat', () => {
      const state = {
        subjects: {
          'multi.caveat': {
            origin: 'multi.caveat',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  { type: 'someOtherCaveat', value: {} },
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0xabc'],
                        },
                      },
                      optionalScopes: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const selected = getPermittedAccountsByOrigin(
        state as unknown as PermissionControllerState,
      );

      expect(selected).toStrictEqual(new Map([['multi.caveat', ['0xabc']]]));
    });
  });

  describe('getPermittedAccountsForScopesByOrigin', () => {
    const scopesEip155Mainnet = ['eip155:1'] as const;

    it('returns origins whose caveat includes accounts for the requested scopes', () => {
      const state = {
        subjects: {
          'has.match': {
            origin: 'has.match',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x111'],
                        },
                      },
                      optionalScopes: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
          'no.matching.scope': {
            origin: 'no.matching.scope',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:2': {
                          accounts: ['eip155:2:0x222'],
                        },
                      },
                      optionalScopes: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
          'no.caip25': {
            origin: 'no.caip25',
            permissions: {
              other_permission: {},
            },
          },
        },
      };

      const selected = getPermittedAccountsForScopesByOrigin(
        state as unknown as PermissionControllerState,
        [...scopesEip155Mainnet],
      );

      expect(selected).toStrictEqual(
        new Map([['has.match', ['eip155:1:0x111']]]),
      );
    });

    it('includes accounts from optionalScopes when the scope matches', () => {
      const state = {
        subjects: {
          'opt.only': {
            origin: 'opt.only',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0xaaa'],
                        },
                      },
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const selected = getPermittedAccountsForScopesByOrigin(
        state as unknown as PermissionControllerState,
        ['eip155:1'],
      );

      expect(selected).toStrictEqual(
        new Map([['opt.only', ['eip155:1:0xaaa']]]),
      );
    });

    it('omits origins when the requested scopes yield no accounts', () => {
      const state = {
        subjects: {
          'only.eip155_2': {
            origin: 'only.eip155_2',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {
                        'eip155:2': {
                          accounts: ['eip155:2:0x222'],
                        },
                      },
                      optionalScopes: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const selected = getPermittedAccountsForScopesByOrigin(
        state as unknown as PermissionControllerState,
        ['eip155:1'],
      );

      expect(selected).toStrictEqual(new Map());
    });

    it('memoizes when state.subjects and scopes are unchanged', () => {
      const state = {
        subjects: {
          'a.com': {
            origin: 'a.com',
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
                      optionalScopes: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const scopes: CaipChainId[] = ['eip155:1'];
      const first = getPermittedAccountsForScopesByOrigin(
        state as unknown as PermissionControllerState,
        scopes,
      );
      const second = getPermittedAccountsForScopesByOrigin(
        state as unknown as PermissionControllerState,
        scopes,
      );

      expect(second).toBe(first);
    });
  });

  describe('getAuthorizedScopesByOrigin', () => {
    it('returns a map of each origin to its CAIP-25 caveat value', () => {
      const caveatValueA = {
        requiredScopes: {
          'eip155:1': {
            accounts: ['eip155:1:0x1'],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: false,
      };
      const caveatValueB = {
        requiredScopes: {},
        optionalScopes: {
          'eip155:1': {
            accounts: ['eip155:1:0x2'],
          },
        },
        isMultichainOrigin: false,
      };

      const state = {
        subjects: {
          'a.com': {
            origin: 'a.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: caveatValueA,
                  },
                ],
              },
            },
          },
          'b.com': {
            origin: 'b.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: caveatValueB,
                  },
                ],
              },
            },
          },
          'no.caip': {
            origin: 'no.caip',
            permissions: {
              other: {},
            },
          },
        },
      };

      const selected = getAuthorizedScopesByOrigin(
        state as unknown as PermissionControllerState,
      );

      expect(selected.get('a.com')).toStrictEqual(caveatValueA);
      expect(selected.get('b.com')).toStrictEqual(caveatValueB);
      expect(selected.has('no.caip')).toBe(false);
    });

    it('memoizes when state.subjects is unchanged', () => {
      const state = {
        subjects: {
          'x.com': {
            origin: 'x.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const first = getAuthorizedScopesByOrigin(
        state as unknown as PermissionControllerState,
      );
      const second = getAuthorizedScopesByOrigin(
        state as unknown as PermissionControllerState,
      );

      expect(second).toBe(first);
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

      const selected1 = getPermittedChainsByOrigin(
        state1 as unknown as PermissionControllerState,
      );

      expect(selected1).toStrictEqual(expected1);
      // The selector should return the memoized value if state.subjects is
      // the same object
      expect(selected1).toBe(
        getPermittedChainsByOrigin(
          state1 as unknown as PermissionControllerState,
        ),
      );

      // If we mutate the state, the selector return value should be different
      // from the first.
      const state2 = cloneDeep(state1);
      delete (state2.subjects as Record<string, unknown>)['foo.bar'];

      const expected2 = new Map([
        ['bar.baz', ['0x2']],
        ['baz.fizz', ['0x1', '0x2']],
      ]);

      const selected2 = getPermittedChainsByOrigin(
        state2 as unknown as PermissionControllerState,
      );

      expect(selected2).toStrictEqual(expected2);
      expect(selected2).not.toBe(selected1);
      // Since we didn't mutate the state at this point, the value should once
      // again be the memoized.
      expect(selected2).toBe(
        getPermittedChainsByOrigin(
          state2 as unknown as PermissionControllerState,
        ),
      );
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
        state as unknown as PermissionControllerState,
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
        state as unknown as PermissionControllerState,
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
        state as unknown as PermissionControllerState,
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
        state as unknown as PermissionControllerState,
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
        state as unknown as PermissionControllerState,
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

      const result = getOriginsWithSessionProperty(
        state as unknown as PermissionControllerState,
        'any_property',
      );

      expect(result).toStrictEqual({});
    });
  });
});
