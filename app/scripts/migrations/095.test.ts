import { migrate } from './095';

const INCOMING_TRANSACTION_MOCK = {
  blockNumber: '1',
  chainId: '0x539',
  hash: '0xf1af8286e4fa47578c2aec5f08c108290643df978ebc766d72d88476eee90bab',
  id: 1,
  metamaskNetworkId: '1337',
  status: 'confirmed',
  time: 1671635520000,
  txParams: {
    from: '0xc87261ba337be737fa744f50e7aaf4a920bdfcd6',
    gas: '0x5208',
    gasPrice: '0x329af9707',
    to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
    value: '0xDE0B6B3A7640000',
  },
  type: 'incoming',
};

const INCOMING_TRANSACTION_2_MOCK = {
  ...INCOMING_TRANSACTION_MOCK,
  blockNumber: '2',
  id: 2,
  chainId: '0x540',
  txParams: {
    ...INCOMING_TRANSACTION_MOCK.txParams,
    to: '0x2',
  },
};

const TRANSACTION_MOCK = {
  ...INCOMING_TRANSACTION_MOCK,
  blockNumber: '3',
  id: 3,
  type: 'contractInteraction',
};

describe('migration #95', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 94 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 95 });
  });

  it('does nothing if no IncomingTransactionsController state', async () => {
    const oldData = {
      some: 'data',
    };

    const oldStorage = {
      meta: { version: 94 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('removes IncomingTransactionsController state', async () => {
    const oldData = {
      some: 'data',
      IncomingTransactionsController: {
        incomingTransactions: {
          [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
        },
        incomingTxLastFetchedBlockByChainId: {
          '0x5': 1234,
        },
      },
    };

    const oldStorage = {
      meta: { version: 94 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      some: oldData.some,
      TransactionController: expect.any(Object),
    });
  });

  describe('moves incoming transactions', () => {
    it('if no TransactionController state', async () => {
      const oldData = {
        some: 'data',
        IncomingTransactionsController: {
          incomingTransactions: {
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: INCOMING_TRANSACTION_2_MOCK,
          },
        },
      };

      const oldStorage = {
        meta: { version: 94 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        some: oldData.some,
        TransactionController: {
          transactions: {
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: INCOMING_TRANSACTION_2_MOCK,
          },
          lastFetchedBlockNumbers: expect.any(Object),
        },
      });
    });

    it('if existing TransactionController state', async () => {
      const oldData = {
        some: 'data',
        IncomingTransactionsController: {
          incomingTransactions: {
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: INCOMING_TRANSACTION_2_MOCK,
          },
        },
        TransactionController: {
          transactions: {
            [TRANSACTION_MOCK.id]: TRANSACTION_MOCK,
          },
        },
      };

      const oldStorage = {
        meta: { version: 94 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        some: oldData.some,
        TransactionController: {
          transactions: {
            ...oldData.TransactionController.transactions,
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: INCOMING_TRANSACTION_2_MOCK,
          },
          lastFetchedBlockNumbers: expect.any(Object),
        },
      });
    });

    it.each([
      ['undefined', undefined],
      ['empty', {}],
    ])(
      'does nothing if incoming transactions %s',
      async (_title, incomingTransactions) => {
        const oldData = {
          some: 'data',
          IncomingTransactionsController: {
            incomingTransactions,
          },
          TransactionController: {
            transactions: {
              [TRANSACTION_MOCK.id]: TRANSACTION_MOCK,
            },
          },
        };

        const oldStorage = {
          meta: { version: 94 },
          data: oldData,
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual({
          some: oldData.some,
          TransactionController: oldData.TransactionController,
        });
      },
    );
  });

  describe('generates last fetched block numbers', () => {
    it('if incoming transactions have chain ID, block number, and to address', async () => {
      const oldData = {
        some: 'data',
        IncomingTransactionsController: {
          incomingTransactions: {
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: INCOMING_TRANSACTION_2_MOCK,
          },
        },
      };

      const oldStorage = {
        meta: { version: 94 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        some: oldData.some,
        TransactionController: {
          transactions: expect.any(Object),
          lastFetchedBlockNumbers: {
            [`${INCOMING_TRANSACTION_MOCK.chainId}#${INCOMING_TRANSACTION_MOCK.txParams.to}`]:
              parseInt(INCOMING_TRANSACTION_MOCK.blockNumber, 10),
            [`${INCOMING_TRANSACTION_2_MOCK.chainId}#${INCOMING_TRANSACTION_2_MOCK.txParams.to}`]:
              parseInt(INCOMING_TRANSACTION_2_MOCK.blockNumber, 10),
          },
        },
      });
    });

    it('using highest block number for each chain ID and to address', async () => {
      const oldData = {
        some: 'data',
        IncomingTransactionsController: {
          incomingTransactions: {
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: {
              ...INCOMING_TRANSACTION_2_MOCK,
              chainId: INCOMING_TRANSACTION_MOCK.chainId,
              txParams: {
                ...INCOMING_TRANSACTION_2_MOCK.txParams,
                to: INCOMING_TRANSACTION_MOCK.txParams.to,
              },
            },
          },
        },
      };

      const oldStorage = {
        meta: { version: 94 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        some: oldData.some,
        TransactionController: {
          transactions: expect.any(Object),
          lastFetchedBlockNumbers: {
            [`${INCOMING_TRANSACTION_MOCK.chainId}#${INCOMING_TRANSACTION_MOCK.txParams.to}`]:
              parseInt(INCOMING_TRANSACTION_2_MOCK.blockNumber, 10),
          },
        },
      });
    });

    it('ignoring incoming transactions with no chain ID', async () => {
      const oldData = {
        some: 'data',
        IncomingTransactionsController: {
          incomingTransactions: {
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: {
              ...INCOMING_TRANSACTION_2_MOCK,
              chainId: undefined,
            },
          },
        },
      };

      const oldStorage = {
        meta: { version: 94 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        some: oldData.some,
        TransactionController: {
          transactions: expect.any(Object),
          lastFetchedBlockNumbers: {
            [`${INCOMING_TRANSACTION_MOCK.chainId}#${INCOMING_TRANSACTION_MOCK.txParams.to}`]:
              parseInt(INCOMING_TRANSACTION_MOCK.blockNumber, 10),
          },
        },
      });
    });

    it('ignoring incoming transactions with no block number', async () => {
      const oldData = {
        some: 'data',
        IncomingTransactionsController: {
          incomingTransactions: {
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: {
              ...INCOMING_TRANSACTION_2_MOCK,
              blockNumber: undefined,
            },
          },
        },
      };

      const oldStorage = {
        meta: { version: 94 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        some: oldData.some,
        TransactionController: {
          transactions: expect.any(Object),
          lastFetchedBlockNumbers: {
            [`${INCOMING_TRANSACTION_MOCK.chainId}#${INCOMING_TRANSACTION_MOCK.txParams.to}`]:
              parseInt(INCOMING_TRANSACTION_MOCK.blockNumber, 10),
          },
        },
      });
    });

    it('ignoring incoming transactions with no to address', async () => {
      const oldData = {
        some: 'data',
        IncomingTransactionsController: {
          incomingTransactions: {
            [INCOMING_TRANSACTION_MOCK.id]: INCOMING_TRANSACTION_MOCK,
            [INCOMING_TRANSACTION_2_MOCK.id]: {
              ...INCOMING_TRANSACTION_2_MOCK,
              txParams: {
                ...INCOMING_TRANSACTION_2_MOCK.txParams,
                to: undefined,
              },
            },
          },
        },
      };

      const oldStorage = {
        meta: { version: 94 },
        data: oldData,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual({
        some: oldData.some,
        TransactionController: {
          transactions: expect.any(Object),
          lastFetchedBlockNumbers: {
            [`${INCOMING_TRANSACTION_MOCK.chainId}#${INCOMING_TRANSACTION_MOCK.txParams.to}`]:
              parseInt(INCOMING_TRANSACTION_MOCK.blockNumber, 10),
          },
        },
      });
    });
  });
});
