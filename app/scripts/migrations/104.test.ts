import { migrate, version } from './104';

const oldVersion = 103;

describe('migration #104', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if no TransactionController state', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('sets empty array if no transactions', async () => {
    const oldState = {
      TransactionController: {
        transactions: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      TransactionController: {
        transactions: [],
      },
    });
  });

  it('sets array if existing transactions', async () => {
    const oldState = {
      TransactionController: {
        transactions: {
          testId1: {
            id: 'testId1',
            status: 'submitted',
          },
          testId2: {
            id: 'testId2',
            status: 'unapproved',
          },
          testId3: {
            id: 'testId3',
            status: 'confirmed',
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      TransactionController: {
        transactions: [
          {
            id: 'testId1',
            status: 'submitted',
          },
          {
            id: 'testId2',
            status: 'unapproved',
          },
          {
            id: 'testId3',
            status: 'confirmed',
          },
        ],
      },
    });
  });

  it('sorts array by descending time', async () => {
    const oldState = {
      TransactionController: {
        transactions: {
          testId1: {
            id: 'testId1',
            status: 'submitted',
            time: 1,
          },
          testId2: {
            id: 'testId2',
            status: 'unapproved',
            time: 3,
          },
          testId3: {
            id: 'testId3',
            status: 'failed',
          },
          testId4: {
            id: 'testId4',
            status: 'confirmed',
            time: 2,
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      TransactionController: {
        transactions: [
          {
            id: 'testId2',
            status: 'unapproved',
            time: 3,
          },
          {
            id: 'testId4',
            status: 'confirmed',
            time: 2,
          },
          {
            id: 'testId1',
            status: 'submitted',
            time: 1,
          },
          {
            id: 'testId3',
            status: 'failed',
          },
        ],
      },
    });
  });
});
