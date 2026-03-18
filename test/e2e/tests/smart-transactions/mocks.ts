import { ReadableStream as ReadableStreamWeb } from 'stream/web';
import { Readable } from 'stream';
import { MockttpServer } from 'mockttp';
import { mockEthDaiTrade, mockEthUsdcGasIncludedTrade } from '../swaps/shared';
import { mockMultiNetworkBalancePolling } from '../../mock-balance-polling/mock-balance-polling';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';
import { SSE_RESPONSE_HEADER } from '../bridge/constants';
import { TX_SENTINEL_URL } from '../../../../shared/constants/transaction';

const STX_UUID = '0d506aaa-5e38-4cab-ad09-2039cb7a0f33';

const TRANSACTION_HASH =
  '0xec9d6214684d6dc191133ae4a7ec97db3e521fff9cfe5c4f48a84cb6c93a5fa5';

const BLOCK_HASH =
  '0xe90b92d004a9c22c32c50c628bbd93f22e3468ec4ffc62422d68cf6370f59f1d';

const FIRST_SEND_TRANSACTION_HASH =
  '0xc3c29d758eedafcba70f44333d1659117d293d0a06d5404f5919d05141d02427';
const SECOND_SEND_TRANSACTION_HASH =
  '0x5f87bf1e29d3325113d0a1ad033befac747e800699abf8172e26113bb3c615d9';

const GET_FEES_RESPONSE = {
  blockNumber: 20728974,
  id: '19d4eea3-8a49-463e-9e9c-099f9d9571ca',
  txs: [
    {
      cancelFees: [],
      return: '0x',
      status: 1,
      gasUsed: 190780,
      gasLimit: 239420,
      fees: [
        {
          maxFeePerGas: 4667609171,
          maxPriorityFeePerGas: 1000000004,
          gas: 239420,
          balanceNeeded: 1217518987960240,
          currentBalance: 751982303082919400,
          error: '',
        },
      ],
      feeEstimate: 627603309182220,
      baseFeePerGas: 2289670348,
      maxFeeEstimate: 1117518987720820,
    },
  ],
};

const GET_BATCH_STATUS_RESPONSE_PENDING = {
  '0d506aaa-5e38-4cab-ad09-2039cb7a0f33': {
    cancellationFeeWei: 0,
    cancellationReason: 'not_cancelled',
    deadlineRatio: 0,
    isSettled: false,
    minedTx: 'not_mined',
    wouldRevertMessage: null,
    minedHash: '',
    timedOut: false,
    proxied: false,
    type: 'sentinel',
  },
};

const GET_BATCH_STATUS_RESPONSE_SUCCESS = {
  '0d506aaa-5e38-4cab-ad09-2039cb7a0f33': {
    cancellationFeeWei: 0,
    cancellationReason: 'not_cancelled',
    deadlineRatio: 0,
    isSettled: true,
    minedTx: 'success',
    wouldRevertMessage: null,
    minedHash: TRANSACTION_HASH,
    timedOut: true,
    proxied: false,
    type: 'sentinel',
  },
};

