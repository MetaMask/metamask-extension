import { migrate, version } from './163';

const oldVersion = 162;

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

  describe(`migration #${version}`, () => {
    it('does nothing when TokenListController state is present', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {
            someOtherProp: true,
          },
          TokenListController: {
            anotherProp: 'value',
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
    it('removes tokens, detectedTokens, and ignoredTokens from TokensController when tokenListController state is not present', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {
            tokens: [1, 2],
            detectedTokens: ['a', 'b'],
            ignoredTokens: { some: 'value' },
            someOtherProp: true,
          },
          OtherController: { key: 'value' },
        },
      };

      const expectedData = {
        TokensController: {
          someOtherProp: true,
        },
        OtherController: { key: 'value' },
      };

      const newStorage = await migrate(oldStorage);
      expect(global.sentry.captureException).not.toHaveBeenCalled();
      expect(newStorage.meta).toStrictEqual({ version });
      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('logs an error and returns the original state if TokensController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          OtherController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(`Migration ${version}: TokensController not found.`),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('logs an error and returns the original state if TokensController is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: 'not an object',
          TokenListController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: TokensController is type 'string', expected object.`,
        ),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  });
});
