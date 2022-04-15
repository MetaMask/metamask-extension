import { cloneDeep } from 'lodash';
import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  GOERLI_CHAIN_ID,
} from '../../../shared/constants/network';
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from '../../../shared/constants/transaction';
import migration70 from './070';

const CANCEL = 'cancel';
const RETRY = 'retry';

const ERRONEOUS_TRANSACTION_STATE = {
  0: {
    type: CANCEL,
    id: 0,
    chainId: MAINNET_CHAIN_ID,
    txParams: {
      nonce: '0x0',
    },
  },
  1: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 1,
    chainId: MAINNET_CHAIN_ID,
    txParams: {
      nonce: '0x1',
    },
  },
  2: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 2,
    chainId: KOVAN_CHAIN_ID,
    txParams: {
      nonce: '0x2',
    },
  },
  3: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 3,
    chainId: RINKEBY_CHAIN_ID,
    txParams: {
      nonce: '0x3',
    },
  },
  4: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 4,
    chainId: RINKEBY_CHAIN_ID,
    txParams: {
      nonce: '0x4',
    },
  },
  5: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 5,
    chainId: MAINNET_CHAIN_ID,
    txParams: {
      nonce: '0x5',
    },
  },
  6: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 6,
    chainId: KOVAN_CHAIN_ID,
    txParams: {
      nonce: '0x6',
    },
  },
  7: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 7,
    chainId: RINKEBY_CHAIN_ID,
    txParams: {
      nonce: '0x7',
    },
  },
  8: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 8,
    chainId: RINKEBY_CHAIN_ID,
    txParams: {
      nonce: '0x8',
    },
  },
  9: {
    type: TRANSACTION_TYPES.SIMPLE_SEND,
    id: 9,
    chainId: RINKEBY_CHAIN_ID,
    status: TRANSACTION_STATUSES.UNAPPROVED,
  },
};

const ERRONEOUS_TRANSACTION_STATE_RETRY = {
  ...ERRONEOUS_TRANSACTION_STATE,
  0: {
    ...ERRONEOUS_TRANSACTION_STATE[0],
    type: RETRY,
  },
};

const ERRONEOUS_TRANSACTION_STATE_MIXED = {
  ...ERRONEOUS_TRANSACTION_STATE,
  10: {
    type: RETRY,
    id: 10,
    chainId: MAINNET_CHAIN_ID,
    txParams: {
      nonce: '0xa',
    },
  },
  11: {
    type: RETRY,
    id: 11,
    chainId: MAINNET_CHAIN_ID,
    txParams: {
      nonce: '0xb',
    },
  },
};