const GET_TRANSACTION_RECEIPT_RESPONSE = {
  id: 2901696354742565,
  jsonrpc: '2.0',
  result: {
    blockHash: BLOCK_HASH,
    blockNumber: '0x2',
    contractAddress: null,
    cumulativeGasUsed: '0xc138b1',
    effectiveGasPrice: '0x1053fcd93',
    from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
    gasUsed: '0x2e93c',
    logs: [
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x00000000000000000000000000000000000000000000000000005af3107a4000',
        logIndex: '0xde',
        removed: false,
        topics: [
          '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x00000000000000000000000000000000000000000000000000005a275669d200',
        logIndex: '0xdf',
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
          '0x00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x000000000000000000000000000000000000000000000000033dd7a160e2a300',
        logIndex: '0xe0',
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x00000000000000000000000000000000000000000000000000006a3845cef618',
        logIndex: '0xe1',
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f',
          '0x000000000000000000000000ad30f7eebd9bd5150a256f47da41d4403033cdf0',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0xd82fa167727a4dc6d6f55830a2c47abbb4b3a0f8',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000033dd7a160e2a3000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000005a275669d200',
        logIndex: '0xe2',
        removed: false,
        topics: [
          '0xb651f2787ff61b5ab14f3936f2daebdad3d84aeb74438e82870cc3b7aee71e90',
          '0x00000000000000000000000000000000000000000000000000000191e0cc96ac',
          '0x00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x000000000000000000000000000000000000000000000000000000cbba106e00',
        logIndex: '0xe3',
        removed: false,
        topics: [
          '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0xf326e4de8f66a0bdc0970b79e0924e33c79f1915',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x000000000000000000000000000000000000000000000000000000cbba106e00',
        logIndex: '0xe4',
        removed: false,
        topics: [
          '0x3d0ce9bfc3ed7d6862dbb28b2dea94561fe714a1b4d019aa8af39730d1ad7c3d',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x000000000000000000000000000000000000000000000000033dd7a160e2a300',
        logIndex: '0xe5',
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x00000000000000000000000074de5d4fcbf63e00296fd95d33236b9794016631',
          '0x0000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
      {
        address: '0x881d40237659c251811cec9c364ef91dc08d300c',
        blockHash: BLOCK_HASH,
        blockNumber: '0x13c80ce',
        data: '0x',
        logIndex: '0xe6',
        removed: false,
        topics: [
          '0xbeee1e6e7fe307ddcf84b0a16137a4430ad5e2480fc4f4a8e250ab56ccd7630d',
          '0x015123c6e2552626efe611b6c48de60d080a6650860a38f237bc2b6f651f79d1',
          '0x0000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1',
        ],
        transactionHash: TRANSACTION_HASH,
        transactionIndex: '0x2f',
      },
    ],
    logsBloom:
      '0x00000000000000001000000000000000000000000000000000000001000000000000010000000000000010000000000002000000080008000000040000000000a00000000000000000020008000000000000000000540000000004008020000010000000000000000000000000000801000000000000040000000010004010000000021000000000000000000000000000020041000100004020000000000000000000000200000000000040000000000000000000000000000000000000000000000002000400000000000000000000001002000400000000000002000000000020200000000400000000800000000000000000020200400000000000001000',
    status: '0x1',
    to: '0x881d40237659c251811cec9c364ef91dc08d300c',
    transactionHash: TRANSACTION_HASH,
    transactionIndex: '0x2f',
    type: '0x2',
  },
};

const GET_TRANSACTION_BY_HASH_RESPONSE = {
  id: 2901696354742565,
  jsonrpc: '2.0',
  result: {
    accessList: [],
    blockHash: BLOCK_HASH,
    blockNumber: '0x2',
    chainId: '0x539',
    from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
    gas: '0x3a73c',
    gasPrice: '0x1053fcd93',
    hash: TRANSACTION_HASH,
    input:
      '0x5f5755290000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001c616972737761704c696768743446656544796e616d696346697865640000000000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000191e0cc96ac0000000000000000000000000000000000000000000000000000000066e44f2c00000000000000000000000051c72848c68a965f66fa7a88855f9f7784502a7f0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000033dd7a160e2a300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a275669d200000000000000000000000000000000000000000000000000000000000000001bc1acb8a206598705baeb494a479a8af9dc3a9f9b7bd1ce9818360fd6f603cf0766e7bdc77f9f72e90dcd9157e007291adc6d3947e9b6d89ff412c5b54f9a17f1000000000000000000000000000000000000000000000000000000cbba106e00000000000000000000000000f326e4de8f66a0bdc0970b79e0924e33c79f1915000000000000000000000000000000000000000000000000000000000000000000d7',
    maxFeePerGas: '0x14bdcd619',
    maxPriorityFeePerGas: '0x3b9aca04',
    nonce: '0x127',
    r: '0x5a5463bfe8e587ee1211be74580c74fa759f8292f37f970033df4b782f5e097d',
    s: '0x50e403a70000b106e9f598b1b3f55b6ea9d2ec21d9fc67de63eb1d07df2767dd',
    to: '0x881d40237659c251811cec9c364ef91dc08d300c',
    transactionIndex: '0x2f',
    type: '0x2',
    v: '0x0',
    value: '0x5af3107a4000',
    yParity: '0x0',
  },
};

export const SWAP_TEST_GAS_INCLUDED_TRADES_MOCK = [
  {
    trade: {
      data: '0x5f575529000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080a885ca75f83800000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001c616972737761704c696768743446656544796e616d696346697865640000000000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000197804ee7f8000000000000000000000000000000000000000000000000000000006852006d000000000000000000000000111bb8c3542f2b92fb41b8d913c01d3788431111000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000055f65840000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007f8853faede5ba000000000000000000000000000000000000000000000000000000000000001cc2a8c346b853e4f9369ed915366bd5d72840ad9858667d01abb9c9b829130bb829ad977f3aed189f4e35c82d57e2ce14cb1d35412d434f6fccf86d573a83c06400000000000000000000000000000000000000000000000000012031cf88127e000000000000000000000000e3478b0bb1a5084567c319096437924948be196400000000000000000000000000000000000000000000000000000000000000000112',
      from: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      value: '36214089599809592',
      to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
    },
    hasRoute: false,
    sourceAmount: '36688236655602688',
    destinationAmount: '90137988',
    error: null,
    sourceToken: '0x0000000000000000000000000000000000000000',
    destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    maxGas: 281910,
    averageGas: 207378,
    estimatedRefund: 48904,
    sufficientFundsForGas: true,
    isGasIncludedTrade: true,
    tradeTxFees: {
      gasLimit: '0x44d36',
      fees: [
        {
          maxFeePerGas: '0x61fd7c4e',
          maxPriorityFeePerGas: '0x3b9aca01',
          gas: '0x3e91a',
          balanceNeeded: '0x83d6f3e01689ec',
          currentBalance: '0x8257c1c14aec00',
          error: '',
          tokenFees: [
            {
              token: {
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                decimals: 18,
              },
              balanceNeededToken: '0x1af3bf6d4f3c8',
              currentBalanceToken: '0x0',
              rateWei: '0xde0b6b3a7640000',
              error: 'Not enough funds',
              feeRecipient: '0xe3478b0bb1a5084567c319096437924948be1964',
              totalGas: '0x44ac2',
              isDelegationFee: false,
            },
          ],
        },
      ],
      feeEstimate: 326090823134436,
      baseFeePerGas: 572446561,
      maxFeeEstimate: 491279448271092,
    },
    approvalNeeded: null,
    fetchTime: 1303,
    aggregator: 'airswapV4',
    aggType: 'RFQ',
    fee: 0.875,
    quoteRefreshSeconds: 30,
    gasMultiplier: 1.1,
    sourceTokenRate: 1,
    destinationTokenRate: 0.0003973863887874334,
    priceSlippage: {
      ratio: 1.0113354012421507,
      calculationError: '',
      bucket: 'low',
      sourceAmountInUSD: 92.3464929563513,
      destinationAmountInUSD: 90.119780126424,
      sourceAmountInNativeCurrency: 0.03668823665560269,
      destinationAmountInNativeCurrency: 0.03581960954388501,
      sourceAmountInETH: 0.03668823665560269,
      destinationAmountInETH: 0.03581960954388501,
    },
    signature:
      '0x4ffe7a1746b98fdddf87b936a26e89f29e548e7eda92ebb2bd659b6693e8edf27a9e7f5eb65cbd8e1ddea6458edd4d9e724fd39c7561daaf3c45006347886dfd1c',
    sigExpiration: 1750204645423,
  },
];

const TRANSACTION_SIMULATION_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    transactions: [
      {
        return: '0x',
        status: '0x1',
        gasUsed: '0x523f',
        gasLimit: '0x52e4',
        fees: [
          {
            maxFeePerGas: '0x77c882ec',
            maxPriorityFeePerGas: '0x3b9aca04',
            gas: '0x52e4',
            balanceNeeded: '0x23adbb58458514',
            currentBalance: '0x512dc1cd5f29c5',
            error: '',
            tokenFees: [
              {
                token: {
                  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                  symbol: 'USDC',
                  decimals: 6,
                },
                balanceNeededToken: '0x9a0c8',
                currentBalanceToken: '0x4939709',
                serviceFee: '0x27f04',
                rateWei: '0x166d379dff854',
                error: '',
                feeRecipient: '0xe3478b0bb1a5084567c319096437924948be1964',
                transferEstimate: '0xb1e4',
                totalGas: '0x16670',
                isDelegationFee: false,
              },
              {
                token: {
                  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                  symbol: 'DAI',
                  decimals: 18,
                },
                balanceNeededToken: '0x7c2be6d16736c71',
                currentBalanceToken: '0x1182a0f168e59322',
                serviceFee: '0x20314ecdfe50942',
                rateWei: '0x166c44b2f0798',
                error: '',
                feeRecipient: '0xe3478b0bb1a5084567c319096437924948be1964',
                transferEstimate: '0x8912',
                totalGas: '0x13d9e',
                isDelegationFee: false,
              },
              {
                token: {
                  address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                  symbol: 'wETH',
                  decimals: 18,
                },
                balanceNeededToken: '0xc812eb43c251',
                currentBalanceToken: '0xb7a37bcf66059',
                serviceFee: '0x33defa9fca15',
                rateWei: '0xde0b6b3a7640000',
                error: '',
                feeRecipient: '0xe3478b0bb1a5084567c319096437924948be1964',
                transferEstimate: '0x8831',
                totalGas: '0x13cbd',
                isDelegationFee: false,
              },
            ],
          },
        ],
        stateDiff: {
          post: {
            '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1': {
              nonce: '0x2',
            },
          },
          pre: {
            '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1': {
              balance: '0x512dc1cd5f29c5',
              nonce: '0x1',
            },
          },
        },
        callTrace: {
          from: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
          to: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
          type: 'CALL',
          gas: '0x1dcd6500',
          gasUsed: '0x523f',
          value: '0x2386f26fc10000',
          input: '0x',
          output: '0x',
          error: '',
          calls: null,
        },
        feeEstimate: 34326107063180,
        baseFeePerGas: 630306675,
      },
    ],
    blockNumber: '0x15ae883',
    id: '56a61257-4843-42f6-9668-dd9e5260536f',
  },
  id: '14',
};

const SEND_TRANSACTION_RECEIPT = (txHash: string) => {
  return {
    jsonrpc: '2.0',
    id: 7409514442667716,
    result: {
      blockHash: BLOCK_HASH,
      blockNumber: '0x15afc03',
      contractAddress: null,
      cumulativeGasUsed: '0x1ee780',
      effectiveGasPrice: '0xa33f9084',
      from: '0xb0da5965d43369968574d399dbe6374683773a65',
      gasUsed: '0xb05c',
      logs: [
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          blockHash: BLOCK_HASH,
          blockNumber: '0x15afc03',
          data: '0x000000000000000000000000000000000000000000000000000000000010ad5a',
          logIndex: '0x36',
          removed: false,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x000000000000000000000000b0da5965d43369968574d399dbe6374683773a65',
            '0x000000000000000000000000e3478b0bb1a5084567c319096437924948be1964',
          ],
          transactionHash: txHash,
          transactionIndex: '0x1d',
        },
      ],
      logsBloom:
        '0x00000000000000000000010000000000000000000000000000000000000804000000000000000000000000000000000000000000000000000000000000000000000000000000000008000008000000000000000000000000000000000000000000000000000000000000000000000000900000000000000000000010000000000000000000000000000000000000000000000000010000000000000000000000000000000000200000000000000000000000000000000100000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      status: '0x1',
      to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      transactionHash:
        '0x5b45a6ee3aeee3659e456e3deff679d945e501f92a608aeb252be4a6023058c7',
      transactionIndex: '0x1d',
      type: '0x2',
    },
  };
};

