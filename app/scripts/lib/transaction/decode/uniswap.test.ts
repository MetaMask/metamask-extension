import {
  decodeUniswapPath,
  decodeUniswapRouterTransactionData,
} from './uniswap';

const TRANSACTION_DATA_MOCK =
  '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006679b4bb00000000000000000000000000000000000000000000000000000000000000040b000604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000005af3107a40000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000000000000004c41800000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000027213e28d7fda5c57fe9e5dd923818dbccf71c4700000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000004c418';

const RAW_PATH_MOCK =
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

describe('Uniswap', () => {
  describe('decodeUniswapPath', () => {
    it('returns expected pools', () => {
      expect(decodeUniswapPath(RAW_PATH_MOCK)).toMatchInlineSnapshot(`
        [
          {
            "firstAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            "secondAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "tickSpacing": 500,
          },
        ]
      `);
    });
  });

  describe('decodeUniswapRouterTransactionData', () => {
    it('returns undefined for invalid data', () => {
      expect(decodeUniswapRouterTransactionData('0x123')).toBeUndefined();
    });

    it('returns expected commands', () => {
      expect(decodeUniswapRouterTransactionData(TRANSACTION_DATA_MOCK))
        .toMatchInlineSnapshot(`
                  [
                    {
                      "name": "WRAP_ETH",
                      "params": [
                        {
                          "description": "The recipient of the WETH",
                          "name": "recipient",
                          "type": "address",
                          "value": "0x0000000000000000000000000000000000000002",
                        },
                        {
                          "description": "The amount of ETH to wrap",
                          "name": "amountMin",
                          "type": "uint256",
                          "value": {
                            "hex": "0x5af3107a4000",
                            "type": "BigNumber",
                          },
                        },
                      ],
                    },
                    {
                      "name": "V3_SWAP_EXACT_IN",
                      "params": [
                        {
                          "description": "The recipient of the output of the trade",
                          "name": "recipient",
                          "type": "address",
                          "value": "0x0000000000000000000000000000000000000002",
                        },
                        {
                          "description": "The amount of input tokens for the trade",
                          "name": "amountIn",
                          "type": "uint256",
                          "value": {
                            "hex": "0x5af3107a4000",
                            "type": "BigNumber",
                          },
                        },
                        {
                          "description": "The minimum amount of output tokens the user wants",
                          "name": "amountOutMin",
                          "type": "uint256",
                          "value": {
                            "hex": "0x04c418",
                            "type": "BigNumber",
                          },
                        },
                        {
                          "description": "The UniswapV3 encoded path to trade along",
                          "name": "path",
                          "type": "bytes",
                          "value": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                        },
                        {
                          "description": "A flag for whether the input tokens should come from the msg.sender (through Permit2) or whether the funds are already in the UniversalRouter",
                          "name": "payerIsUser",
                          "type": "bool",
                          "value": false,
                        },
                      ],
                    },
                    {
                      "name": "PAY_PORTION",
                      "params": [
                        {
                          "description": "The ERC20 token to transfer (or Constants.ETH for ETH)",
                          "name": "token",
                          "type": "address",
                          "value": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                        },
                        {
                          "description": "The recipient of the transfer",
                          "name": "recipient",
                          "type": "address",
                          "value": "0x27213E28D7fDA5c57Fe9e5dD923818DBCcf71c47",
                        },
                        {
                          "description": "In basis points, the percentage of the contract’s balance to transfer",
                          "name": "bips",
                          "type": "uint256",
                          "value": {
                            "hex": "0x19",
                            "type": "BigNumber",
                          },
                        },
                      ],
                    },
                    {
                      "name": "SWEEP",
                      "params": [
                        {
                          "description": "The ERC20 token to sweep (or Constants.ETH for ETH)",
                          "name": "token",
                          "type": "address",
                          "value": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                        },
                        {
                          "description": "The recipient of the sweep",
                          "name": "recipient",
                          "type": "address",
                          "value": "0x0000000000000000000000000000000000000001",
                        },
                        {
                          "description": "The minimum required tokens to receive from the sweep",
                          "name": "amountMin",
                          "type": "uint256",
                          "value": {
                            "hex": "0x04c418",
                            "type": "BigNumber",
                          },
                        },
                      ],
                    },
                  ]
              `);
    });
  });
});
