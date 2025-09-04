import { waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { EVM_NATIVE_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { Asset } from '../../types/send';
import * as SendContext from '../../context/send';
import {
  useAmountValidation,
  validateERC1155Balance,
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
    ).toEqual('insufficientFunds');
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
});