const GET_BLOCK_BY_HASH_RESPONSE = {
  id: 2901696354742565,
  jsonrpc: '2.0',
  result: {
    baseFeePerGas: '0x123',
    timestamp: '123456789',
  },
};

export async function mockSmartTransactionRequests(mockServer: MockttpServer) {
  await mockSmartTransactionRequestsBase(mockServer);

  await mockEthDaiTrade(mockServer);

  await mockServer
    .forPost(
      'https://transaction.api.cx.metamask.io/networks/1/submitTransactions',
    )
    .once()
    .thenJson(200, { uuid: STX_UUID, txHashes: [TRANSACTION_HASH] });
}

export async function mockChooseGasFeeTokenRequests(mockServer: MockttpServer) {
  await mockSmartTransactionRequestsBase(mockServer);

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getTransactionReceipt',
      params: [FIRST_SEND_TRANSACTION_HASH],
    })
    .thenJson(200, SEND_TRANSACTION_RECEIPT(FIRST_SEND_TRANSACTION_HASH));

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getTransactionReceipt',
      params: [SECOND_SEND_TRANSACTION_HASH],
    })
    .thenJson(200, SEND_TRANSACTION_RECEIPT(SECOND_SEND_TRANSACTION_HASH));

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getBlockByHash',
      params: [BLOCK_HASH],
    })
    .thenJson(200, GET_BLOCK_BY_HASH_RESPONSE);

  await mockServer
    .forPost('https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io')
    .thenJson(200, TRANSACTION_SIMULATION_RESPONSE);

  await mockServer
    .forPost(
      'https://transaction.api.cx.metamask.io/networks/1/submitTransactions',
    )
    .once()
    .thenJson(200, { uuid: STX_UUID });
}

