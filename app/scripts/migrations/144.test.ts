import { migrate, version } from './144';

const oldVersion = 143;

const DEFAULT_CURRENCY = 'usd';
const VALID_CURRENCY = 'eur';
const INVALID_CURRENCY = 'INVALID_CURRENCY';

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('does nothing if CurrencyController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {},
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({});
    });

    it('does nothing if CurrencyController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          CurrencyController: 'invalidData',
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('sets currentCurrency to "USD" if it is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          CurrencyController: {},
        },
      };
      const expectedData = {
        CurrencyController: {
          currentCurrency: DEFAULT_CURRENCY,
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('sets currentCurrency to "USD" if it is invalid', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          CurrencyController: {
            currentCurrency: INVALID_CURRENCY,
          },
        },
      };
      const expectedData = {
        CurrencyController: {
          currentCurrency: DEFAULT_CURRENCY,
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('does nothing if currentCurrency is valid', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          CurrencyController: {
            currentCurrency: VALID_CURRENCY,
          },
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  });
});
