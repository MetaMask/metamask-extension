import { migrate, version } from './187';

const VERSION = version;
const oldVersion = VERSION - 1;

const sentryCaptureExceptionMock = jest.fn();
global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe(`migration #${VERSION} - remove transaction history`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: { transactions: [] },
      },
    };

    await migrate(oldState, new Set());
    expect(oldState.meta.version).toBe(VERSION);
  });

  it('skips migration if TransactionController is missing', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };
    const originalData = structuredClone(oldState.data);

    const log = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    await migrate(oldState, new Set());

    expect(log).toHaveBeenCalledWith(
      `Migration ${VERSION}: state.TransactionController not found, skipping.`,
    );
    expect(oldState.data).toEqual(originalData);
    // Should not log to Sentry
    expect(sentryCaptureExceptionMock).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('skips migration if TransactionController.transactions is missing', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
      },
    };
    const originalData = structuredClone(oldState.data);

    const warn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    await migrate(oldState, new Set());

    expect(warn).toHaveBeenCalledWith(
      `Migration ${VERSION}: state.TransactionController.transactions not found, skipping.`,
    );
    expect(oldState.data).toEqual(originalData);
    warn.mockRestore();
  });

  it('removes history and sendFlowHistory from transactions', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {
          transactions: [
            {
              id: 1,
              chainId: '0x1',
              history: [{ a: 1 }],
              sendFlowHistory: [{ b: 2 }],
            },
            {
              id: 2,
              chainId: '0x1', // no history
            },
          ],
        },
      },
    };

    await migrate(oldState, new Set());
    const expectedTransactions = {
      transactions: [
        {
          id: 1,
          chainId: '0x1',
        },
        {
          id: 2,
          chainId: '0x1',
        },
      ],
    };

    expect(oldState.data.TransactionController).toStrictEqual(
      expectedTransactions,
    );
  });

  it('leaves malformed transactions untouched', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {
          transactions: [null, 123, 'bad'],
        },
      },
    };

    await migrate(oldState, new Set());

    expect(oldState.data.TransactionController).toStrictEqual(
      oldState.data.TransactionController,
    );
  });

  it('skips migration when TransactionController is not an object', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: 99,
      },
    };
    const originalData = structuredClone(oldState.data);

    const warn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    await migrate(oldState, new Set());

    expect(warn).toHaveBeenCalledWith(
      `Migration ${VERSION}: state.TransactionController is not an object: number, skipping.`,
    );
    expect(oldState.data).toEqual(originalData);
    // Should not log to Sentry
    expect(sentryCaptureExceptionMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('captures exception when transactions is not an array', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: { transactions: 'oops' },
      },
    };

    await migrate(oldState, new Set());
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
  });
});