/**
 * Single quote payload for getQuoteStream (SSE data: field).
 * ETH 20 -> MUSD, pancakeswap. Used by "should Swap with gas included fee" test.
 */
const MOCK_ETH_MUSD_QUOTE_STREAM = [
  {
    quote: {
      requestId:
        '0x862b0cc5ecc6cbe511bedd5dfffaffbd68400255965c6594acb893c3df331964',
      bridgeId: 'pancakeswap',
      srcChainId: 1,
      destChainId: 1,
      aggregator: 'pancakeswap',
      aggregatorType: 'AGG',
      srcAsset: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        assetId: 'eip155:1/slip44:60',
        symbol: 'ETH',
        decimals: 18,
        name: 'Ether',
        coingeckoId: 'ethereum',
        aggregators: [],
        occurrences: 100,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
        metadata: {},
      },
      srcTokenAmount: '20000000000000000000',
      destAsset: {
        address: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
        chainId: 1,
        assetId: 'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da',
        symbol: 'MUSD',
        decimals: 6,
        name: 'MetaMask USD',
        coingeckoId: 'metamask-usd',
        aggregators: ['metamask', 'liFi', 'socket', 'rubic', 'rango'],
        occurrences: 5,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xaca92e438df0b2401ff60da7e4337b687a2435da.png',
        metadata: {},
      },
      destTokenAmount: '267044',
      minDestTokenAmount: '261703',
      walletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      destWalletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      feeData: {
        metabridge: {
          amount: '0',
          asset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1,
            assetId: 'eip155:1/slip44:60',
            symbol: 'ETH',
            decimals: 18,
            name: 'Ether',
            coingeckoId: 'ethereum',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
            metadata: {},
          },
          quoteBpsFee: 0,
          baseBpsFee: 87.5,
        },
      },
      bridges: ['pancakeswap'],
      protocols: ['pancakeswap'],
      steps: [],
      slippage: 2,
      gasSponsored: false,
      gasIncluded: true,
      gasIncluded7702: false,
      priceData: {
        totalFromAmountUsd: '46957',
        totalToAmountUsd: '0.26697990944',
        priceImpact: '0.007135438233346954',
        totalFeeAmountUsd: '0',
      },
    },
    trade: {
      chainId: 1,
      to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
      from: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      value: '0x1158e460913d00000',
      data: '0x5f57552900000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001158e460913d0000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001b70616e63616b6553776170526f7574657246656544796e616d6963000000000000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000aca92e438df0b2401ff60da7e4337b687a2435da000000000000000000000000000000000000000000000001158e460913d00000000000000000000000000000000000000000000000000000000000000003fe4700000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f326e4de8f66a0bdc0970b79e0924e33c79f1915000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000001158e460913d00000000000000000000000000000000000000000000000000000000000003feaf000000000000000000000000000000000000000000000000000000000000008000000000000000000000000074de5d4fcbf63e00296fd95d33236b97940166310000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000aca92e438df0b2401ff60da7e4337b687a2435da00000000000000000000000000000000000000000000000000000000060',
      gasLimit: 284508,
      effectiveGas: 204102,
    },
    estimatedProcessingTimeInSeconds: 0,
  },
];

