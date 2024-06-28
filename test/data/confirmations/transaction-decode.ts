import { DecodedTransactionDataSource } from '../../../shared/types/transaction-decode';

export const CONTRACT_ADDRESS_MOCK_UNISWAP = '0x1';
export const CONTRACT_ADDRESS_MOCK_SOURCIFY = '0x2';
export const CONTRACT_ADDRESS_MOCK_FOUR_BYTE = '0x3';

export const TRANSACTION_DECODE_MOCK_UNISWAP = {
  source: DecodedTransactionDataSource.Uniswap,
  data: [
    {
      name: 'WRAP_ETH',
      params: [
        {
          name: 'recipient',
          type: 'address',
          value: '0x0000000000000000000000000000000000000002',
          description: 'The recipient of the WETH',
        },
        {
          name: 'amountMin',
          type: 'uint256',
          value: 123456,
          description: 'The amount of ETH to wrap',
        },
      ],
    },
    {
      name: 'V3_SWAP_EXACT_IN',
      params: [
        {
          name: 'recipient',
          type: 'address',
          value: '0x0000000000000000000000000000000000000002',
          description: 'The recipient of the output of the trade',
        },
        {
          name: 'amountIn',
          type: 'uint256',
          value: 123456,
          description: 'The amount of input tokens for the trade',
        },
        {
          name: 'amountOutMin',
          type: 'uint256',
          value: 123456,
          description: 'The minimum amount of output tokens the user wants',
        },
        {
          name: 'path',
          type: 'bytes',
          value: [
            {
              firstAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
              tickSpacing: 500,
              secondAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            },
            {
              firstAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              tickSpacing: 100,
              secondAddress: '0xd02aaa39b223fe8d0a0e5c4f27ead9083c756cc3',
            },
          ],
          description: 'The UniswapV3 encoded path to trade along',
        },
        {
          name: 'payerIsUser',
          type: 'bool',
          value: false,
          description:
            'A flag for whether the input tokens should come from the msg.sender (through Permit2) or whether the funds are already in the UniversalRouter',
        },
      ],
    },
    {
      name: 'PAY_PORTION',
      params: [
        {
          name: 'token',
          type: 'address',
          value: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          description: 'The ERC20 token to transfer (or Constants.ETH for ETH)',
        },
        {
          name: 'recipient',
          type: 'address',
          value: '0x27213E28D7fDA5c57Fe9e5dD923818DBCcf71c47',
          description: 'The recipient of the transfer',
        },
        {
          name: 'bips',
          type: 'uint256',
          value: 123456,
          description:
            'In basis points, the percentage of the contract’s balance to transfer',
        },
      ],
    },
    {
      name: 'SWEEP',
      params: [
        {
          name: 'token',
          type: 'address',
          value: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          description: 'The ERC20 token to sweep (or Constants.ETH for ETH)',
        },
        {
          name: 'recipient',
          type: 'address',
          value: '0x0000000000000000000000000000000000000001',
          description: 'The recipient of the sweep',
        },
        {
          name: 'amountMin',
          type: 'uint256',
          value: 123456,
          description: 'The minimum required tokens to receive from the sweep',
        },
      ],
    },
  ],
};

export const TRANSACTION_DECODE_MOCK_SOURCIFY = {
  source: DecodedTransactionDataSource.Sourcify,
  data: [
    {
      name: 'cancelAuthorization',
      description: 'Attempt to cancel an authorization',
      params: [
        {
          name: 'authorizer',
          description: "Authorizer's address",
          type: 'address',
          value: '0xB0dA5965D43369968574D399dBe6374683773a65',
        },
        {
          name: 'nonce',
          description: 'Nonce of the authorization',
          type: 'bytes32',
          value:
            '0x0000000000000000000000000000000000000000000000000000000000000123',
        },
        {
          name: 'signature',
          description:
            'Signature bytes signed by an EOA wallet or a contract wallet',
          type: 'bytes',
          value: '0x0456',
        },
      ],
    },
  ],
};

export const TRANSACTION_DECODE_MOCK_FOUR_BYTE = {
  source: DecodedTransactionDataSource.FourByte,
  data: [
    {
      name: 'someFunction',
      params: [
        {
          type: 'uint256',
          value: 123456,
        },
        {
          type: 'address',
          value: '0x1234567890123456789012345678901234567890',
        },
        {
          type: 'bytes',
          value: '0x123',
        },
      ],
    },
  ],
};
