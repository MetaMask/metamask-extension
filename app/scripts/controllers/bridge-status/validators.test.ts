import { validateResponse } from '../../../../ui/pages/bridge/bridge.util';
import { StatusResponse } from './types';
import { validators } from './validators';

const VALID_BRIDGE_TX_STATUS_RESPONSE = {
  status: 'COMPLETE',
  isExpectedToken: true,
  bridge: 'across',
  srcChain: {
    chainId: 10,
    txHash:
      '0x9fdc426692aba1f81e145834602ed59ed331054e5b91a09a673cb12d4b4f6a33',
    amount: '4956250000000000',
    token: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 10,
      symbol: 'ETH',
      decimals: 18,
      name: 'ETH',
      coinKey: 'ETH',
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      priceUSD: '2649.21',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
  },
  destChain: {
    chainId: '42161',
    txHash:
      '0x3a494e672717f9b1f2b64a48a19985842d82d0747400fccebebc7a4e99c8eaab',
    amount: '4926701727965948',
    token: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 42161,
      symbol: 'ETH',
      decimals: 18,
      name: 'ETH',
      coinKey: 'ETH',
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      priceUSD: '2648.72',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
  },
};

const VALID_BRIDGE_TX_STATUS_RESPONSE_2 = {
  status: 'COMPLETE',
  bridge: 'across',
  srcChain: {
    chainId: 10,
    txHash:
      '0x9fdc426692aba1f81e145834602ed59ed331054e5b91a09a673cb12d4b4f6a33',
    amount: '4956250000000000',
    token: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 10,
      symbol: 'ETH',
      decimals: 18,
      name: 'ETH',
      coinKey: 'ETH',
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      priceUSD: '2649.21',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
  },
  destChain: {
    chainId: '42161',
    txHash:
      '0x3a494e672717f9b1f2b64a48a19985842d82d0747400fccebebc7a4e99c8eaab',
    amount: '4926701727965948',
    token: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 42161,
      symbol: 'ETH',
      decimals: 18,
      name: 'ETH',
      coinKey: 'ETH',
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      priceUSD: '2648.72',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
  },
};

const BRIDGE_TX_STATUS_RESPONSE_MISSING_FIELDS = {
  status: 'COMPLETE',
  isExpectedToken: true,
  bridge: 'across',
};

describe('validators', () => {
  describe('bridgeStatusValidator', () => {
    it.each([
      {
        input: VALID_BRIDGE_TX_STATUS_RESPONSE,
        expected: true,
        description: 'valid bridge status',
      },
      {
        input: BRIDGE_TX_STATUS_RESPONSE_MISSING_FIELDS,
        expected: false,
        description: 'missing fields',
      },
      {
        input: VALID_BRIDGE_TX_STATUS_RESPONSE_2,
        expected: true,
        description: 'fields allowed to be missing',
      },
      {
        input: undefined,
        expected: false,
        description: 'undefined',
      },
      {
        input: null,
        expected: false,
        description: 'null',
      },
      {
        input: {},
        expected: false,
        description: 'empty object',
      },
    ])(
      'should return $expected for $description',
      ({ input, expected }: { input: unknown; expected: boolean }) => {
        const res = validateResponse<StatusResponse, unknown>(
          validators,
          input,
          'dummyurl.com',
        );
        expect(res).toBe(expected);
      },
    );
  });
});
