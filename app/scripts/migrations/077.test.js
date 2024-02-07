import { cloneDeep } from 'lodash';
import migration77 from './077';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  startSession: jest.fn(),
  endSession: jest.fn(),
  toggleSession: jest.fn(),
  captureException: sentryCaptureExceptionMock,
};

describe('migration #77', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 76,
      },
      data: {},
    };

    const newStorage = await migration77.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 77,
    });
  });

  it('should return state unchanged if token list controller is missing', async () => {
    const oldStorage = {
      meta: {
        version: 76,
      },
      data: {
        Foo: {
          bar: 'baz',
        },
      },
    };

    const newStorage = await migration77.migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should capture an exception if the TokenListController state is invalid', async () => {
    const oldStorage = {
      meta: {
        version: 76,
      },
      data: {
        TokenListController: 'test',
      },
    };

    await migration77.migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokenListController is string`),
    );
  });

  it('should return state unchanged if tokenChainsCache is missing', async () => {
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
        },
      },
    };

    const newStorage = await migration77.migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
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
  it('should set data to an empty object if it is undefined', async () => {
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
              data: undefined,
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
              data: {},
            },
          },
        },
      },
    });
  });
  it('should set data to an empty object if it is null', async () => {
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
              data: null,
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
              data: {},
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

  describe('migration #77 supplements', () => {
    describe('state transformation to ahead of migration 82', () => {
      it('should delete frequentRpcListDetail from the PreferencesController state, if the user already has networkConfigurations in NetworkController state, without interferring with the rest of the migration', async () => {
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
            PreferencesController: {
              frequentRpcListDetail: ['foobar'],
              fizz: 'buzz',
            },
            NetworkController: {
              networkConfigurations: { foo: 'bar' },
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
            PreferencesController: {
              fizz: 'buzz',
            },
            NetworkController: {
              networkConfigurations: { foo: 'bar' },
            },
          },
        });
      });

      it('should not delete frequentRpcListDetail from the PreferencesController state if there are no networkConfigurations in NetworkController state', async () => {
        const oldStorage = {
          meta: {
            version: 76,
          },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            PreferencesController: {
              frequentRpcListDetail: ['foobar'],
              fizz: 'buzz',
            },
            NetworkController: {
              foobar: { foo: 'bar' },
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
              tokensChainsCache: {},
            },
            PreferencesController: {
              frequentRpcListDetail: ['foobar'],
              fizz: 'buzz',
            },
            NetworkController: {
              foobar: { foo: 'bar' },
            },
          },
        });
      });
    });

    describe('state transformation to ahead of migration 84', () => {
      it('should delete `network` from the NetworkController state, if the user already has `networkId` in NetworkController state, without interferring with the rest of the migration', async () => {
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
            NetworkController: {
              network: 'foobar',
              networkId: 'fizzbuzz',
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
            NetworkController: {
              networkId: 'fizzbuzz',
            },
          },
        });
      });

      it('should not delete `network` from the NetworkController state, if there is no `networkId` in NetworkController state', async () => {
        const oldStorage = {
          meta: {
            version: 76,
          },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            PreferencesController: {
              frequentRpcListDetail: ['foobar'],
              fizz: 'buzz',
            },
            NetworkController: {
              network: 'foobar',
              foobar: { foo: 'bar' },
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
              tokensChainsCache: {},
            },
            PreferencesController: {
              frequentRpcListDetail: ['foobar'],
              fizz: 'buzz',
            },
            NetworkController: {
              network: 'foobar',
              foobar: { foo: 'bar' },
            },
          },
        });
      });
    });

    describe('state transformation to ahead of migration 86', () => {
      it('should delete `provider` from the NetworkController state, if the user already has `providerConfig` in NetworkController state, without interferring with the rest of the migration', async () => {
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
            NetworkController: {
              provider: { foo: 'bar ' },
              providerConfig: { fizz: 'buzz' },
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
            NetworkController: {
              providerConfig: { fizz: 'buzz' },
            },
          },
        });
      });

      it('should not delete `provider` from the NetworkController state, if there is no `providerConfig` in NetworkController state', async () => {
        const oldStorage = {
          meta: {
            version: 76,
          },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            PreferencesController: {
              frequentRpcListDetail: ['foobar'],
              fizz: 'buzz',
            },
            NetworkController: {
              provider: { foo: 'bar ' },
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
              tokensChainsCache: {},
            },
            PreferencesController: {
              frequentRpcListDetail: ['foobar'],
              fizz: 'buzz',
            },
            NetworkController: {
              provider: { foo: 'bar ' },
            },
          },
        });
      });
    });

    describe('state transformation to ahead of migration 88', () => {
      it('deletes entries in NftController.allNftContracts that have decimal chain ID keys only if any chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 76 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            NftController: {
              allNftContracts: {
                '0x111': {
                  16: [
                    {
                      name: 'Contract 1',
                      address: '0xaaa',
                    },
                  ],
                  '0x20': [
                    {
                      name: 'Contract 2',
                      address: '0xbbb',
                    },
                  ],
                  32: [
                    {
                      name: 'Contract 2',
                      address: '0xbbb',
                    },
                  ],
                },
                '0x222': {
                  64: [
                    {
                      name: 'Contract 3',
                      address: '0xccc',
                    },
                  ],
                  '0x40': [
                    {
                      name: 'Contract 3',
                      address: '0xccc',
                    },
                  ],
                  128: [
                    {
                      name: 'Contract 4',
                      address: '0xddd',
                    },
                  ],
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          NftController: {
            allNftContracts: {
              '0x111': {
                '0x20': [
                  {
                    name: 'Contract 2',
                    address: '0xbbb',
                  },
                ],
              },
              '0x222': {
                '0x40': [
                  {
                    name: 'Contract 3',
                    address: '0xccc',
                  },
                ],
              },
            },
          },
        });
      });

      it('does not delete entries in NftController.allNftContracts that have decimal chain ID keys if no other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 76 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            NftController: {
              allNftContracts: {
                '0x333': {
                  256: [
                    {
                      name: 'Contract 3',
                      address: '0xccc',
                    },
                  ],
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          NftController: {
            allNftContracts: {
              '0x333': {
                256: [
                  {
                    name: 'Contract 3',
                    address: '0xccc',
                  },
                ],
              },
            },
          },
        });
      });

      it('deletes entries in NftController.allNfts that have decimal chain ID keys only if any chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 76 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            NftController: {
              allNfts: {
                '0x111': {
                  16: [
                    {
                      name: 'NFT 1',
                      description: 'Description for NFT 1',
                      image: 'nft1.jpg',
                      standard: 'ERC721',
                      tokenId: '1',
                      address: '0xaaa',
                    },
                  ],
                  32: [
                    {
                      name: 'NFT 2',
                      description: 'Description for NFT 2',
                      image: 'nft2.jpg',
                      standard: 'ERC721',
                      tokenId: '2',
                      address: '0xbbb',
                    },
                  ],
                  '0x20': [
                    {
                      name: 'NFT 2',
                      description: 'Description for NFT 2',
                      image: 'nft2.jpg',
                      standard: 'ERC721',
                      tokenId: '2',
                      address: '0xbbb',
                    },
                  ],
                },
                '0x222': {
                  64: [
                    {
                      name: 'NFT 3',
                      description: 'Description for NFT 3',
                      image: 'nft3.jpg',
                      standard: 'ERC721',
                      tokenId: '3',
                      address: '0xccc',
                    },
                  ],
                  '0x40': [
                    {
                      name: 'NFT 3',
                      description: 'Description for NFT 3',
                      image: 'nft3.jpg',
                      standard: 'ERC721',
                      tokenId: '3',
                      address: '0xccc',
                    },
                  ],
                  128: [
                    {
                      name: 'NFT 4',
                      description: 'Description for NFT 4',
                      image: 'nft4.jpg',
                      standard: 'ERC721',
                      tokenId: '4',
                      address: '0xddd',
                    },
                  ],
                },
                '0x333': {
                  256: [
                    {
                      name: 'NFT 3',
                      description: 'Description for NFT 3',
                      image: 'nft3.jpg',
                      standard: 'ERC721',
                      tokenId: '3',
                      address: '0xccc',
                    },
                  ],
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          NftController: {
            allNfts: {
              '0x111': {
                '0x20': [
                  {
                    name: 'NFT 2',
                    description: 'Description for NFT 2',
                    image: 'nft2.jpg',
                    standard: 'ERC721',
                    tokenId: '2',
                    address: '0xbbb',
                  },
                ],
              },
              '0x222': {
                '0x40': [
                  {
                    name: 'NFT 3',
                    description: 'Description for NFT 3',
                    image: 'nft3.jpg',
                    standard: 'ERC721',
                    tokenId: '3',
                    address: '0xccc',
                  },
                ],
              },
              '0x333': {
                256: [
                  {
                    name: 'NFT 3',
                    description: 'Description for NFT 3',
                    image: 'nft3.jpg',
                    standard: 'ERC721',
                    tokenId: '3',
                    address: '0xccc',
                  },
                ],
              },
            },
          },
        });
      });

      it('does not delete entries in NftController.allNfts that have decimal chain ID keys if no other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 76 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            NftController: {
              allNfts: {
                '0x333': {
                  256: [
                    {
                      name: 'NFT 3',
                      description: 'Description for NFT 3',
                      image: 'nft3.jpg',
                      standard: 'ERC721',
                      tokenId: '3',
                      address: '0xccc',
                    },
                  ],
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          NftController: {
            allNfts: {
              '0x333': {
                256: [
                  {
                    name: 'NFT 3',
                    description: 'Description for NFT 3',
                    image: 'nft3.jpg',
                    standard: 'ERC721',
                    tokenId: '3',
                    address: '0xccc',
                  },
                ],
              },
            },
          },
        });
      });

      it('deletes entries in TokenListController.tokensChainsCache that have decimal chain ID keys only if any other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 76 },
          data: {
            TokenListController: {
              tokensChainsCache: {
                16: {
                  timestamp: 111111,
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
                '0x10': {
                  timestamp: 111111,
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
                32: {
                  timestamp: 222222,
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

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {
              '0x10': {
                timestamp: 111111,
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
        });
      });
      it('does not delete entries in TokenListController.tokensChainsCache that have decimal chain ID keys if no other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 76 },
          data: {
            TokenListController: {
              tokensChainsCache: {
                16: {
                  timestamp: 111111,
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
                32: {
                  timestamp: 222222,
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

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {
              16: {
                timestamp: 111111,
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
              32: {
                timestamp: 222222,
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
        });
      });
      it('deletes entries in TokensController.allTokens that have decimal chain IDs only if any other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 76 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            TokensController: {
              allTokens: {
                16: {
                  '0x111': [
                    {
                      address: '0xaaa',
                      decimals: 1,
                      symbol: 'TEST1',
                    },
                  ],
                },
                '0x10': {
                  '0x111': [
                    {
                      address: '0xaaa',
                      decimals: 1,
                      symbol: 'TEST1',
                    },
                  ],
                },
                32: {
                  '0x222': [
                    {
                      address: '0xbbb',
                      decimals: 1,
                      symbol: 'TEST2',
                    },
                  ],
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          TokensController: {
            allTokens: {
              '0x10': {
                '0x111': [
                  {
                    address: '0xaaa',
                    decimals: 1,
                    symbol: 'TEST1',
                  },
                ],
              },
            },
          },
        });
      });

      it('does not delete entries in TokensController.allTokens that have decimal chain IDs if no other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 76 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            TokensController: {
              allTokens: {
                16: {
                  '0x111': [
                    {
                      address: '0xaaa',
                      decimals: 1,
                      symbol: 'TEST1',
                    },
                  ],
                },
                32: {
                  '0x222': [
                    {
                      address: '0xbbb',
                      decimals: 1,
                      symbol: 'TEST2',
                    },
                  ],
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          TokensController: {
            allTokens: {
              16: {
                '0x111': [
                  {
                    address: '0xaaa',
                    decimals: 1,
                    symbol: 'TEST1',
                  },
                ],
              },
              32: {
                '0x222': [
                  {
                    address: '0xbbb',
                    decimals: 1,
                    symbol: 'TEST2',
                  },
                ],
              },
            },
          },
        });
      });

      it('deletes entries in TokensController.allIgnoredTokens that have decimal chain IDs only if any other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 87 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            TokensController: {
              allIgnoredTokens: {
                16: {
                  '0x1': {
                    '0x111': ['0xaaa'],
                  },
                },
                '0x10': {
                  '0x1': {
                    '0x222': ['0xbbb'],
                  },
                },
                32: {
                  '0x2': {
                    '0x222': ['0xbbb'],
                  },
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          TokensController: {
            allIgnoredTokens: {
              '0x10': {
                '0x1': {
                  '0x222': ['0xbbb'],
                },
              },
            },
          },
        });
      });

      it('does not delete entries in TokensController.allIgnoredTokens that have decimal chain IDs if no other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 87 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            TokensController: {
              allIgnoredTokens: {
                16: {
                  '0x1': {
                    '0x111': ['0xaaa'],
                  },
                },
                32: {
                  '0x2': {
                    '0x222': ['0xbbb'],
                  },
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          TokensController: {
            allIgnoredTokens: {
              16: {
                '0x1': {
                  '0x111': ['0xaaa'],
                },
              },
              32: {
                '0x2': {
                  '0x222': ['0xbbb'],
                },
              },
            },
          },
        });
      });

      it('deletes entries in TokensController.allDetectedTokens that have decimal chain IDs only if any other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 87 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            TokensController: {
              allDetectedTokens: {
                16: {
                  '0x1': {
                    '0x111': ['0xaaa'],
                  },
                },
                '0x10': {
                  '0x1': {
                    '0x222': ['0xbbb'],
                  },
                },
                32: {
                  '0x2': {
                    '0x222': ['0xbbb'],
                  },
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          TokensController: {
            allDetectedTokens: {
              '0x10': {
                '0x1': {
                  '0x222': ['0xbbb'],
                },
              },
            },
          },
        });
      });

      it('does not delete entries in TokensController.allDetectedTokens that have decimal chain IDs if no other chain ID keys are hex', async () => {
        const oldStorage = {
          meta: { version: 87 },
          data: {
            TokenListController: {
              tokensChainsCache: {},
            },
            TokensController: {
              allDetectedTokens: {
                16: {
                  '0x1': {
                    '0x111': ['0xaaa'],
                  },
                },
                32: {
                  '0x2': {
                    '0x222': ['0xbbb'],
                  },
                },
              },
            },
          },
        };

        const newStorage = await migration77.migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          TokenListController: {
            tokensChainsCache: {},
          },
          TokensController: {
            allDetectedTokens: {
              16: {
                '0x1': {
                  '0x111': ['0xaaa'],
                },
              },
              32: {
                '0x2': {
                  '0x222': ['0xbbb'],
                },
              },
            },
          },
        });
      });
    });
  });
});
