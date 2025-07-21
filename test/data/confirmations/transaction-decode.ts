import { DecodedTransactionDataSource } from '../../../shared/types/transaction-decode';

export const CONTRACT_ADDRESS_UNISWAP =
  '0x1111111111111111111111111111111111111111';

export const CONTRACT_ADDRESS_SOURCIFY =
  '0x2222222222222222222222222222222222222222';

export const CONTRACT_ADDRESS_FOUR_BYTE =
  '0x3333333333333333333333333333333333333333';

export const TRANSACTION_DATA_UNISWAP =
  '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006679b4bb00000000000000000000000000000000000000000000000000000000000000040b000604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000005af3107a40000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000000000000004c41800000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000027213e28d7fda5c57fe9e5dd923818dbccf71c4700000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000004c418';

export const TRANSACTION_DATA_SOURCIFY =
  '0xa9059cbb000000000000000000000000ec8507ecf7e946992294f06423a79835a32268460000000000000000000000000000000000000000000000000000000000000064';

export const TRANSACTION_DATA_SOURCIFY_NESTED =
  '0x2a2d80d1000000000000000000000000be3be93ffad7d417c08124b43286f4476c006afe000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002600000000000000000000000000000000000000000000000000000000000000060000000000000000000000000cc97f2e548ab94f40e5adf473f596ced83b6ee0a0000000000000000000000000000000000000000000000000000019747f66fc300000000000000000000000000000000000000000000000000000000000000030000000000000000000000000305f515fa978cf87226cf8a9776d25bcfb2cc0b000000000000000000000000ffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000019747f66fc300000000000000000000000000000000000000000000000000000000000000000000000000000000000000004385328cc4d643ca98dfea734360c0f596c83449000000000000000000000000ffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000019747f66fc30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000ffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000019747f66fc30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004156e1fabfaf96d309b0039896d1f68b51e27f0e25b4481db8cad059b7e8db95d918bdc43ab1d03a0b6a84c7ea2219bf01133ceab4e7ca4e38055e4ed8af78a63b1b00000000000000000000000000000000000000000000000000000000000000';

export const TRANSACTION_DATA_FOUR_BYTE =
  '0x12345678000000000000000000000000ec8507ecf7e946992294f06423a79835a32268460000000000000000000000000000000000000000000000000000000000000064';

export const TRANSACTION_DECODE_UNISWAP = {
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
          children: undefined,
        },
        {
          name: 'amountMin',
          type: 'uint256',
          value: 123456,
          description: 'The amount of ETH to wrap',
          children: undefined,
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
          children: undefined,
        },
        {
          name: 'amountIn',
          type: 'uint256',
          value: 123456,
          description: 'The amount of input tokens for the trade',
          children: undefined,
        },
        {
          name: 'amountOutMin',
          type: 'uint256',
          value: 123456,
          description: 'The minimum amount of output tokens the user wants',
          children: undefined,
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
          children: undefined,
        },
        {
          name: 'payerIsUser',
          type: 'bool',
          value: false,
          description:
            'A flag for whether the input tokens should come from the msg.sender (through Permit2) or whether the funds are already in the UniversalRouter',
          children: undefined,
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
          children: undefined,
        },
        {
          name: 'recipient',
          type: 'address',
          value: '0x27213E28D7fDA5c57Fe9e5dD923818DBCcf71c47',
          description: 'The recipient of the transfer',
          children: undefined,
        },
        {
          name: 'bips',
          type: 'uint256',
          value: 123456,
          description:
            'In basis points, the percentage of the contract’s balance to transfer',
          children: undefined,
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
          children: undefined,
        },
        {
          name: 'recipient',
          type: 'address',
          value: '0x0000000000000000000000000000000000000001',
          description: 'The recipient of the sweep',
          children: undefined,
        },
        {
          name: 'amountMin',
          type: 'uint256',
          value: 123456,
          description: 'The minimum required tokens to receive from the sweep',
          children: undefined,
        },
      ],
    },
  ],
};

export const TRANSACTION_DECODE_SOURCIFY = {
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
          children: undefined,
        },
        {
          name: 'nonce',
          description: 'Nonce of the authorization',
          type: 'bytes32',
          value:
            '0x0000000000000000000000000000000000000000000000000000000000000123',
          children: undefined,
        },
        {
          name: 'signature',
          description:
            'Signature bytes signed by an EOA wallet or a contract wallet',
          type: 'bytes',
          value: '0x0456',
          children: undefined,
        },
      ],
    },
  ],
};

