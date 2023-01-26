import migration78 from './078';

describe('migration #78', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
    };

    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 78,
    });
  });

  it('should set tokensChainsCache to an empty object if the property is not set', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910781af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910781af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
        },
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910781af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910781af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {},
        },
      },
    });
  });

  it('should set tokensChainsCache to an empty object if the property is set to undefined', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910781af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910781af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: undefined,
        },
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910781af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910781af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {},
        },
      },
    });
  });

  it('should leave tokensChainsCache unchanged if it is an empty object', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910781af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910781af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {},
        },
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910781af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910781af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {},
        },
      },
    });
  });

  it('should leave tokensChainsCache unchanged if it is an object with data', async () => {
    const oldStorage = {
      meta: {
        version: 77,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910781af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910781af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {
            1: {
              timestamp: 1234,
              data: {
                '0x514910771af9ca656af840dff83e8264ecf986ca': {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  symbol: 'LINK',
                  decimals: 18,
                },
                '0xc00e94cb662c3520282e6f5717214004a7f26888': {
                  address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
                  symbol: 'COMP',
                  decimals: 18,
                },
              },
            },
          },
        },
      },
    };
    const newStorage = await migration78.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 78,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910781af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910781af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {
            1: {
              timestamp: 1234,
              data: {
                '0x514910771af9ca656af840dff83e8264ecf986ca': {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  symbol: 'LINK',
                  decimals: 18,
                },
                '0xc00e94cb662c3520282e6f5717214004a7f26888': {
                  address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
                  symbol: 'COMP',
                  decimals: 18,
                },
              },
            },
          },
        },
      },
    });
  });
});
