import { BigNumber } from 'bignumber.js';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { TokenStandAndDetails } from '../../../../../store/actions';
import * as Utils from '../../../../../helpers/utils/util';
import * as TokenUtils from '../../../utils/token';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapUSDValues } from './useDappSwapUSDValues';

async function runHook(
  tokenAddresses?: Hex[],
  mockConfirmation?: Confirmation,
) {
  const response = renderHookWithConfirmContextProvider(
    () =>
      useDappSwapUSDValues({
        tokenAddresses: tokenAddresses ?? [
          '0x0000000000000000000000000000000000000000',
          '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        ],
        destTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      }),
    getMockConfirmStateForTransaction(
      mockConfirmation ?? (mockSwapConfirmation as Confirmation),
    ),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapUSDValues', () => {
  it('return correct USD values for tokens and destination token', async () => {
    jest.spyOn(Utils, 'fetchTokenExchangeRates').mockResolvedValue({
      '0x0000000000000000000000000000000000000000': 4052.27,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 0.999804,
      '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798': 1,
    });
    jest.spyOn(TokenUtils, 'fetchAllTokenDetails').mockResolvedValue({
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
        symbol: 'USDC',
        decimals: '6',
      } as TokenStandAndDetails,
      '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798': {
        symbol: 'USDT',
        decimals: '6',
      } as TokenStandAndDetails,
    });

    const result = await runHook();
    expect(result.tokenInfoPending).toBe(false);
    expect(result.tokenDetails).toEqual({
      '0x0000000000000000000000000000000000000000': {
        address: '0x0000000000000000000000000000000000000000',
        assetId: 'eip155:8453/slip44:60',
        chainId: 8453,
        decimals: 18,
        iconUrl: '',
        name: 'Ether',
        symbol: 'ETH',
      },
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
        decimals: '6',
        symbol: 'USDC',
      },
      '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798': {
        decimals: '6',
        symbol: 'USDT',
      },
    });
    expect(
      result.getTokenUSDValue(
        '1',
        '0x0000000000000000000000000000000000000000',
      ),
    ).toBe('0.00000000000000405227');
    expect(
      result.getTokenUSDValue(
        '1',
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      ),
    ).toBe('0.000000999804');
    expect(
      result.getTokenUSDValue(
        '1',
        '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798',
      ),
    ).toBe('0.000001');
    expect(result.getDestinationTokenUSDValue('1')).toBe('0.000000999804');
    expect(result.getGasUSDValue(new BigNumber('1'))).toBe(
      '0.00000003879076790654',
    );
    expect(result.fiatRates).toEqual({
      '0x0000000000000000000000000000000000000000': 4052.27,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 0.999804,
      '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798': 1,
    });
    expect(
      result.getTokenUSDValue(
        '1',
        '0xfdcc3dd6671eab0709a4c0f3f53de9a333d80798',
        2,
      ),
    ).toBe('0.00');
  });

  it('return correct fiat rates token on Polygon', async () => {
    jest.spyOn(Utils, 'fetchTokenExchangeRates').mockResolvedValue({
      '0x0000000000000000000000000000000000001010': 4052.27,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 0.999804,
    });
    jest.spyOn(TokenUtils, 'fetchAllTokenDetails').mockResolvedValue({
      '0x0000000000000000000000000000000000000000': {
        symbol: 'POL',
        decimals: '18',
      } as TokenStandAndDetails,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
        symbol: 'USDT',
        decimals: '6',
      } as TokenStandAndDetails,
    });

    const result = await runHook(
      [
        '0x0000000000000000000000000000000000000000',
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      ],
      { ...mockSwapConfirmation, chainId: CHAIN_IDS.POLYGON } as Confirmation,
    );

    expect(result.fiatRates).toEqual({
      '0x0000000000000000000000000000000000000000': 4052.27,
      '0x0000000000000000000000000000000000001010': 4052.27,
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 0.999804,
    });
  });
});
