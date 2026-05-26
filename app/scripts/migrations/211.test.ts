import { KnownSessionProperties } from '@metamask/chain-agnostic-permission';
import { migrate, version } from './211';

const oldVersion = version - 1;

const makeCaip25Permission = (
  caveatValue: Record<string, unknown>,
): Record<string, unknown> => ({
  'endowment:caip25': {
    parentCapability: 'endowment:caip25',
    caveats: [
      {
        type: 'authorizedScopes',
        value: caveatValue,
      },
    ],
  },
});

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state = { meta: { version: oldVersion }, data: {} };
    await migrate(state, new Set());
    expect(state.meta.version).toBe(version);
  });

  it('is a no-op when PermissionController state is missing', async () => {
    const state = { meta: { version: oldVersion }, data: {} };
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual({});
    expect(changed.size).toBe(0);
  });

  it('is a no-op when PermissionController.subjects is missing', async () => {
    const state = {
      meta: { version: oldVersion },
      data: { PermissionController: {} },
    };
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });

  it('adds eip1193-compatible: true for a connection that has eip155 scopes in optionalScopes', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: makeCaip25Permission({
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': { accounts: ['eip155:1:0xabc'] },
                },
                isMultichainOrigin: false,
                sessionProperties: {},
              }),
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);

    const caveatValue = (
      state.data.PermissionController as {
        subjects: Record<
          string,
          { permissions: Record<string, { caveats: { value: unknown }[] }> }
        >;
      }
    ).subjects['https://example.com'].permissions['endowment:caip25'].caveats[0]
      .value as { sessionProperties: Record<string, unknown> };

    expect(caveatValue.sessionProperties).toEqual({
      [KnownSessionProperties.Eip1193Compatible]: true,
    });
    expect(changed.has('PermissionController')).toBe(true);
  });

  it('adds eip1193-compatible: true for a connection that has eip155 scopes in requiredScopes', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: makeCaip25Permission({
                requiredScopes: {
                  'eip155:1': { accounts: ['eip155:1:0xabc'] },
                },
                optionalScopes: {},
                isMultichainOrigin: false,
              }),
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);

    const caveatValue = (
      state.data.PermissionController as {
        subjects: Record<
          string,
          { permissions: Record<string, { caveats: { value: unknown }[] }> }
        >;
      }
    ).subjects['https://example.com'].permissions['endowment:caip25'].caveats[0]
      .value as { sessionProperties: Record<string, unknown> };

    expect(caveatValue.sessionProperties).toEqual({
      [KnownSessionProperties.Eip1193Compatible]: true,
    });
    expect(changed.has('PermissionController')).toBe(true);
  });

  it('preserves existing session properties when adding eip1193-compatible', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: makeCaip25Permission({
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': { accounts: ['eip155:1:0xabc'] },
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                    accounts: [
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4Hx',
                    ],
                  },
                },
                isMultichainOrigin: false,
                sessionProperties: {
                  [KnownSessionProperties.SolanaAccountChangedNotifications]: true,
                },
              }),
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);

    const caveatValue = (
      state.data.PermissionController as {
        subjects: Record<
          string,
          { permissions: Record<string, { caveats: { value: unknown }[] }> }
        >;
      }
    ).subjects['https://example.com'].permissions['endowment:caip25'].caveats[0]
      .value as { sessionProperties: Record<string, unknown> };

    expect(caveatValue.sessionProperties).toEqual({
      [KnownSessionProperties.SolanaAccountChangedNotifications]: true,
      [KnownSessionProperties.Eip1193Compatible]: true,
    });
    expect(changed.has('PermissionController')).toBe(true);
  });

  it('does not modify connections without any eip155 scopes (e.g. Solana-only)', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://solana-dapp.com': {
              origin: 'https://solana-dapp.com',
              permissions: makeCaip25Permission({
                requiredScopes: {},
                optionalScopes: {
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                    accounts: [
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4Hx',
                    ],
                  },
                },
                isMultichainOrigin: false,
                sessionProperties: {},
              }),
            },
          },
        },
      },
    };
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });

  it('does not overwrite an explicitly false eip1193-compatible value', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: makeCaip25Permission({
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': { accounts: ['eip155:1:0xabc'] },
                },
                isMultichainOrigin: false,
                sessionProperties: {
                  [KnownSessionProperties.Eip1193Compatible]: false,
                },
              }),
            },
          },
        },
      },
    };
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });

  it('does not overwrite an existing eip1193-compatible: true value', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: makeCaip25Permission({
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': { accounts: ['eip155:1:0xabc'] },
                },
                isMultichainOrigin: false,
                sessionProperties: {
                  [KnownSessionProperties.Eip1193Compatible]: true,
                },
              }),
            },
          },
        },
      },
    };
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });

  it('processes mixed-EVM-and-non-EVM connections (both get the property)', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: makeCaip25Permission({
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': { accounts: ['eip155:1:0xabc'] },
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                    accounts: [
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4Hx',
                    ],
                  },
                },
                isMultichainOrigin: false,
              }),
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);

    const caveatValue = (
      state.data.PermissionController as {
        subjects: Record<
          string,
          { permissions: Record<string, { caveats: { value: unknown }[] }> }
        >;
      }
    ).subjects['https://example.com'].permissions['endowment:caip25'].caveats[0]
      .value as { sessionProperties: Record<string, unknown> };

    expect(caveatValue.sessionProperties).toEqual({
      [KnownSessionProperties.Eip1193Compatible]: true,
    });
    expect(changed.has('PermissionController')).toBe(true);
  });

  it('updates multiple subjects independently', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://evm-dapp.com': {
              origin: 'https://evm-dapp.com',
              permissions: makeCaip25Permission({
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': { accounts: ['eip155:1:0xabc'] },
                },
                isMultichainOrigin: false,
              }),
            },
            'https://solana-dapp.com': {
              origin: 'https://solana-dapp.com',
              permissions: makeCaip25Permission({
                requiredScopes: {},
                optionalScopes: {
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                    accounts: [
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4Hx',
                    ],
                  },
                },
                isMultichainOrigin: false,
              }),
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);

    const { subjects } = state.data.PermissionController as {
      subjects: Record<
        string,
        { permissions: Record<string, { caveats: { value: unknown }[] }> }
      >;
    };

    const evmCaveat = subjects['https://evm-dapp.com'].permissions[
      'endowment:caip25'
    ].caveats[0].value as { sessionProperties?: Record<string, unknown> };
    const solanaCaveat = subjects['https://solana-dapp.com'].permissions[
      'endowment:caip25'
    ].caveats[0].value as { sessionProperties?: Record<string, unknown> };

    expect(evmCaveat.sessionProperties).toEqual({
      [KnownSessionProperties.Eip1193Compatible]: true,
    });
    expect(solanaCaveat.sessionProperties).toBeUndefined();
    expect(changed.has('PermissionController')).toBe(true);
  });

  it('skips subjects without an endowment:caip25 permission', async () => {
    const state = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: {
                otherPermission: { parentCapability: 'otherPermission' },
              },
            },
          },
        },
      },
    };
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });
});