export async function mockGasIncludedTransactionRequests(
  mockServer: MockttpServer,
) {
  await mockSmartTransactionRequestsBase(mockServer);

  await mockEthUsdcGasIncludedTrade(mockServer);

  // Sentinel /networks (sendBundle: true so quote request includes gasIncluded: true).
  await mockSentinelNetworks(mockServer);

  // Mock getQuoteStream (SSE) so the swap page receives a quote (ETH -> MUSD).
  await mockServer
    .forGet(/getQuoteStream/u)
    .thenStream(
      200,
      mockSseEventSource(MOCK_ETH_MUSD_QUOTE_STREAM),
      SSE_RESPONSE_HEADER,
    );

  await mockServer
    .forPost(
      'https://transaction.api.cx.metamask.io/networks/1/submitTransactions',
    )
    .once()
    .thenJson(200, { uuid: STX_UUID, txHashes: [TRANSACTION_HASH] });
}

export async function mockSmartTransactionBatchRequests(
  mockServer: MockttpServer,
  {
    error = false,
    transactionHashes,
  }: {
    error?: boolean;
    transactionHashes: string[];
  },
) {
  await mockSmartTransactionRequestsBase(mockServer);

  const submitStatusCode = error ? 500 : 200;

  const submitResponse = error
    ? {}
    : { uuid: STX_UUID, txHashes: transactionHashes };

  await mockServer
    .forPost(
      'https://transaction.api.cx.metamask.io/networks/1/submitTransactions',
    )
    .once()
    .thenJson(submitStatusCode, submitResponse);

  for (const transactionHash of transactionHashes) {
    await mockServer
      .forJsonRpcRequest({
        method: 'eth_getTransactionReceipt',
        params: [transactionHash],
      })
      .thenJson(200, GET_TRANSACTION_RECEIPT_RESPONSE);

    await mockServer
      .forJsonRpcRequest({
        method: 'eth_getTransactionByHash',
        params: [transactionHash],
      })
      .thenJson(200, GET_TRANSACTION_BY_HASH_RESPONSE);
  }
}