export const TRANSACTION_DECODE_FOUR_BYTE = {
  source: DecodedTransactionDataSource.FourByte,
  data: [
    {
      name: 'someFunction',
      params: [
        {
          children: undefined,
          type: 'uint256',
          value: 123456,
        },
        {
          children: undefined,
          type: 'address',
          value: '0x1234567890123456789012345678901234567890',
        },
        {
          children: undefined,
          type: 'bytes',
          value: '0x123',
        },
      ],
    },
  ],
};

export const TRANSACTION_DECODE_NESTED = {
  source: DecodedTransactionDataSource.Sourcify,
  data: [
    {
      description:
        "Permit a spender to the signed amounts of the owners tokens via the owner's EIP-712 signature",
      name: 'permit',
      params: [
        {
          children: undefined,
          description: 'The owner of the tokens being approved',
          name: 'owner',
          type: 'address',
          value: '0xBe3be93fFAD7d417C08124B43286f4476C006AFe',
        },
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      children: undefined,
                      description: undefined,
                      name: 'token',
                      type: 'address',
                      value: '0x0305f515fa978cf87226cf8A9776D25bcfb2Cc0B',
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'amount',
                      type: 'uint160',
                      value: '0xffffffffffffffffffffffffffffffffffffffff',
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'expiration',
                      type: 'uint48',
                      value: 1749259022275,
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'nonce',
                      type: 'uint48',
                      value: 0,
                    },
                  ],
                  description: undefined,
                  name: 'Item 1',
                  type: 'tuple',
                  value: [
                    '0x0305f515fa978cf87226cf8A9776D25bcfb2Cc0B',
                    '0xffffffffffffffffffffffffffffffffffffffff',
                    1749259022275,
                    0,
                  ],
                },
                {
                  children: [
                    {
                      children: undefined,
                      description: undefined,
                      name: 'token',
                      type: 'address',
                      value: '0x4385328cc4D643Ca98DfEA734360C0F596C83449',
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'amount',
                      type: 'uint160',
                      value: '0xffffffffffffffffffffffffffffffffffffffff',
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'expiration',
                      type: 'uint48',
                      value: 1749259022275,
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'nonce',
                      type: 'uint48',
                      value: 0,
                    },
                  ],
                  description: undefined,
                  name: 'Item 2',
                  type: 'tuple',
                  value: [
                    '0x4385328cc4D643Ca98DfEA734360C0F596C83449',
                    '0xffffffffffffffffffffffffffffffffffffffff',
                    1749259022275,
                    0,
                  ],
                },
                {
                  children: [
                    {
                      children: undefined,
                      description: undefined,
                      name: 'token',
                      type: 'address',
                      value: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'amount',
                      type: 'uint160',
                      value: '0xffffffffffffffffffffffffffffffffffffffff',
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'expiration',
                      type: 'uint48',
                      value: 1749259022275,
                    },
                    {
                      children: undefined,
                      description: undefined,
                      name: 'nonce',
                      type: 'uint48',
                      value: 0,
                    },
                  ],
                  description: undefined,
                  name: 'Item 3',
                  type: 'tuple',
                  value: [
                    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                    '0xffffffffffffffffffffffffffffffffffffffff',
                    1749259022275,
                    0,
                  ],
                },
              ],
              description: undefined,
              name: 'details',
              type: 'tuple[]',
              value: [
                [
                  '0x0305f515fa978cf87226cf8A9776D25bcfb2Cc0B',
                  '0xffffffffffffffffffffffffffffffffffffffff',
                  1749259022275,
                  0,
                ],
                [
                  '0x4385328cc4D643Ca98DfEA734360C0F596C83449',
                  '0xffffffffffffffffffffffffffffffffffffffff',
                  1749259022275,
                  0,
                ],
                [
                  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                  '0xffffffffffffffffffffffffffffffffffffffff',
                  1749259022275,
                  0,
                ],
              ],
            },
            {
              children: undefined,
              description: undefined,
              name: 'spender',
              type: 'address',
              value: '0xCC97F2E548ab94F40e5ADf473F596CEd83B6ee0a',
            },
            {
              children: undefined,
              description: undefined,
              name: 'sigDeadline',
              type: 'uint256',
              value: '0x019747f66fc3',
            },
          ],
          description:
            'Data signed over by the owner specifying the terms of approval',
          name: 'permitBatch',
          type: 'tuple',
          value: [
            [
              [
                '0x0305f515fa978cf87226cf8A9776D25bcfb2Cc0B',
                '0xffffffffffffffffffffffffffffffffffffffff',
                1749259022275,
                0,
              ],
              [
                '0x4385328cc4D643Ca98DfEA734360C0F596C83449',
                '0xffffffffffffffffffffffffffffffffffffffff',
                1749259022275,
                0,
              ],
              [
                '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                '0xffffffffffffffffffffffffffffffffffffffff',
                1749259022275,
                0,
              ],
            ],
            '0xCC97F2E548ab94F40e5ADf473F596CEd83B6ee0a',
            '0x019747f66fc3',
          ],
        },
        {
          children: undefined,
          description: "The owner's signature over the permit data",
          name: 'signature',
          type: 'bytes',
          value:
            '0x56e1fabfaf96d309b0039896d1f68b51e27f0e25b4481db8cad059b7e8db95d918bdc43ab1d03a0b6a84c7ea2219bf01133ceab4e7ca4e38055e4ed8af78a63b1b',
        },
      ],
    },
  ],
};

