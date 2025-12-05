import { cloneDeep } from 'lodash';
import { migrate, version } from './185';

const VERSION = version;
const oldVersion = 184;

describe(`migration #${VERSION}`, () => {
  let mockedCaptureException: jest.Mock;

  beforeEach(() => {
    mockedCaptureException = jest.fn();
    global.sentry = { captureException: mockedCaptureException };
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {
          currencyRates: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: VERSION });
  });

  it('does nothing if CurrencyController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const mockWarn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    const newStorage = await migrate(oldStorage);

    expect(mockWarn).toHaveBeenCalledWith(
      `Migration ${VERSION}: CurrencyController not found.`,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('captures exception if CurrencyController is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: 'invalid',
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${VERSION}: CurrencyController is not an object: string`,
      ),
    );
  });

  it('does nothing if currencyRates is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {},
      },
    };

    const mockWarn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    const newStorage = await migrate(oldStorage);

    expect(mockWarn).toHaveBeenCalledWith(
      `Migration ${VERSION}: currencyRates not found in CurrencyController.`,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('captures exception if currencyRates is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {
          currencyRates: 'invalid',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${VERSION}: currencyRates is not an object: string`,
      ),
    );
  });

  it('rounds conversionRate with more than 9 decimal places', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {
          currencyRates: {
            ETH: {
              conversionRate: 12.9848883888222, // 13 decimal places
            },
            BTC: {
              conversionRate: 50000.123456789012, // 12 decimal places
            },
          },
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        CurrencyController: {
          currencyRates: {
            ETH: {
              conversionRate: 12.984888389, // Rounded to 9 decimal places
            },
            BTC: {
              conversionRate: 50000.123456789, // Rounded to 9 decimal places
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });

  it('does not modify conversionRate with 9 or fewer decimal places', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {
          currencyRates: {
            ETH: {
              conversionRate: 12.123456789, // Exactly 9 decimal places
            },
            BTC: {
              conversionRate: 50000.12345, // 5 decimal places
            },
            USDC: {
              conversionRate: 1, // No decimal places
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Data should remain unchanged
    expect(newStorage.data).toStrictEqual({
      CurrencyController: {
        currencyRates: {
          ETH: {
            conversionRate: 12.123456789,
          },
          BTC: {
            conversionRate: 50000.12345,
          },
          USDC: {
            conversionRate: 1,
          },
        },
      },
    });
  });

  it('handles mixed currency rate data with some needing rounding', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {
          currencyRates: {
            ETH: {
              conversionRate: 2500.1234567890123, // Needs rounding
            },
            BTC: {
              conversionRate: 45000.12345, // No rounding needed
            },
            INVALID: {
              // Missing conversionRate property
            },
            USDC: {
              conversionRate: '1.0', // String value, should be ignored
            },
          },
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        CurrencyController: {
          currencyRates: {
            ETH: {
              conversionRate: 2500.123456789, // Rounded
            },
            BTC: {
              conversionRate: 45000.12345, // Unchanged
            },
            INVALID: {
              // Unchanged
            },
            USDC: {
              conversionRate: '1.0', // Unchanged (string)
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });

  it('handles empty currencyRates object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {
          currencyRates: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('handles edge case with very small numbers', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {
          currencyRates: {
            SMALLCOIN: {
              conversionRate: 0.0000000001234567890123, // Very small with many decimals
            },
          },
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        CurrencyController: {
          currencyRates: {
            SMALLCOIN: {
              conversionRate: 0.000000000, // Rounded to 9 decimal places
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });

  it('preserves other properties in CurrencyController', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        CurrencyController: {
          currentCurrency: 'usd',
          currencyRates: {
            ETH: {
              conversionRate: 2500.1234567890123,
              conversionDate: 1234567890,
            },
          },
          otherProperty: 'should be preserved',
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        CurrencyController: {
          currentCurrency: 'usd',
          currencyRates: {
            ETH: {
              conversionRate: 2500.123456789, // Rounded
              conversionDate: 1234567890, // Preserved
            },
          },
          otherProperty: 'should be preserved', // Preserved
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });
});
