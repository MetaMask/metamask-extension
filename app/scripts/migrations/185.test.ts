import { migrate, version } from './185';

const VERSION = version;
const oldVersion = VERSION - 1;

const sentryCaptureExceptionMock = jest.fn();
global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe(`migration #${VERSION} - reset transaction history fields`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: { transactions: [] },
      },
    };

    const newState = await migrate(oldState);
    expect(newState.meta.version).toBe(VERSION);
  });

  it('skips migration if TransactionController.transactions is missing', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
      },
    };

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {
      // do nothing
    });
    const newState = await migrate(oldState);

    expect(warn).toHaveBeenCalledWith(
      `Migration ${VERSION}: state.TransactionController.transactions not found, skipping.`,
    );
    expect(newState.data).toStrictEqual(oldState.data);
  });

  it('sets history and sendFlowHistory to empty arrays on each transaction', async () => {
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
              chainId: '0x1', // no history fields
            },
          ],
        },
      },
    };

    const newState = await migrate(oldState);

    const expectedTransactions = {
      transactions: [
        {
          id: 1,
          chainId: '0x1',
          history: [],
          sendFlowHistory: [],
        },
        {
          id: 2,
          chainId: '0x1',
          history: [],
          sendFlowHistory: [],
        },
      ],
    };

    expect(newState.data.TransactionController).toStrictEqual(
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

    const newState = await migrate(oldState);

    expect(newState.data.TransactionController).toStrictEqual(
      oldState.data.TransactionController,
    );
  });

  it('captures exception when TransactionController is not an object', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: 99,
      },
    };

    await migrate(oldState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
  });

  it('captures exception when transactions is not an array', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: { transactions: 'oops' },
      },
    };

    await migrate(oldState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
  });
});
