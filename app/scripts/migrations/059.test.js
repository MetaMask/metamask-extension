import { cloneDeep } from 'lodash';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import migration59 from './059';

const SENT_ETHER = 'sentEther'; // a legacy transaction type replaced now by TransactionType.simpleSend

const ERRONEOUS_TRANSACTION_STATE = {
  0: {
    type: TransactionType.cancel,
    id: 0,
    chainId: CHAIN_IDS.MAINNET,
    txParams: {
      nonce: '0x0',
    },
  },
  1: {
    type: SENT_ETHER,
    id: 1,
    chainId: CHAIN_IDS.MAINNET,
    txParams: {
      nonce: '0x1',
    },
  },
  2: {
    type: SENT_ETHER,
    id: 2,
    chainId: '0x2a',
    txParams: {
      nonce: '0x2',
    },
  },
  3: {
    type: SENT_ETHER,
    id: 3,
    chainId: '0x4',
    txParams: {
      nonce: '0x3',
    },
  },
  4: {
    type: SENT_ETHER,
    id: 4,
    chainId: '0x4',
    txParams: {
      nonce: '0x4',
    },
  },
  5: {
    type: SENT_ETHER,
    id: 5,
    chainId: CHAIN_IDS.MAINNET,
    txParams: {
      nonce: '0x5',
    },
  },
  6: {
    type: SENT_ETHER,
    id: 6,
    chainId: '0x2a',
    txParams: {
      nonce: '0x6',
    },
  },
  7: {
    type: SENT_ETHER,
    id: 7,
    chainId: '0x4',
    txParams: {
      nonce: '0x7',
    },
  },
  8: {
    type: SENT_ETHER,
    id: 8,
    chainId: '0x4',
    txParams: {
      nonce: '0x8',
    },
  },
  9: {
    type: SENT_ETHER,
    id: 9,
    chainId: '0x4',
    status: TransactionStatus.unapproved,
  },
};

const ERRONEOUS_TRANSACTION_STATE_RETRY = {
  ...ERRONEOUS_TRANSACTION_STATE,
  0: {
    ...ERRONEOUS_TRANSACTION_STATE[0],
    type: TransactionType.retry,
  },
};

const ERRONEOUS_TRANSACTION_STATE_MIXED = {
  ...ERRONEOUS_TRANSACTION_STATE,
  10: {
    type: TransactionType.retry,
    id: 10,
    chainId: CHAIN_IDS.MAINNET,
    txParams: {
      nonce: '0xa',
    },
  },
  11: {
    type: TransactionType.retry,
    id: 11,
    chainId: CHAIN_IDS.MAINNET,
    txParams: {
      nonce: '0xb',
    },
  },
};

describe('migration #59', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 58,
      },
      data: {},
    };

    const newStorage = await migration59.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 59,
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

    const newStorage = await migration59.migrate(oldStorage);
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
              chainId: CHAIN_IDS.GOERLI,
              type: SENT_ETHER,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration59.migrate(oldStorage);
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

  it('should not drop cancel transactions with matching non cancel or retry in same network and nonce', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: {
            ...ERRONEOUS_TRANSACTION_STATE,
            11: {
              ...ERRONEOUS_TRANSACTION_STATE['0'],
              id: 11,
              type: SENT_ETHER,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration59.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: oldStorage.data.TransactionController.transactions,
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

    const newStorage = await migration59.migrate(oldStorage);
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
              chainId: CHAIN_IDS.GOERLI,
              type: SENT_ETHER,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration59.migrate(oldStorage);
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

  it('should not drop retry transactions with matching non cancel or retry in same network and nonce', async () => {
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: {
            ...ERRONEOUS_TRANSACTION_STATE_RETRY,
            11: {
              ...ERRONEOUS_TRANSACTION_STATE_RETRY['0'],
              id: 11,
              type: SENT_ETHER,
            },
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration59.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: oldStorage.data.TransactionController.transactions,
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

    const newStorage = await migration59.migrate(oldStorage);
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

    const newStorage = await migration59.migrate(oldStorage);
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

    const newStorage = await migration59.migrate(oldStorage);
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

    const newStorage = await migration59.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if state is empty', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration59.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