describe('migration #70', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 70,
      },
      data: {},
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 70,
    });
  });

  it('should drop orphaned cancel transactions', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: ERRONEOUS_TRANSACTION_STATE,
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    const EXPECTED = cloneDeep(ERRONEOUS_TRANSACTION_STATE);
    delete EXPECTED['0'];
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: EXPECTED,
      },
      foo: 'bar',
    });
  });

  it('should drop orphaned cancel transactions even if a nonce exists on another network that is confirmed', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: {
            ...ERRONEOUS_TRANSACTION_STATE,
            11: {
              ...ERRONEOUS_TRANSACTION_STATE['0'],
              id: 11,
              chainId: GOERLI_CHAIN_ID,
              type: TRANSACTION_TYPES.SIMPLE_SEND,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    const EXPECTED = cloneDeep(
      oldStorage.data.TransactionController.transactions,
    );
    delete EXPECTED['0'];
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: EXPECTED,
      },
      foo: 'bar',
    });
  });

  it('should update the type of a cancel transaction to match a non cancel or retry in same network and nonce', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: {
            ...ERRONEOUS_TRANSACTION_STATE,
            11: {
              ...ERRONEOUS_TRANSACTION_STATE['0'],
              id: 11,
              type: TRANSACTION_TYPES.SIMPLE_SEND,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: {
          ...oldStorage.data.TransactionController.transactions,
          0: {
            ...ERRONEOUS_TRANSACTION_STATE['0'],
            type: TRANSACTION_TYPES.SIMPLE_SEND,
            isCancel: true,
            isRetry: false,
          },
          11: {
            ...oldStorage.data.TransactionController.transactions[11],
            isCancel: false,
            isRetry: false,
          },
        },
      },
      foo: 'bar',
    });
  });

  it('should drop orphaned retry transactions', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: ERRONEOUS_TRANSACTION_STATE_RETRY,
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    const EXPECTED = cloneDeep(ERRONEOUS_TRANSACTION_STATE_RETRY);
    delete EXPECTED['0'];
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: EXPECTED,
      },
      foo: 'bar',
    });
  });

  it('should drop orphaned retry transactions even if a nonce exists on another network that is confirmed', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: {
            ...ERRONEOUS_TRANSACTION_STATE_RETRY,
            11: {
              ...ERRONEOUS_TRANSACTION_STATE_RETRY['0'],
              id: 11,
              chainId: GOERLI_CHAIN_ID,
              type: TRANSACTION_TYPES.SIMPLE_SEND,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    const EXPECTED = cloneDeep(
      oldStorage.data.TransactionController.transactions,
    );
    delete EXPECTED['0'];
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: EXPECTED,
      },
      foo: 'bar',
    });
  });

  it('should update the type of a retry transaction to match a non cancel or retry in same network and nonce', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: {
            ...ERRONEOUS_TRANSACTION_STATE_RETRY,
            11: {
              ...ERRONEOUS_TRANSACTION_STATE_RETRY['0'],
              id: 11,
              type: TRANSACTION_TYPES.SIMPLE_SEND,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: {
          ...oldStorage.data.TransactionController.transactions,
          0: {
            ...oldStorage.data.TransactionController.transactions[0],
            isCancel: false,
            isRetry: true,
            type: TRANSACTION_TYPES.SIMPLE_SEND,
          },
          11: {
            ...oldStorage.data.TransactionController.transactions[11],
            isRetry: false,
            isCancel: false,
          },
        },
      },
      foo: 'bar',
    });
  });

  it('should update the type of a retry transaction even in complex groups', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: {
            ...ERRONEOUS_TRANSACTION_STATE_RETRY,
            11: {
              ...ERRONEOUS_TRANSACTION_STATE_RETRY['0'],
              id: 11,
              type: TRANSACTION_TYPES.SIMPLE_SEND,
            },
            12: {
              ...ERRONEOUS_TRANSACTION_STATE_RETRY['0'],
              id: 12,
              type: CANCEL,
            },
            13: {
              // advanced user superseding cancel with new tx of same nonce,
              ...ERRONEOUS_TRANSACTION_STATE_RETRY['0'],
              id: 13,
              type: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: {
          ...oldStorage.data.TransactionController.transactions,
          0: {
            ...oldStorage.data.TransactionController.transactions[0],
            isCancel: false,
            isRetry: true,
            type: TRANSACTION_TYPES.SIMPLE_SEND,
          },
          11: {
            ...oldStorage.data.TransactionController.transactions[11],
            isRetry: false,
            isCancel: false,
          },
          12: {
            ...oldStorage.data.TransactionController.transactions[12],
            isRetry: false,
            isCancel: true,
            type: TRANSACTION_TYPES.SIMPLE_SEND,
          },
          // This is currently a "bug" this transaction would be grouped with
          // the others and cause an erroneous display in the activity log.
          13: {
            ...oldStorage.data.TransactionController.transactions[13],
            isRetry: false,
            isCancel: false,
            type: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM,
          },
        },
      },
      foo: 'bar',
    });
  });

  it('should drop all orphaned retry and cancel transactions', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: ERRONEOUS_TRANSACTION_STATE_MIXED,
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    // The following ERRONEOUS_TRANSACTION_STATE object only has one orphan in it
    // so using it as the base for our expected output automatically removes a few
    // transactions we expect to be missing.
    const EXPECTED = cloneDeep(ERRONEOUS_TRANSACTION_STATE);
    delete EXPECTED['0'];
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: EXPECTED,
      },
      foo: 'bar',
    });
  });

  it('should do nothing if transactions state does not exist', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          bar: 'baz',
        },
        IncomingTransactionsController: {
          foo: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if transactions state is empty', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: {},
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if transactions state is not an object', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: [],
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if state is empty', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
