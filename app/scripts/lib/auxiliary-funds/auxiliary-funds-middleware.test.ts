import type { NetworkConfiguration } from '@metamask/network-controller';
import type { JsonRpcResponse } from '@metamask/utils';

import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createAuxiliaryFundsMiddleware } from './auxiliary-funds-middleware';

const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const BRIDGE_ADDRESS = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';

function buildTransferCalldata(recipient: string, amount: string): string {
  const selector = '0xa9059cbb';
  const paddedAddress = recipient.slice(2).toLowerCase().padStart(64, '0');
  const paddedAmount = BigInt(amount).toString(16).padStart(64, '0');
  return `${selector}${paddedAddress}${paddedAmount}`;
}

function buildRequest(
  overrides: Record<string, unknown> = {},
  txParamsOverrides: Record<string, unknown> = {},
) {
  return {
    id: '1',
    jsonrpc: '2.0' as const,
    method: 'eth_sendTransaction',
    params: [
      {
        from: '0xabc',
        to: USDC_ADDRESS,
        data: buildTransferCalldata(BRIDGE_ADDRESS, '10000000'),
        ...txParamsOverrides,
      },
    ],
    networkClientId: 'arbitrum-mainnet',
    ...overrides,
  };
}

function buildGetNetworkConfig(
  chainId: string = CHAIN_IDS.ARBITRUM,
): (id: string) => NetworkConfiguration | undefined {
  return () =>
    ({
      chainId,
      rpcEndpoints: [],
      defaultRpcEndpointIndex: 0,
      name: 'Arbitrum',
      nativeCurrency: 'ETH',
      blockExplorerUrls: [],
      defaultBlockExplorerUrlIndex: 0,
    }) as unknown as NetworkConfiguration;
}

describe('createAuxiliaryFundsMiddleware', () => {
  describe('when transaction is a Hyperliquid USDC transfer deposit', () => {
    it('attaches requiredAssets to the request', () => {
      const middleware = createAuxiliaryFundsMiddleware({
        getNetworkConfigurationByNetworkClientId: buildGetNetworkConfig(),
      });

      const req = buildRequest();
      const next = jest.fn();

      middleware(req as never, {} as JsonRpcResponse, next);

      expect(req.requiredAssets).toStrictEqual([
        {
          address: USDC_ADDRESS,
          amount: '0x989680',
          standard: 'erc20',
        },
      ]);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('when transaction targets a different recipient', () => {
    it('does not attach requiredAssets', () => {
      const middleware = createAuxiliaryFundsMiddleware({
        getNetworkConfigurationByNetworkClientId: buildGetNetworkConfig(),
      });

      const otherAddress = '0x0000000000000000000000000000000000000001';
      const req = buildRequest(
        {},
        { data: buildTransferCalldata(otherAddress, '10000000') },
      );
      const next = jest.fn();

      middleware(req as never, {} as JsonRpcResponse, next);

      expect(req.requiredAssets).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('when not on Arbitrum', () => {
    it('does not attach requiredAssets', () => {
      const middleware = createAuxiliaryFundsMiddleware({
        getNetworkConfigurationByNetworkClientId: buildGetNetworkConfig(
          CHAIN_IDS.MAINNET,
        ),
      });

      const req = buildRequest();
      const next = jest.fn();

      middleware(req as never, {} as JsonRpcResponse, next);

      expect(req.requiredAssets).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('when method is not eth_sendTransaction', () => {
    it('does not attach requiredAssets', () => {
      const middleware = createAuxiliaryFundsMiddleware({
        getNetworkConfigurationByNetworkClientId: buildGetNetworkConfig(),
      });

      const req = buildRequest({ method: 'eth_call' });
      const next = jest.fn();

      middleware(req as never, {} as JsonRpcResponse, next);

      expect(req.requiredAssets).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('when transaction is a batchedDepositWithPermit', () => {
    it('attaches requiredAssets from the first deposit entry', () => {
      const middleware = createAuxiliaryFundsMiddleware({
        getNetworkConfigurationByNetworkClientId: buildGetNetworkConfig(),
      });

      // Build minimal batchedDepositWithPermit calldata
      // selector: 0xb30b5bce
      // ABI: tuple[] deposits
      // tuple: (address user, uint64 usd, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
      const selector = '0xb30b5bce';
      const arrayOffset = `${'0'.repeat(62)}20`; // offset = 0x20
      const arrayLength = `${'0'.repeat(63)}1`; // 1 element
      const tupleOffset = `${'0'.repeat(62)}20`; // offset to first tuple data relative to offsets start

      const userAddress = `${'0'.repeat(24)}abcdef1234567890abcdef1234567890abcdef12`;
      const usdAmount = `${'0'.repeat(48)}00000000009896800`; // ~10 USDC in some representation
      const deadline = `${'0'.repeat(56)}ffffffff`;
      const v = `${'0'.repeat(62)}1b`;
      const r = 'aa'.repeat(32);
      const s = 'bb'.repeat(32);

      const data = `${selector}${arrayOffset}${arrayLength}${tupleOffset}${userAddress}${usdAmount}${deadline}${v}${r}${s}`;

      const req = buildRequest({}, { to: BRIDGE_ADDRESS, data });
      const next = jest.fn();

      middleware(req as never, {} as JsonRpcResponse, next);

      expect(req.requiredAssets).toBeDefined();
      expect(req.requiredAssets?.[0].address).toBe(USDC_ADDRESS);
      expect(req.requiredAssets?.[0].standard).toBe('erc20');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('when calldata is too short', () => {
    it('does not attach requiredAssets', () => {
      const middleware = createAuxiliaryFundsMiddleware({
        getNetworkConfigurationByNetworkClientId: buildGetNetworkConfig(),
      });

      const req = buildRequest({}, { data: '0xa9059cbb' });
      const next = jest.fn();

      middleware(req as never, {} as JsonRpcResponse, next);

      expect(req.requiredAssets).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  it('always calls next()', () => {
    const middleware = createAuxiliaryFundsMiddleware({
      getNetworkConfigurationByNetworkClientId: () => undefined,
    });

    const req = buildRequest();
    const next = jest.fn();

    middleware(req as never, {} as JsonRpcResponse, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