async function mockSmartTransactionRequestsBase(mockServer: MockttpServer) {
  await mockMultiNetworkBalancePolling(mockServer);

  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    ['eth_getBlockByNumber'],
    ['eth_chainId', { result: `0x1` }],
  ]);

  await mockServer
    .forPost('https://transaction.api.cx.metamask.io/networks/1/getFees')
    .thenJson(200, GET_FEES_RESPONSE);

  await mockServer
    .forGet('https://transaction.api.cx.metamask.io/networks/1/batchStatus')
    .withQuery({ uuids: STX_UUID })
    .once()
    .thenJson(200, GET_BATCH_STATUS_RESPONSE_PENDING);

  await mockServer
    .forGet('https://transaction.api.cx.metamask.io/networks/1/batchStatus')
    .withQuery({ uuids: STX_UUID })
    .once()
    .thenJson(200, GET_BATCH_STATUS_RESPONSE_SUCCESS);

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getTransactionReceipt',
      params: [TRANSACTION_HASH],
    })
    .thenJson(200, GET_TRANSACTION_RECEIPT_RESPONSE);

  // Catch-all: return success receipt for any other hash so the local tx confirms
  // when the extension polls (avoids duplicate Pending + API Confirmed in activity).
  await mockServer
    .forJsonRpcRequest({ method: 'eth_getTransactionReceipt' })
    .thenCallback(async (req) => {
      const body = (await req.body.getJson()) as { params?: [string] };
      const hash = body?.params?.[0] ?? TRANSACTION_HASH;
      const result = GET_TRANSACTION_RECEIPT_RESPONSE.result as {
        logs?: { transactionHash: string }[];
        [key: string]: unknown;
      };
      const resultWithHash = {
        ...result,
        transactionHash: hash,
        logs: result.logs?.map((log) => ({ ...log, transactionHash: hash })),
      };
      return {
        statusCode: 200,
        json: {
          ...GET_TRANSACTION_RECEIPT_RESPONSE,
          result: resultWithHash,
        },
      };
    });

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getTransactionByHash',
      params: [TRANSACTION_HASH],
    })
    .thenJson(200, GET_TRANSACTION_BY_HASH_RESPONSE);

  await mockServer
    .forJsonRpcRequest({
      method: 'eth_getBlockByHash',
      params: [BLOCK_HASH],
    })
    .thenJson(200, GET_BLOCK_BY_HASH_RESPONSE);
}

export async function mockSentinelNetworks(mockServer: MockttpServer) {
  await mockServer
    .forGet(`${TX_SENTINEL_URL}/networks`)
    .always()
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          '1': {
            network: 'ethereum-mainnet',
            confirmations: true,
            relayTransactions: true,
            sendBundle: true,
          },
        },
      };
    });
}

const SWAP_DAI_TOKEN = {
  assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  decimals: 18,
  iconUrl: null,
};

const SWAP_ETH_TOKEN = {
  assetId: 'eip155:1/slip44:60',
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  iconUrl: null,
};

