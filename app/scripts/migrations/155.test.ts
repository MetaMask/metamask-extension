import { migrate, version } from './155';

const oldVersion = 151;

describe(`migration #${version}`, () => {
  // Set up a global sentry mock before each test.
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    // Clean up the global sentry after each test.
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('bridgeStatusState removal', () => {
    it('removes bridgeStatusState from BridgeStatusController', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          BridgeStatusController: {
            bridgeStatusState: {
              metaId: {
                id: 'metaId',
                quote: {
                  srcChainId: '0x1',
                  destChainId: '0x2',
                  srcAsset: { chainId: '0x3', address: '0x4' },
                  destAsset: { chainId: '0x3', address: '0x4' },
                },
              },
            },
          },
          TokenListController: {
            tokenList: { foo: 'bar' },
            anotherProp: 'value',
          },
          OtherController: { key: 'value' },
        },
      };

      const expectedData = {
        BridgeStatusController: {
          metaId: {
            id: 'metaId',
            quote: {
              destAsset: {
                address: '0x4',
                chainId: '0x3',
              },
              destChainId: '0x2',
              srcAsset: {
                address: '0x4',
                chainId: '0x3',
              },
              srcChainId: '0x1',
            },
          },
        },
        TokenListController: {
          tokenList: { foo: 'bar' },
          anotherProp: 'value',
        },
        OtherController: { key: 'value' },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.meta).toStrictEqual({ version });
      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('returns the original state if BridgeStatusController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          OtherController: {},
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('returns the original state if BridgeStatusController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          BridgeStatusController: 'not an object',
          TokenListController: {},
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  });
});
