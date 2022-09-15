import { CHAIN_IDS, NETWORK_TYPES } from '../../../shared/constants/network';
import migration55 from './055';

describe('migration #55', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 54,
      },
      data: {},
    };

    const newStorage = await migration55.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 55,
    });
  });

  it('should replace incomingTxLastFetchedBlocksByNetwork with incomingTxLastFetchedBlockByChainId, and carry over old values', async () => {
    const oldStorage = {
      meta: {},
      data: {
        IncomingTransactionsController: {
          incomingTransactions: {
            test: {
              transactionCategory: 'incoming',
              txParams: {
                foo: 'bar',
              },
            },
          },
          incomingTxLastFetchedBlocksByNetwork: {
            [NETWORK_TYPES.MAINNET]: 1,
            [NETWORK_TYPES.ROPSTEN]: 2,
            [NETWORK_TYPES.RINKEBY]: 3,
            [NETWORK_TYPES.GOERLI]: 4,
            [NETWORK_TYPES.KOVAN]: 5,
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration55.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      IncomingTransactionsController: {
        incomingTransactions:
          oldStorage.data.IncomingTransactionsController.incomingTransactions,
        incomingTxLastFetchedBlockByChainId: {
          [CHAIN_IDS.MAINNET]: 1,
          [CHAIN_IDS.ROPSTEN]: 2,
          [CHAIN_IDS.RINKEBY]: 3,
          [CHAIN_IDS.GOERLI]: 4,
          [CHAIN_IDS.KOVAN]: 5,
        },
      },
      foo: 'bar',
    });
  });

  it('should do nothing if incomingTxLastFetchedBlocksByNetwork key is not populated', async () => {
    const oldStorage = {
      meta: {},
      data: {
        IncomingTransactionsController: {
          foo: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration55.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
  it('should do nothing if state is empty', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration55.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
