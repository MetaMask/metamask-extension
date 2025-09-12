import { waitFor } from '@testing-library/react';

import { Numeric } from '../../../../../shared/modules/Numeric';
import mockState from '../../../../../test/data/mock-state.json';
import { EVM_NATIVE_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { Asset } from '../../types/send';
import * as SendContext from '../../context/send';
import {
  useAmountValidation,
  validateERC1155Balance,
  validateTokenBalance,
} from './useAmountValidation';

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

describe('validateERC1155Balance', () => {
  it('return error if amount is greater than balance and not otherwise', () => {
    expect(
      validateERC1155Balance(
        { balance: 5 } as unknown as Asset,
        '5',
        (str: string) => str,
      ),
    ).toEqual(undefined);
    expect(
      validateERC1155Balance(
        { balance: 5 } as unknown as Asset,
        '1',
        (str: string) => str,
      ),
    ).toEqual(undefined);
    expect(
      validateERC1155Balance(
        { balance: 5 } as unknown as Asset,
        '10',
        (str: string) => str,
      ),
    ).toEqual('insufficientFundsSend');
  });
});

describe('validateTokenBalance', () => {
  it('return error if amount is greater than balance and not otherwise', () => {
    expect(
      validateTokenBalance(
        '1000',
        new Numeric('1000', 10),
        (str: string) => str,
      ),
    ).toEqual(undefined);
    expect(
      validateTokenBalance(
        '10000',
        new Numeric('100', 10),
        (str: string) => str,
      ),
    ).toEqual('insufficientFundsSend');
  });
});

describe('useAmountValidation', () => {
  it('return field for amount error', () => {
    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    expect(result.current).toEqual({ amountError: undefined });
  });

  it('return error for invalid amount value', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
      value: 'abc',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current).toEqual({ amountError: 'Invalid value' }),
    );
  });

  it('return error if amount of native asset is more than balance', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...EVM_NATIVE_ASSET, rawBalance: '0x5' },
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      value: 10,
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current).toEqual({ amountError: 'Insufficient funds' }),
    );
  });

  it('does not return error for undefined amount value', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current).toEqual({ amountError: undefined }),
    );
  });
});