/** Quote payload sent via mockSseEventSource for getQuoteStream (SSE data: field). */
const MOCK_ETH_DAI_QUOTE = [
  {
    quote: {
      requestId:
        '0xfc5d4833cfd92f7576d928d1d4ac7dc4a7f4d02099135b5bf1c80f4aa7cfe3ee',
      bridgeId: 'okx',
      srcChainId: 1,
      destChainId: 1,
      aggregator: 'okx',
      aggregatorType: 'AGG',
      srcAsset: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        assetId: 'eip155:1/slip44:60',
        symbol: 'ETH',
        decimals: 18,
        name: 'Ether',
        coingeckoId: 'ethereum',
        aggregators: [],
        occurrences: 100,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
        metadata: {},
      },
      srcTokenAmount: '1976004763624560573',
      destAsset: {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        chainId: 1,
        assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
        coingeckoId: 'dai',
        aggregators: [
          'metamask',
          'oneInch',
          'liFi',
          'socket',
          'rubic',
          'squid',
          'rango',
          'sonarwatch',
          'sushiSwap',
          'pmm',
          'bancor',
        ],
        occurrences: 11,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x6b175474e89094c44da98b954eedeac495271d0f.png',
        metadata: { storage: { balance: 2, approval: 3 } },
      },
      destTokenAmount: '4625979906416670820458',
      minDestTokenAmount: '4533460308288337404048',
      walletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      destWalletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      feeData: {
        txFee: {
          amount: '6495236375439427',
          maxFeePerGas: '2567253618',
          maxPriorityFeePerGas: '2100000004',
          asset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1,
            assetId: 'eip155:1/slip44:60',
            symbol: 'ETH',
            decimals: 18,
            name: 'Ether',
            coingeckoId: 'ethereum',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
            metadata: {},
          },
        },
        metabridge: {
          amount: '17500000000000000',
          asset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1,
            assetId: 'eip155:1/slip44:60',
            symbol: 'ETH',
            decimals: 18,
            name: 'Ether',
            coingeckoId: 'ethereum',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
            metadata: {},
          },
          baseBpsFee: 87.5,
        },
      },
      bridges: ['okx'],
      protocols: ['okx'],
      steps: [],
      slippage: 2,
      gasSponsored: false,
      gasIncluded: true,
      gasIncluded7702: false,
      priceData: {
        totalFromAmountUsd: '4674.28',
        totalToAmountUsd: '4625.855004959198',
        priceImpact: '0.007135438233346954',
        totalFeeAmountUsd: '40.899950000000004',
      },
    },
    trade: {
      chainId: 1,
      to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
      from: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
      value: '0x1baa5a053de417bd',
      data: '0x5f575529000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001baa5a053de417bd00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000046f6b7836000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000001b6c2ddcfa5257bd0000000000000000000000000000f5c26673160b38e0900000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000003e2c284391c000000000000000000000000000f326e4de8f66a0bdc0970b79e0924e33c79f191500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c24f2c42696000000000000000000000000000000000000000000000000000000000001b91d000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000001b6c2ddcfa5257bd0000000000000000000000000000f5c26673160b38e090000000000000000000000000000000000000000000069b8650f00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000008e000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000002000000000000000000ce937da1ffd21673aa1e063459873f30189a21930000000000000000000000006747bcaf9bd5a5f0758cbe08903490e45ddfacb50000000000000000000000000000000000000000000000000000000000000002000000000000000000ce937da1ffd21673aa1e063459873f30189a21930000000000000000000000006747bcaf9bd5a5f0758cbe08903490e45ddfacb50000000000000000000000000000000000000000000000000000000000000002000000000000000000125980bdf246b4aef9cfe4dd6eef153a1b645ac4bcbb6800000000000000000010178e0554a476a092703abdb3ef35c80e0d76d32939f00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000034000000000000000000000000000000000000000000000000000000000000002e0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000002600000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000003c4ac6b89f0c13000000000000000000000000000000000000000000000000000000000069b85723000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000cd81502214d405f40ff14884f2b3962a2f822d670000000000000000000000000000000000000000000000000000000108c8dbe10000000000000000000000000000000000000000000000001a64386d3ebbca670000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041735c24e3c53212b236bea2cde524c21dc77bf4cb7c915238d24714ff09b09cc7392fd2ebdeae435b832dad374f19bc6e3924dce8a736a084bae12f9dd9bcecc51b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000cd81502214d405f40ff14884f2b3962a2f822d670000000000000000000000000000000000000000000000000000000108c8dbe10000000000000000000000000000000000000000000000001a64386d3ebbca670000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041735c24e3c53212b236bea2cde524c21dc77bf4cb7c915238d24714ff09b09cc7392fd2ebdeae435b832dad374f19bc6e3924dce8a736a084bae12f9dd9bcecc51b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dc035d45d973e3ec169d2276ddab16f1e407384f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000004e3bcce28caf98a143fd8bd9e4875ccab3e7bbe000000000000000000000000000000000000000000000000000000000000000010000000000000000000000004e3bcce28caf98a143fd8bd9e4875ccab3e7bbe000000000000000000000000000000000000000000000000000000000000000018000000000000000020327108f42901cd498d45646783e8ba4c87b780b5c2b1f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000002000000000000000000000000dc035d45d973e3ec169d2276ddab16f1e407384f0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f7777777711118000000000000000000000000000000000fac65e1764dc6e486a777777771111000000000064fa00a9ed787f3793db668bff3e6e6e7db0f92a1b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026',
      gasLimit: 2530032,
      effectiveGas: 774866,
    },
    estimatedProcessingTimeInSeconds: 0,
  },
];

