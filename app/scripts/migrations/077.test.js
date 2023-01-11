import migration77 from './077';

describe('migration #77', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 76,
      },
    };

    const newStorage = await migration77.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 77,
    });
  });
  it('should change the data from array to object for a single network', async () => {
    const oldStorage = {
      meta: {
        version: 76,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {
            1: {
              timestamp: 1234,
              data: [
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  symbol: 'LINK',
                  decimals: 18,
                },
                {
                  address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
                  symbol: 'COMP',
                  decimals: 18,
                },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migration77.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 77,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
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
  it('should change the data from array to object for a multiple networks', async () => {
    const oldStorage = {
      meta: {
        version: 76,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {
            1: {
              timestamp: 1234,
              data: [
                {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  symbol: 'LINK',
                  decimals: 18,
                },
                {
                  address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
                  symbol: 'COMP',
                  decimals: 18,
                },
              ],
            },
            56: {
              timestamp: 1324,
              data: [
                {
                  address: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47',
                  symbol: 'ADA',
                  decimals: 18,
                },
                {
                  address: '0x928e55dab735aa8260af3cedada18b5f70c72f1b',
                  symbol: 'FRONT',
                  decimals: 18,
                },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migration77.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 77,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
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
            56: {
              timestamp: 1324,
              data: {
                '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47': {
                  address: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47',
                  symbol: 'ADA',
                  decimals: 18,
                },
                '0x928e55dab735aa8260af3cedada18b5f70c72f1b': {
                  address: '0x928e55dab735aa8260af3cedada18b5f70c72f1b',
                  symbol: 'FRONT',
                  decimals: 18,
                },
              },
            },
          },
        },
      },
    });
  });
  it('should not change anything if the data is already an object', async () => {
    const oldStorage = {
      meta: {
        version: 76,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
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
    const newStorage = await migration77.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 77,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
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
  it('should correct the address keys if the object is keyed wrong', async () => {
    const oldStorage = {
      meta: {
        version: 76,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
              symbol: 'LINK',
              decimals: 18,
            },
          },
          tokensChainsCache: {
            1: {
              timestamp: 1234,
              data: {
                0: {
                  address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                  symbol: 'LINK',
                  decimals: 18,
                },
                1: {
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
    const newStorage = await migration77.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 77,
      },
      data: {
        TokenListController: {
          tokenList: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': {
              address: '0x514910771af9ca656af840dff83e8264ecf986ca',
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
