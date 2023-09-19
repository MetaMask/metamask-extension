import { migrate, version } from './098';

const oldVersion = 97;
describe('migration #98', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('handles missing TransactionController', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('handles empty transactions', async () => {
    const oldState = {
      TransactionController: {
        transactions: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('handles missing state', async () => {
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: {},
    });

    expect(transformedState.data).toEqual({});
  });

  it('adds verifiedOnBlockchain in transaction based on the presence of txReceipt', async () => {
    const oldState = {
      TransactionController: {
        transactions: {
          tx1: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            txReceipt: {
              blockHash:
                '0xafa4e1fd95e429d9c6e6c7c1d282b2bd0bbeb50d0a68743e9392b9c95a06e2eb',
            },
            otherProp: 'value',
          },
          tx2: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            otherProp: 'value',
          },
          tx3: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            txReceipt: {
              blockHash:
                '0xafa4e1fd95e429d9c6e6c7c1d282b2bd0bbeb50d0a68743e9392b9c95a06e2eb',
            },
            otherProp: 'value',
          },
        },
      },
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldState,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toEqual({
      TransactionController: {
        transactions: {
          tx1: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            txReceipt: {
              blockHash:
                '0xafa4e1fd95e429d9c6e6c7c1d282b2bd0bbeb50d0a68743e9392b9c95a06e2eb',
            },
            otherProp: 'value',
            verifiedOnBlockchain: true,
          },
          tx2: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            otherProp: 'value',
            verifiedOnBlockchain: false,
          },
          tx3: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            txReceipt: {
              blockHash:
                '0xafa4e1fd95e429d9c6e6c7c1d282b2bd0bbeb50d0a68743e9392b9c95a06e2eb',
            },
            otherProp: 'value',
            verifiedOnBlockchain: true,
          },
        },
      },
    });
  });
});