function mockSseEventSource(mockQuotes: unknown[], delay: number = 2000) {
  let index = 0;
  return Readable.fromWeb(
    new ReadableStreamWeb({
      async pull(controller) {
        if (index === mockQuotes.length) {
          controller.close();
          return;
        }
        const quote = mockQuotes[index];
        controller.enqueue(Buffer.from(`event: quote\n`));
        controller.enqueue(
          Buffer.from(`id: ${Date.now().toString()}-${index + 1}\n`),
        );
        controller.enqueue(Buffer.from(`data: ${JSON.stringify(quote)}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, delay));
        index += 1;
      },
    }),
  );
}

export async function mockSwapTokensMockApis(mockServer: MockttpServer) {
  await mockServer.forPost(/getTokens\/popular/u).thenCallback(() => ({
    statusCode: 200,
    json: [SWAP_ETH_TOKEN, SWAP_DAI_TOKEN],
  }));

  await mockServer.forPost(/getTokens\/search/u).thenCallback(() => ({
    statusCode: 200,
    json: {
      data: [SWAP_ETH_TOKEN, SWAP_DAI_TOKEN],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  }));

  // Mock getQuoteStream (SSE) for when SSE is enabled
  await mockServer
    .forGet(/getQuoteStream/u)
    .once()
    .withQuery({
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    })
    .thenStream(
      200,
      mockSseEventSource(MOCK_ETH_DAI_QUOTE),
      SSE_RESPONSE_HEADER,
    );

  // Mock getQuote (non-SSE) so the test passes when the extension uses the non-SSE path
  // (e.g. when client version fails sse.minimumVersion or default flags mock is used)
  await mockServer
    .forGet(/getQuote(?!Stream)/u)
    .withQuery({
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: MOCK_ETH_DAI_QUOTE,
    }));
}

const SWAP_ACCOUNT_ADDRESS = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

/**
 * One completed "Swap ETH to DAI" transaction in accounts API v4 format.
 * Activity list uses this API; default mock returns empty data, so we override
 * to show the swap as completed.
 */
const MOCK_ACCOUNTS_API_SWAP_TX = {
  hash: TRANSACTION_HASH,
  timestamp: new Date().toISOString(),
  chainId: 1,
  accountId: `eip155:1:${SWAP_ACCOUNT_ADDRESS}`,
  blockNumber: 24384555,
  blockHash: BLOCK_HASH,
  gas: 2530032,
  gasUsed: 774866,
  gasPrice: '2657647800',
  effectiveGasPrice: '2657647800',
  nonce: 0,
  cumulativeGasUsed: 19094274,
  methodId: null,
  value: '0',
  to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
  from: SWAP_ACCOUNT_ADDRESS,
  isError: false,
  valueTransfers: [
    {
      from: SWAP_ACCOUNT_ADDRESS,
      to: '0x6b175474e89094c44da98b954eedeac495271d0f',
      amount: '2000000000000000000',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ether',
      transferType: 'normal',
    },
    {
      from: '0x6b175474e89094c44da98b954eedeac495271d0f',
      to: SWAP_ACCOUNT_ADDRESS,
      amount: '4625979906416670820458',
      decimal: 18,
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      transferType: 'normal',
    },
  ],
  logs: [],
  transactionType: 'SWAP',
  transactionCategory: 'SWAP',
  readable: 'Swap ETH to DAI',
};

export async function mockAccountsApiSwapTransaction(
  mockServer: MockttpServer,
): Promise<void> {
  await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v4/multiaccount/transactions')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: [MOCK_ACCOUNTS_API_SWAP_TX],
        pageInfo: { hasNextPage: false, count: 1 },
      },
    }));
}