export const SOURCIFY_RESPONSE = {
  files: [
    {
      name: 'metadata.json',
      content: JSON.stringify({
        output: {
          abi: [
            {
              constant: false,
              inputs: [
                {
                  name: 'to',
                  type: 'address',
                },
                {
                  name: 'value',
                  type: 'uint256',
                },
              ],
              name: 'transfer',
              outputs: [
                {
                  name: 'success',
                  type: 'bool',
                },
              ],
              payable: false,
              type: 'function',
            },
          ],
          userdoc: {
            methods: {
              'transfer(address,uint256)': {
                notice: 'Transfer tokens',
                params: {
                  to: 'The address to transfer to',
                  value: 'The amount to transfer',
                },
              },
            },
          },
        },
      }),
    },
  ],
};

export const SOURCIFY_RESPONSE_NESTED = {
  files: [
    {
      name: 'metadata.json',
      content: JSON.stringify({
        output: {
          abi: [
            {
              inputs: [
                {
                  internalType: 'address',
                  name: 'owner',
                  type: 'address',
                },
                {
                  components: [
                    {
                      components: [
                        {
                          internalType: 'address',
                          name: 'token',
                          type: 'address',
                        },
                        {
                          internalType: 'uint160',
                          name: 'amount',
                          type: 'uint160',
                        },
                        {
                          internalType: 'uint48',
                          name: 'expiration',
                          type: 'uint48',
                        },
                        {
                          internalType: 'uint48',
                          name: 'nonce',
                          type: 'uint48',
                        },
                      ],
                      internalType: 'struct IAllowanceTransfer.PermitDetails[]',
                      name: 'details',
                      type: 'tuple[]',
                    },
                    {
                      internalType: 'address',
                      name: 'spender',
                      type: 'address',
                    },
                    {
                      internalType: 'uint256',
                      name: 'sigDeadline',
                      type: 'uint256',
                    },
                  ],
                  internalType: 'struct IAllowanceTransfer.PermitBatch',
                  name: 'permitBatch',
                  type: 'tuple',
                },
                {
                  internalType: 'bytes',
                  name: 'signature',
                  type: 'bytes',
                },
              ],
              name: 'permit',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          devdoc: {
            methods: {
              'permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)':
                {
                  details:
                    "May fail if the owner's nonce was invalidated in-flight by invalidateNonce",
                  params: {
                    owner: 'The owner of the tokens being approved',
                    permitBatch:
                      'Data signed over by the owner specifying the terms of approval',
                    signature: "The owner's signature over the permit data",
                  },
                },
            },
          },
          userdoc: {
            methods: {
              'permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)':
                {
                  notice:
                    "Permit a spender to the signed amounts of the owners tokens via the owner's EIP-712 signature",
                },
            },
            notice:
              'Permit2 handles signature-based transfers in SignatureTransfer and allowance-based transfers in AllowanceTransfer.',
          },
        },
      }),
    },
  ],
};

export const FOUR_BYTE_RESPONSE = {
  results: [
    {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      created_at: '2022-09-01T00:00:00.000Z',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      text_signature: 'someFunction(address,uint256)',
    },
    {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      created_at: '2021-09-01T00:00:00.000Z',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      text_signature: 'someOtherFunction(address,uint256)',
    },
  ],
};

export const FOUR_BYTE_RESPONSE_NESTED = {
  results: [
    {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      created_at: '2022-09-01T00:00:00.000Z',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      text_signature:
        'permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)',
    },
  ],
};
