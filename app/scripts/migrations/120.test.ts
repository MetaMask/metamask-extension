import { migrate, version } from './120';

const oldVersion = 119;

describe('migration #120', () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('deletes the deprecated token rates controller fields', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        TokenRatesController: {
          contractExchangeRates: {
            '0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4': 0.00001142055192565137,
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 1.000125,
          },
          contractExchangeRatesByChainId: {
            '0x1': {
              ETH: {
                '0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4': 0.00001142055192565137,
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 1.000125,
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.TokenRatesController).toStrictEqual({});
  });
});
