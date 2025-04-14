import {
  Caip25EndowmentPermissionName,
  KnownSessionProperties,
} from '@metamask/chain-agnostic-permission';

import { migrate, version } from './152';

const oldVersion = 151;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if PermissionController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        SomeOtherController: {},
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds sessionProperties to CAIP-25 permissions that do not have it', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'example.com': {
              origin: 'example.com',
              permissions: {
                [Caip25EndowmentPermissionName]: {
                  id: '123',
                  parentCapability: Caip25EndowmentPermissionName,
                  invoker: 'example.com',
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
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
        },
      },
    };

    const expectedData = {
      PermissionController: {
        subjects: {
          'example.com': {
            origin: 'example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                id: '123',
                parentCapability: Caip25EndowmentPermissionName,
                invoker: 'example.com',
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x123'],
                        },
                      },
                      isMultichainOrigin: false,
                      sessionProperties: {},
                    },
                  },
                ],
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(expectedData);
  });

  it('preserves existing sessionProperties in CAIP-25 permissions', async () => {
    const existingSessionProperties = {
      [KnownSessionProperties.SolanaAccountChangedNotifications]: true,
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'example.com': {
              origin: 'example.com',
              permissions: {
                [Caip25EndowmentPermissionName]: {
                  id: '123',
                  parentCapability: Caip25EndowmentPermissionName,
                  invoker: 'example.com',
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
                          },
                        },
                        isMultichainOrigin: false,
                        sessionProperties: existingSessionProperties,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    const expectedData = {
      PermissionController: {
        subjects: {
          'example.com': {
            origin: 'example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                id: '123',
                parentCapability: Caip25EndowmentPermissionName,
                invoker: 'example.com',
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x123'],
                        },
                      },
                      isMultichainOrigin: false,
                      sessionProperties: existingSessionProperties,
                    },
                  },
                ],
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(expectedData);
  });

  it('handles multiple subjects with CAIP-25 permissions', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'example.com': {
              origin: 'example.com',
              permissions: {
                [Caip25EndowmentPermissionName]: {
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {},
                        isMultichainOrigin: false,
                      },
                    },
                  ],
                },
              },
            },
            'other-site.com': {
              origin: 'other-site.com',
              permissions: {
                [Caip25EndowmentPermissionName]: {
                  caveats: [
                    {
                      type: 'authorizedScopes',
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
        },
      },
    };

    const expectedData = {
      PermissionController: {
        subjects: {
          'example.com': {
            origin: 'example.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      isMultichainOrigin: false,
                      sessionProperties: {},
                    },
                  },
                ],
              },
            },
          },
          'other-site.com': {
            origin: 'other-site.com',
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      isMultichainOrigin: true,
                      sessionProperties: {},
                    },
                  },
                ],
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(expectedData);
  });

  it('ignores subjects without CAIP-25 permissions', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {
            'example.com': {
              origin: 'example.com',
              permissions: {
                'other:permission': {
                  id: '123',
                  parentCapability: 'other:permission',
                  invoker: 'example.com',
                  caveats: [],
                },
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
