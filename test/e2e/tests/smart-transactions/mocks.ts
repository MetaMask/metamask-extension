import { MockttpServer } from 'mockttp';
import { mockEthDaiTrade, mockEthUsdcGasIncludedTrade } from '../swaps/shared';
import { mockMultiNetworkBalancePolling } from '../../mock-balance-polling/mock-balance-polling';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';

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
    .thenJson(200, { uuid: STX_UUID });
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

export async function mockGasIncludedTransactionRequests(
  mockServer: MockttpServer,
) {
  await mockSmartTransactionRequestsBase(mockServer);

  await mockEthUsdcGasIncludedTrade(mockServer);

  await mockServer
    .forPost(
      'https://transaction.api.cx.metamask.io/networks/1/submitTransactions',
    )
    .once()
    .thenJson(200, { uuid: STX_UUID });
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
