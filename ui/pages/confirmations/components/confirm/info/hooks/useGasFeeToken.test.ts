import { Hex } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { GasFeeToken } from '@metamask/transaction-controller';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../shared/constants/transaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { GAS_FEE_TOKEN_MOCK as GAS_FEE_TOKEN_MOCK_BASE } from '../../../../../../../test/data/confirmations/gas';
import {
  RATE_WEI_NATIVE,
  useGasFeeToken,
  useSelectedGasFeeToken,
} from './useGasFeeToken';

const FROM_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  ...GAS_FEE_TOKEN_MOCK_BASE,
  amount: toHex(1234),
  symbol: 'USDC',
};

function getState({ gasFeeTokens }: { gasFeeTokens?: GasFeeToken[] } = {}) {
  return getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      address: FROM_MOCK,
      gasFeeTokens: gasFeeTokens ?? [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    }),
    {
      metamask: {
        preferences: {
          showFiatInTestnets: true,
        },
      },
    },
  );
}

function runHook({
  gasFeeTokens,
  tokenAddress,
}: {
  gasFeeTokens?: GasFeeToken[];
  tokenAddress?: Hex;
}) {
  const state = getState({ gasFeeTokens });

  const { result } = renderHookWithConfirmContextProvider(
    () => useGasFeeToken({ tokenAddress }),
    state,
  );

  return result.current;
}

function runUseSelectedGasFeeTokenHook() {
  const { result } = renderHookWithConfirmContextProvider(
    useSelectedGasFeeToken,
    getState(),
  );

  return result.current;
}

describe('useGasFeeToken', () => {
  it('returns gas fee token properties', () => {
    const result = runHook({ tokenAddress: GAS_FEE_TOKEN_MOCK.tokenAddress });
    expect(result).toStrictEqual(expect.objectContaining(GAS_FEE_TOKEN_MOCK));
  });

  it('returns formatted amount', () => {
    const result = runHook({ tokenAddress: GAS_FEE_TOKEN_MOCK.tokenAddress });
    expect(result.amountFormatted).toStrictEqual('1.234');
  });

  it('returns fiat amount', () => {
    const result = runHook({ tokenAddress: GAS_FEE_TOKEN_MOCK.tokenAddress });
    expect(result.amountFiat).toStrictEqual('$1,234.00');
  });

  it('returns fiat balance', () => {
    const result = runHook({ tokenAddress: GAS_FEE_TOKEN_MOCK.tokenAddress });
    expect(result.balanceFiat).toStrictEqual('$2,345.00');
  });

  it('returns token transfer tranasction', () => {
    const result = runHook({ tokenAddress: GAS_FEE_TOKEN_MOCK.tokenAddress });
    expect(result.transferTransaction).toStrictEqual({
      data: `0xa9059cbb000000000000000000000000${GAS_FEE_TOKEN_MOCK.recipient.slice(
        2,
      )}00000000000000000000000000000000000000000000000000000000000004d2`,
      gas: GAS_FEE_TOKEN_MOCK.gasTransfer,
      maxFeePerGas: GAS_FEE_TOKEN_MOCK.maxFeePerGas,
      maxPriorityFeePerGas: GAS_FEE_TOKEN_MOCK.maxPriorityFeePerGas,
      to: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });
  });

  it('returns native transfer tranasction if future native token', () => {
    const result = runHook({
      gasFeeTokens: [
        { ...GAS_FEE_TOKEN_MOCK, tokenAddress: NATIVE_TOKEN_ADDRESS },
      ],
      tokenAddress: NATIVE_TOKEN_ADDRESS,
    });
    expect(result.transferTransaction).toStrictEqual({
      gas: GAS_FEE_TOKEN_MOCK.gasTransfer,
      maxFeePerGas: GAS_FEE_TOKEN_MOCK.maxFeePerGas,
      maxPriorityFeePerGas: GAS_FEE_TOKEN_MOCK.maxPriorityFeePerGas,
      to: GAS_FEE_TOKEN_MOCK.recipient,
      value: GAS_FEE_TOKEN_MOCK.amount,
    });
  });

  it('returns native gas fee token if no token address', () => {
    const result = runHook({ tokenAddress: undefined });
    expect(result.tokenAddress).toStrictEqual(NATIVE_TOKEN_ADDRESS);
  });

  describe('returns native gas fee token', () => {
    it('with amount matching standard min fee calculation', () => {
      const result = runHook({ tokenAddress: NATIVE_TOKEN_ADDRESS });
      expect(result).toStrictEqual(
        expect.objectContaining({
          amount: '0x3be226d2d900',
          amountFiat: '$0.04',
          amountFormatted: '0.000066',
        }),
      );
    });

    it('with user native balance', () => {
      const result = runHook({ tokenAddress: NATIVE_TOKEN_ADDRESS });
      expect(result).toStrictEqual(
        expect.objectContaining({
          balance: '0x346ba7725f412cbfdb',
          balanceFiat: '$537,761.36',
        }),
      );
    });

    it('with gas properties matching transaction params', () => {
      const result = runHook({ tokenAddress: NATIVE_TOKEN_ADDRESS });
      expect(result).toStrictEqual(
        expect.objectContaining({
          gas: '0xab77',
          maxFeePerGas: '0xaa350353',
          maxPriorityFeePerGas: '0x59682f00',
        }),
      );
    });

    it('with symbol as native ticker', () => {
      const result = runHook({ tokenAddress: NATIVE_TOKEN_ADDRESS });
      expect(result).toStrictEqual(
        expect.objectContaining({
          symbol: 'ETH',
        }),
      );
    });

    it('with static data', () => {
      const result = runHook({ tokenAddress: NATIVE_TOKEN_ADDRESS });
      expect(result).toStrictEqual(
        expect.objectContaining({
          decimals: 18,
          rateWei: RATE_WEI_NATIVE,
          recipient: NATIVE_TOKEN_ADDRESS,
          tokenAddress: NATIVE_TOKEN_ADDRESS,
        }),
      );
    });
  });

  describe('useSelectedGasFeeToken', () => {
    it('returns selected gas fee token', () => {
      const result = runUseSelectedGasFeeTokenHook();
      expect(result).toStrictEqual(
        expect.objectContaining({
          ...GAS_FEE_TOKEN_MOCK,
          amountFiat: '$1,234.00',
          amountFormatted: '1.234',
          balanceFiat: '$2,345.00',
        }),
      );
    });
  });
});
