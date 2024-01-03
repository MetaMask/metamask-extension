import { TransactionType } from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import migration64 from './064';

const SENT_ETHER = 'sentEther'; // the legacy transaction type being replaced in this migration with TransactionType.simpleSend

describe('migration #64', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 63,
      },
      data: {},
    };

    const newStorage = await migration64.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 64,
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

    const newStorage = await migration64.migrate(oldStorage);
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

    const newStorage = await migration64.migrate(oldStorage);
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

    const newStorage = await migration64.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if state is empty', async () => {
    const oldStorage = {
      meta: {},
      data: {},
    };

    const newStorage = await migration64.migrate(oldStorage);
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should change action type of "sentEther" to "simpleSend" for any transactions and transaction history events in transactionsController.transactions', async () => {
    const OLD_TRANSACTION_STATE = {
      1462177651588364: {
        type: TransactionType.cancel,
        id: 0,
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          nonce: '0x0',
        },
        origin: 'https://metamask.github.io',
        r: '0x29f00dda09306f0f09895e80db110b9348eeb57d3e0b386409bfb674041ba45a',
        rawTx:
          '0x02f902fc04278459682f008459682f10830314138080b902a3608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029c001a029f00dda09306f0f09895e80db110b9348eeb57d3e0b386409bfb674041ba45aa049f74084dd8c517b305a2e60b39ae9002176a5244cb06de8f9ea3757811f5ec6',
        s: '0x49f74084dd8c517b305a2e60b39ae9002176a5244cb06de8f9ea3757811f5ec6',
        status: 'confirmed',
        estimatedBaseFee: 'b',
        hash: '0x4d8543f12afd3795b94d723dcd0e20bfc3740e1af668e5e90a0c5ec49f36ba12',
      },
      1: {
        type: SENT_ETHER,
        id: 1,
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          nonce: '0x1',
        },
        history: [
          {
            chainId: '0x4',
            dappSuggestedGasFees: {
              gas: '0x31413',
            },
            id: 1462177651588364,
            loadingDefaults: true,
            metamaskNetworkId: '4',
            origin: 'https://metamask.github.io',
            status: 'unapproved',
            time: 1631118004776,
            txParams: {
              data: '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
              from: '0x0f002c95c041f003be01c3e4f52cae1f6ab3ba6e',
              gas: '0x31413',
              value: '0x0',
            },
            type: SENT_ETHER,
          },
          [
            {
              note: 'Added new unapproved transaction.',
              op: 'add',
              path: '/txParams/maxFeePerGas',
              timestamp: 1631118004862,
              value: '0x59682f10',
            },
            {
              op: 'add',
              path: '/txParams/maxPriorityFeePerGas',
              value: '0x59682f00',
            },
            {
              op: 'replace',
              path: '/loadingDefaults',
              value: false,
            },
            {
              op: 'add',
              path: '/userFeeLevel',
              value: 'medium',
            },
          ],
        ],
      },
      3274396743040791: {
        baseFeePerGas: '0xb',
        chainId: '0x4',
        dappSuggestedGasFees: {
          gas: '0xa9fe',
        },
        estimatedBaseFee: 'b',
        hash: '0x19ffab8a9467df9afbef82d8907f9e39f0696c7a774ed5473ecf7337adcc674b',
        origin: 'https://metamask.github.io',
        r: '0xc2b2901f3593536d21e9b136c469b9b8f91a944f18a29a3cdf3a2eaadf660e71',
        rawTx:
          '0x02f87604288459682f008459682f1082a9fe949ef57335bc7d5b6cbc06dca6064a604b75e09ace883782dace9d90000084d0e30db0c001a0c2b2901f3593536d21e9b136c469b9b8f91a944f18a29a3cdf3a2eaadf660e71a057876a0292d548dd67c6faed8e835b94252b55a043ce01a1206361ccab417ad4',
        s: '0x57876a0292d548dd67c6faed8e835b94252b55a043ce01a1206361ccab417ad4',
        status: 'confirmed',
        submittedTime: 1631118228493,
        time: 1631118217596,
        txParams: {
          data: '0xd0e30db0',
          from: '0x0f002c95c041f003be01c3e4f52cae1f6ab3ba6e',
          gas: '0xa9fe',
          maxFeePerGas: '0x59682f10',
          maxPriorityFeePerGas: '0x59682f00',
          nonce: '0x28',
          to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
          value: '0x3782dace9d900000',
        },
        txReceipt: {
          blockHash:
            '0xafa4e1fd95e429d9c6e6c7c1d282b2bd0bbeb50d0a68743e9392b9c95a06e2eb',
          blockNumber: {
            length: 1,
            negative: 0,
            red: null,
            words: [9257603, null],
          },
          contractAddress: null,
          cumulativeGasUsed: {
            length: 1,
            negative: 0,
            red: null,
            words: [4954851, null],
          },
          effectiveGasPrice: '0x59682f0b',
          from: '0x0f002c95c041f003be01c3e4f52cae1f6ab3ba6e',
          gasUsed: 'a9fe',
          logs: [],
          logsBloom:
            '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          status: '0x1',
          to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
          transactionHash:
            '0x19ffab8a9467df9afbef82d8907f9e39f0696c7a774ed5473ecf7337adcc674b',
          transactionIndex: {
            length: 1,
            negative: 0,
            red: null,
            words: [9, null],
          },
          type: '0x2',
        },
        type: SENT_ETHER,
        history: [
          {
            chainId: '0x4',
            dappSuggestedGasFees: {
              gas: '0xa9fe',
            },
            id: 3274396743040791,
            loadingDefaults: true,
            metamaskNetworkId: '4',
            origin: 'https://metamask.github.io',
            status: 'unapproved',
            time: 1631118217596,
            txParams: {
              data: '0xd0e30db0',
              from: '0x0f002c95c041f003be01c3e4f52cae1f6ab3ba6e',
              gas: '0xa9fe',
              to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
              value: '0x3782dace9d900000',
            },
          },
          [
            {
              note: 'Added new unapproved transaction.',
              op: 'add',
              path: '/txParams/maxFeePerGas',
              timestamp: 1631118217762,
              value: '0x59682f10',
            },
            {
              op: 'add',
              path: '/txParams/maxPriorityFeePerGas',
              value: '0x59682f00',
            },
            {
              op: 'replace',
              path: '/loadingDefaults',
              value: false,
            },
            {
              op: 'add',
              path: '/userFeeLevel',
              value: 'medium',
            },
          ],
        ],
      },
    };

    const EXPECTED_TRANSACTION_STATE = {
      1462177651588364: {
        type: TransactionType.cancel,
        id: 0,
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          nonce: '0x0',
        },
        origin: 'https://metamask.github.io',
        r: '0x29f00dda09306f0f09895e80db110b9348eeb57d3e0b386409bfb674041ba45a',
        rawTx:
          '0x02f902fc04278459682f008459682f10830314138080b902a3608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029c001a029f00dda09306f0f09895e80db110b9348eeb57d3e0b386409bfb674041ba45aa049f74084dd8c517b305a2e60b39ae9002176a5244cb06de8f9ea3757811f5ec6',
        s: '0x49f74084dd8c517b305a2e60b39ae9002176a5244cb06de8f9ea3757811f5ec6',
        status: 'confirmed',
        estimatedBaseFee: 'b',
        hash: '0x4d8543f12afd3795b94d723dcd0e20bfc3740e1af668e5e90a0c5ec49f36ba12',
      },
      1: {
        type: TransactionType.simpleSend,
        id: 1,
        chainId: CHAIN_IDS.MAINNET,
        txParams: {
          nonce: '0x1',
        },
        history: [
          {
            chainId: '0x4',
            dappSuggestedGasFees: {
              gas: '0x31413',
            },
            id: 1462177651588364,
            loadingDefaults: true,
            metamaskNetworkId: '4',
            origin: 'https://metamask.github.io',
            status: 'unapproved',
            time: 1631118004776,
            txParams: {
              data: '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
              from: '0x0f002c95c041f003be01c3e4f52cae1f6ab3ba6e',
              gas: '0x31413',
              value: '0x0',
            },
            type: TransactionType.simpleSend,
          },
          [
            {
              note: 'Added new unapproved transaction.',
              op: 'add',
              path: '/txParams/maxFeePerGas',
              timestamp: 1631118004862,
              value: '0x59682f10',
            },
            {
              op: 'add',
              path: '/txParams/maxPriorityFeePerGas',
              value: '0x59682f00',
            },
            {
              op: 'replace',
              path: '/loadingDefaults',
              value: false,
            },
            {
              op: 'add',
              path: '/userFeeLevel',
              value: 'medium',
            },
          ],
        ],
      },
      3274396743040791: {
        baseFeePerGas: '0xb',
        chainId: '0x4',
        dappSuggestedGasFees: {
          gas: '0xa9fe',
        },
        estimatedBaseFee: 'b',
        hash: '0x19ffab8a9467df9afbef82d8907f9e39f0696c7a774ed5473ecf7337adcc674b',
        origin: 'https://metamask.github.io',
        r: '0xc2b2901f3593536d21e9b136c469b9b8f91a944f18a29a3cdf3a2eaadf660e71',
        rawTx:
          '0x02f87604288459682f008459682f1082a9fe949ef57335bc7d5b6cbc06dca6064a604b75e09ace883782dace9d90000084d0e30db0c001a0c2b2901f3593536d21e9b136c469b9b8f91a944f18a29a3cdf3a2eaadf660e71a057876a0292d548dd67c6faed8e835b94252b55a043ce01a1206361ccab417ad4',
        s: '0x57876a0292d548dd67c6faed8e835b94252b55a043ce01a1206361ccab417ad4',
        status: 'confirmed',
        submittedTime: 1631118228493,
        time: 1631118217596,
        txParams: {
          data: '0xd0e30db0',
          from: '0x0f002c95c041f003be01c3e4f52cae1f6ab3ba6e',
          gas: '0xa9fe',
          maxFeePerGas: '0x59682f10',
          maxPriorityFeePerGas: '0x59682f00',
          nonce: '0x28',
          to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
          value: '0x3782dace9d900000',
        },
        txReceipt: {
          blockHash:
            '0xafa4e1fd95e429d9c6e6c7c1d282b2bd0bbeb50d0a68743e9392b9c95a06e2eb',
          blockNumber: {
            length: 1,
            negative: 0,
            red: null,
            words: [9257603, null],
          },
          contractAddress: null,
          cumulativeGasUsed: {
            length: 1,
            negative: 0,
            red: null,
            words: [4954851, null],
          },
          effectiveGasPrice: '0x59682f0b',
          from: '0x0f002c95c041f003be01c3e4f52cae1f6ab3ba6e',
          gasUsed: 'a9fe',
          logs: [],
          logsBloom:
            '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          status: '0x1',
          to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
          transactionHash:
            '0x19ffab8a9467df9afbef82d8907f9e39f0696c7a774ed5473ecf7337adcc674b',
          transactionIndex: {
            length: 1,
            negative: 0,
            red: null,
            words: [9, null],
          },
          type: '0x2',
        },
        type: TransactionType.simpleSend,
        history: [
          {
            chainId: '0x4',
            dappSuggestedGasFees: {
              gas: '0xa9fe',
            },
            id: 3274396743040791,
            loadingDefaults: true,
            metamaskNetworkId: '4',
            origin: 'https://metamask.github.io',
            status: 'unapproved',
            time: 1631118217596,
            txParams: {
              data: '0xd0e30db0',
              from: '0x0f002c95c041f003be01c3e4f52cae1f6ab3ba6e',
              gas: '0xa9fe',
              to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
              value: '0x3782dace9d900000',
            },
          },
          [
            {
              note: 'Added new unapproved transaction.',
              op: 'add',
              path: '/txParams/maxFeePerGas',
              timestamp: 1631118217762,
              value: '0x59682f10',
            },
            {
              op: 'add',
              path: '/txParams/maxPriorityFeePerGas',
              value: '0x59682f00',
            },
            {
              op: 'replace',
              path: '/loadingDefaults',
              value: false,
            },
            {
              op: 'add',
              path: '/userFeeLevel',
              value: 'medium',
            },
          ],
        ],
      },
    };
    const oldStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: OLD_TRANSACTION_STATE,
        },
      },
    };

    const expectedStorage = {
      meta: {},
      data: {
        TransactionController: {
          transactions: EXPECTED_TRANSACTION_STATE,
        },
      },
    };

    const newStorage = await migration64.migrate(oldStorage);

    expect(expectedStorage.data).toStrictEqual(newStorage.data);
  });
});
