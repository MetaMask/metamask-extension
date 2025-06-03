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

    it('does not capture sentry error and returns the original state if TokensController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          OtherController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).not.toHaveBeenCalled();
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('Captures sentry error and returns the original state if TokensController exists but is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: 'not an object',
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

    it('does not capture sentry error and returns the original state if tokenListController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).not.toHaveBeenCalled();
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('Captures sentry error and returns the original state if TokenListController exists but is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {},
          TokenListController: 'not an object',
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: TokenListController is type 'string', expected object.`,
        ),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
    it('does nothing when TokenListController and TokensController state is present without tokens, detectedTokens, ignoredTokens or tokenList', async () => {
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
    it('removes tokens, detectedTokens, and ignoredTokens from TokensController and tokenList from TokenListController', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          TokensController: {
            tokens: [1, 2],
            detectedTokens: ['a', 'b'],
            ignoredTokens: { some: 'value' },
            someOtherProp: true,
          },
          TokenListController: {
            tokenList: { foo: 'bar' },
            anotherProp: 'value',
          },
          OtherController: { key: 'value' },
        },
      };

      const expectedData = {
        TokensController: {
          someOtherProp: true,
        },
        TokenListController: {
          anotherProp: 'value',
        },
        OtherController: { key: 'value' },
      };

      const newStorage = await migrate(oldStorage);
      expect(global.sentry.captureException).not.toHaveBeenCalled();
      expect(newStorage.meta).toStrictEqual({ version });
      expect(newStorage.data).toStrictEqual(expectedData);
    });


  });
});
