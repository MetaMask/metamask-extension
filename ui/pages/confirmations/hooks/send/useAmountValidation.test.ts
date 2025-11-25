import { waitFor } from '@testing-library/react';

import { Numeric } from '../../../../../shared/modules/Numeric';
import mockState from '../../../../../test/data/mock-state.json';
import { EVM_NATIVE_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { Asset, AssetStandard } from '../../types/send';
import * as SendContext from '../../context/send';
import {
  useAmountValidation,
  validateERC1155Balance,
  validateTokenBalance,
  validatePositiveNumericString,
} from './useAmountValidation';

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

describe('validateERC1155Balance', () => {
  it('return error if amount is greater than balance and not otherwise', () => {
    expect(
      validateERC1155Balance(
        { balance: 5, standard: AssetStandard.ERC1155 } as unknown as Asset,
        '5',
        (str: string) => str,
      ),
    ).toEqual(undefined);
    expect(
      validateERC1155Balance(
        { balance: 5, standard: AssetStandard.ERC1155 } as unknown as Asset,
        '1',
        (str: string) => str,
      ),
    ).toEqual(undefined);
    expect(
      validateERC1155Balance(
        { balance: 5, standard: AssetStandard.ERC1155 } as unknown as Asset,
        '10',
        (str: string) => str,
      ),
    ).toEqual('insufficientFundsSend');
  });

  it('returns undefined for non-ERC1155 assets', () => {
    expect(
      validateERC1155Balance(
        { balance: 5, standard: AssetStandard.ERC20 } as unknown as Asset,
        '10',
        (str: string) => str,
      ),
    ).toEqual(undefined);
    expect(
      validateERC1155Balance(
        { balance: 5, standard: AssetStandard.Native } as unknown as Asset,
        '10',
        (str: string) => str,
      ),
    ).toEqual(undefined);
  });

  it('returns undefined when asset has no balance', () => {
    expect(
      validateERC1155Balance(
        { standard: AssetStandard.ERC1155 } as unknown as Asset,
        '10',
        (str: string) => str,
      ),
    ).toEqual(undefined);
  });

  it('returns undefined when value is undefined or empty', () => {
    expect(
      validateERC1155Balance(
        { balance: 5, standard: AssetStandard.ERC1155 } as unknown as Asset,
        undefined,
        (str: string) => str,
      ),
    ).toEqual(undefined);
    expect(
      validateERC1155Balance(
        { balance: 5, standard: AssetStandard.ERC1155 } as unknown as Asset,
        '',
        (str: string) => str,
      ),
    ).toEqual(undefined);
  });

  it('returns undefined when asset is undefined', () => {
    expect(
      validateERC1155Balance(
        undefined as unknown as Asset,
        '10',
        (str: string) => str,
      ),
    ).toEqual(undefined);
  });
});

describe('validatePositiveNumericString', () => {
  it('returns undefined for valid positive numeric strings', () => {
    expect(validatePositiveNumericString('123', (str: string) => str)).toEqual(
      undefined,
    );
    expect(validatePositiveNumericString('0.5', (str: string) => str)).toEqual(
      undefined,
    );
    expect(
      validatePositiveNumericString('1.234567', (str: string) => str),
    ).toEqual(undefined);
    expect(validatePositiveNumericString('0', (str: string) => str)).toEqual(
      undefined,
    );
  });

  it('returns error for invalid numeric strings', () => {
    expect(validatePositiveNumericString('abc', (str: string) => str)).toEqual(
      'invalidValue',
    );
    expect(validatePositiveNumericString('-5', (str: string) => str)).toEqual(
      'invalidValue',
    );
    expect(
      validatePositiveNumericString('12.34.56', (str: string) => str),
    ).toEqual('invalidValue');
    expect(
      validatePositiveNumericString('12a34', (str: string) => str),
    ).toEqual('invalidValue');
  });

  it('returns error for empty or whitespace strings', () => {
    expect(validatePositiveNumericString('', (str: string) => str)).toEqual(
      'invalidValue',
    );
    expect(validatePositiveNumericString('  ', (str: string) => str)).toEqual(
      'invalidValue',
    );
  });
});

describe('validateTokenBalance', () => {
  it('return error if amount is greater than balance and not otherwise', () => {
    expect(
      validateTokenBalance(
        '1',
        new Numeric('1000000000000000000', 10),
        18,
        (str: string) => str,
      ),
    ).toEqual(undefined);
    expect(
      validateTokenBalance(
        '10',
        new Numeric('1000000000000000000', 10),
        18,
        (str: string) => str,
      ),
    ).toEqual('insufficientFundsSend');
  });

  it('returns undefined when amount equals balance (boundary case)', () => {
    expect(
      validateTokenBalance(
        '1',
        new Numeric('1000000000000000000', 10),
        18,
        (str: string) => str,
      ),
    ).toEqual(undefined);
  });

  it('returns error when balance is zero', () => {
    expect(
      validateTokenBalance('1', new Numeric('0', 10), 18, (str: string) => str),
    ).toEqual('insufficientFundsSend');
  });

  it('handles undefined decimals', () => {
    expect(
      validateTokenBalance(
        '1',
        new Numeric('1000000000000000000', 10),
        undefined,
        (str: string) => str,
      ),
    ).toEqual(undefined);
  });

  it('handles very small amounts correctly', () => {
    expect(
      validateTokenBalance(
        '0.000001',
        new Numeric('1000000000000', 10),
        18,
        (str: string) => str,
      ),
    ).toEqual(undefined);
  });
});

describe('useAmountValidation', () => {
  it('return field for amount error', () => {
    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    expect(result.current.amountError).toEqual(undefined);
    expect(result.current.validateNonEvmAmountAsync).toBeDefined();
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
      expect(result.current.amountError).toEqual('Invalid value'),
    );
  });

  it('return error if amount of native asset is more than balance', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...EVM_NATIVE_ASSET, rawBalance: '0x5' },
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      value: '10',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current.amountError).toEqual('Insufficient funds'),
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
    await waitFor(() => expect(result.current.amountError).toEqual(undefined));
  });

  it('does not return error for empty string amount value', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
      value: '',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() => expect(result.current.amountError).toEqual(undefined));
  });

  it('does not return error for null amount value', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
      value: null,
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() => expect(result.current.amountError).toEqual(undefined));
  });

  it('return error for negative amount value', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
      value: '-5',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current.amountError).toEqual('Invalid value'),
    );
  });

  it('accepts valid zero amount', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...EVM_NATIVE_ASSET, rawBalance: '0x5' },
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      value: '0',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() => expect(result.current.amountError).toEqual(undefined));
  });

  it('accepts valid decimal amount', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...EVM_NATIVE_ASSET, rawBalance: '0x5f5e100' },
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      value: '0.5',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() => expect(result.current.amountError).toEqual(undefined));
  });

  it('return error for ERC1155 token with amount exceeding balance', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: {
        balance: 5,
        standard: AssetStandard.ERC1155,
        decimals: 0,
      },
      from: MOCK_ADDRESS_1,
      value: '10',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current.amountError).toEqual('Insufficient funds'),
    );
  });

  it('accepts valid ERC1155 token amount within balance', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: {
        balance: 10,
        standard: AssetStandard.ERC1155,
        decimals: 0,
      },
      from: MOCK_ADDRESS_1,
      value: '5',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() => expect(result.current.amountError).toEqual(undefined));
  });

  it('return error for ERC20 token with amount exceeding balance', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: {
        rawBalance: '0x2710', // 10000 in decimal
        standard: AssetStandard.ERC20,
        decimals: 18,
      },
      from: MOCK_ADDRESS_1,
      value: '100',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current.amountError).toEqual('Insufficient funds'),
    );
  });

  it('return error for special characters in amount', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
      value: '1@23',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current.amountError).toEqual('Invalid value'),
    );
  });

  it('validateNonEvmAmountAsync can be called manually', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
      value: '1',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );

    const error = await result.current.validateNonEvmAmountAsync();
    expect(error).toEqual(undefined);
  });

  it('returns error when non-EVM account has zero balance', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: {
        isNative: true,
        rawBalance: '0x0',
        decimals: 18,
      },
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      from: MOCK_ADDRESS_1,
      value: '1',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(
      () => useAmountValidation(),
      mockState,
    );
    await waitFor(() =>
      expect(result.current.amountError).toEqual('Insufficient funds'),
    );
  });
});
