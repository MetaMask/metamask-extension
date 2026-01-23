import { createBridgeMockStore } from '../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { useMultichainBalances } from './useMultichainBalances';

describe('useMultichainBalances', () => {
  it('should return the native token of each imported network when no token balances are cached', () => {
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        allTokens: {},
      },
    });
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.assetsWithBalance).toHaveLength(6);
    expect(result.current.assetsWithBalance).toMatchInlineSnapshot(`
      [
        {
          "address": "",
          "balance": "1.00001",
          "chainId": "0xe708",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "Linea",
          "secondary": 0,
          "string": "1.00001",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 2524.2752425000003,
          "type": "NATIVE",
        },
        {
          "address": "",
          "balance": "1.00001",
          "chainId": "0xa",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "OP",
          "secondary": 0,
          "string": "1.00001",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 2524.2752425000003,
          "type": "NATIVE",
        },
        {
          "accountType": undefined,
          "address": "501",
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
          "balance": "1.530",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 18,
          "image": "",
          "isNative": true,
          "string": "1.530",
          "symbol": "SOL",
          "tokenFiatAmount": 210.8493,
          "type": "NATIVE",
        },
        {
          "accountType": "bip122:p2wpkh",
          "address": "0",
          "assetId": "bip122:000000000019d6689c085ae165831e93/slip44:0",
          "balance": ".001",
          "chainId": "bip122:000000000019d6689c085ae165831e93",
          "decimals": 18,
          "image": "",
          "isNative": true,
          "string": ".001",
          "symbol": "BTC",
          "tokenFiatAmount": 91.238,
          "type": "NATIVE",
        },
        {
          "address": "",
          "balance": "0.01",
          "chainId": "0x1",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "Ethereum",
          "secondary": 0,
          "string": "0.01",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 25.2425,
          "type": "NATIVE",
        },
        {
          "accountType": undefined,
          "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "balance": "2.043238",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 6,
          "image": "",
          "isNative": false,
          "string": "2.043238",
          "symbol": "USDC",
          "tokenFiatAmount": 2.04284978478,
          "type": "TOKEN",
        },
      ]
    `);
  });

  it('should return a list of assets with balances', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.assetsWithBalance).toHaveLength(9);
    expect(result.current.assetsWithBalance).toMatchInlineSnapshot(`
      [
        {
          "address": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
          "balance": "1",
          "chainId": "0x1",
          "isNative": false,
          "secondary": 0,
          "string": "1",
          "title": undefined,
          "tokenFiatAmount": 3029.1,
          "type": "TOKEN",
        },
        {
          "address": "",
          "balance": "1.00001",
          "chainId": "0xe708",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "Linea",
          "secondary": 0,
          "string": "1.00001",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 2524.2752425000003,
          "type": "NATIVE",
        },
        {
          "address": "",
          "balance": "1.00001",
          "chainId": "0xa",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "OP",
          "secondary": 0,
          "string": "1.00001",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 2524.2752425000003,
          "type": "NATIVE",
        },
        {
          "accountType": undefined,
          "address": "501",
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
          "balance": "1.530",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 18,
          "image": "",
          "isNative": true,
          "string": "1.530",
          "symbol": "SOL",
          "tokenFiatAmount": 210.8493,
          "type": "NATIVE",
        },
        {
          "accountType": "bip122:p2wpkh",
          "address": "0",
          "assetId": "bip122:000000000019d6689c085ae165831e93/slip44:0",
          "balance": ".001",
          "chainId": "bip122:000000000019d6689c085ae165831e93",
          "decimals": 18,
          "image": "",
          "isNative": true,
          "string": ".001",
          "symbol": "BTC",
          "tokenFiatAmount": 91.238,
          "type": "NATIVE",
        },
        {
          "address": "",
          "balance": "0.01",
          "chainId": "0x1",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "Ethereum",
          "secondary": 0,
          "string": "0.01",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 25.2425,
          "type": "NATIVE",
        },
        {
          "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          "balance": "0.00184",
          "chainId": "0x1",
          "decimals": 6,
          "isNative": false,
          "secondary": 0,
          "string": "0.00184",
          "title": undefined,
          "tokenFiatAmount": 10.682625999999999,
          "type": "TOKEN",
        },
        {
          "accountType": undefined,
          "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "balance": "2.043238",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 6,
          "image": "",
          "isNative": false,
          "string": "2.043238",
          "symbol": "USDC",
          "tokenFiatAmount": 2.04284978478,
          "type": "TOKEN",
        },
        {
          "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          "balance": "0",
          "chainId": "0xe708",
          "isNative": false,
          "secondary": 0,
          "string": "0",
          "title": undefined,
          "tokenFiatAmount": 0,
          "type": "TOKEN",
        },
      ]
    `);
  });

  it('should return a mapping of chainId to balance', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.balanceByChainId).toMatchInlineSnapshot(`
      {
        "0x1": 3065.0251259999995,
        "0xa": 2524.2752425000003,
        "0xe708": 2524.2752425000003,
        "bip122:000000000019d6689c085ae165831e93": 91.238,
        "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": 212.89214978478,
      }
    `);
  });
});
