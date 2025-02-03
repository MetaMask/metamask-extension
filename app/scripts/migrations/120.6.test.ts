import { cloneDeep } from 'lodash';
import { migrate, version } from './120.6';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 120.5;

describe('migration #120.6', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('returns state unchanged if TransactionController state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorageDataClone);
  });

  it('reports error and returns state unchanged if TransactionController state is invalid', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: 'invalid',
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      `Migration ${version}: Invalid TransactionController state of type 'string'`,
    );
    expect(newStorage.data).toStrictEqual(oldStorageDataClone);
  });

  it('returns state unchanged if transactions are missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: {},
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorageDataClone);
  });

  it('removes transactions property if it is invalid', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: {
          transactions: 'invalid',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
      TransactionController: {},
    });
  });

  it('reports error and returns state unchanged if there is an invalid transaction', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: {
          transactions: [
            {}, // empty object is valid for the purposes of this migration
            'invalid',
            {},
          ],
        },
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      `Migration ${version}: Invalid transaction of type 'string'`,
    );
    expect(newStorage.data).toStrictEqual(oldStorageDataClone);
  });

  it('reports error and returns state unchanged if there is a transaction with an invalid history property', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: {
          transactions: [
            {}, // empty object is valid for the purposes of this migration
            {
              history: 'invalid',
            },
            {},
          ],
        },
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      `Migration ${version}: Invalid transaction history of type 'string'`,
    );
    expect(newStorage.data).toStrictEqual(oldStorageDataClone);
  });

  it('returns state unchanged if there are no transactions', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: {
          transactions: [],
        },
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorageDataClone);
  });

  it('returns state unchanged if there are no transactions with history', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: {
          transactions: [{}, {}, {}],
        },
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorageDataClone);
  });

  it('returns state unchanged if there are no transactions with history exceeding max size', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: {
          transactions: [
            {
              history: [...Array(99).keys()],
            },
            {
              history: [...Array(100).keys()],
            },
            {
              history: [],
            },
          ],
        },
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorageDataClone);
  });

  it('trims histories exceeding max size', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {},
        TransactionController: {
          transactions: [
            {
              history: [...Array(99).keys()],
            },
            {
              history: [...Array(100).keys()],
            },
            {
              history: [...Array(101).keys()],
            },
            {
              history: [...Array(1000).keys()],
            },
          ],
        },
      },
    };
    const oldStorageDataClone = cloneDeep(oldStorage.data);

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      ...oldStorageDataClone,
      TransactionController: {
        transactions: [
          {
            history: [...Array(99).keys()],
          },
          {
            history: [...Array(100).keys()],
          },
          {
            history: [...Array(100).keys()],
          },
          {
            history: [...Array(100).keys()],
          },
        ],
      },
    });
  });
});
