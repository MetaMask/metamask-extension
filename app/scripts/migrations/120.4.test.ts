import { cloneDeep } from 'lodash';
import { migrate, version } from './120.4';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 120.3;

describe('migration #120.4', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('CurrencyController', () => {
    it('does nothing if CurrencyController state is not set', async () => {
      const oldState = {
        OtherController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('captures an error and leaves state unchanged if CurrencyController state is corrupted', async () => {
      const oldState = {
        CurrencyController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: Invalid CurrencyController state of type 'string'`,
        ),
      );
    });

    it('deletes obsolete properties from the CurrencyController state', async () => {
      const oldState = {
        CurrencyController: {
          conversionDate: 'test',
          conversionRate: 'test',
          nativeCurrency: 'test',
          pendingCurrentCurrency: 'test',
          pendingNativeCurrency: 'test',
          usdConversionRate: 'test',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({ CurrencyController: {} });
    });

    it('does not delete non-obsolete properties from the CurrencyController state', async () => {
      const oldState = {
        CurrencyController: {
          currencyRates: { test: 123 },
          conversionRate: 'test',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({
        CurrencyController: { currencyRates: { test: 123 } },
      });
    });
  });

  describe('PhishingController', () => {
    it('does nothing if PhishingController state is not set', async () => {
      const oldState = {
        OtherController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('captures an error and leaves state unchanged if PhishingController state is corrupted', async () => {
      const oldState = {
        PhishingController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: Invalid PhishingController state of type 'string'`,
        ),
      );
    });

    it('deletes obsolete properties from the PhishingController state', async () => {
      const oldState = {
        PhishingController: {
          phishing: 'test',
          lastFetched: 'test',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({ PhishingController: {} });
    });

    it('does not delete non-obsolete properties from the PhishingController state', async () => {
      const oldState = {
        PhishingController: {
          phishing: 'test',
          phishingLists: 'test',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({
        PhishingController: { phishingLists: 'test' },
      });
    });
  });

  describe('NetworkController', () => {
    it('does nothing if NetworkController state is not set', async () => {
      const oldState = {
        OtherController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('captures an error and leaves state unchanged if NetworkController state is corrupted', async () => {
      const oldState = {
        NetworkController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: Invalid NetworkController state of type 'string'`,
        ),
      );
    });

    it('deletes obsolete properties from the NetworkController state', async () => {
      const oldState = {
        NetworkController: {
          network: 'test',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({ NetworkController: {} });
    });

    it('does not delete non-obsolete properties from the NetworkController state', async () => {
      const oldState = {
        NetworkController: {
          network: 'test',
          selectedNetworkClientId: 'test',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({
        NetworkController: { selectedNetworkClientId: 'test' },
      });
    });
  });
});
