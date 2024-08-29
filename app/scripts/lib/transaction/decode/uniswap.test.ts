import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { TRANSACTION_DATA_UNISWAP } from '../../../../../test/data/confirmations/transaction-decode';
import {
  UNISWAP_UNIVERSAL_ROUTER_ADDRESSES,
  decodeUniswapRouterTransactionData,
} from './uniswap';

describe('Uniswap', () => {
  describe('decodeUniswapRouterTransactionData', () => {
    it('returns undefined if invalid data', () => {
      expect(
        decodeUniswapRouterTransactionData({
          transactionData: '0x123',
          contractAddress:
            UNISWAP_UNIVERSAL_ROUTER_ADDRESSES[CHAIN_IDS.MAINNET][0],
          chainId: CHAIN_IDS.MAINNET,
        }),
      ).toBeUndefined();
    });

    it('returns undefined if contract address does not match chain', () => {
      expect(
        decodeUniswapRouterTransactionData({
          transactionData: TRANSACTION_DATA_UNISWAP,
          contractAddress: '0x123',
          chainId: CHAIN_IDS.MAINNET,
        }),
      ).toBeUndefined();
    });

    it('returns expected commands', () => {
      expect(
        decodeUniswapRouterTransactionData({
          transactionData: TRANSACTION_DATA_UNISWAP,
          contractAddress:
            UNISWAP_UNIVERSAL_ROUTER_ADDRESSES[CHAIN_IDS.MAINNET][0],
          chainId: CHAIN_IDS.MAINNET,
        }),
      ).toMatchInlineSnapshot(`
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
                "value": [
                  {
                    "firstAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                    "secondAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    "tickSpacing": 500,
                  },
                ],
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
