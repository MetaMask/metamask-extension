import { act, renderHook } from '@testing-library/react';
import { getInputPrimaryDenomination } from '../../ducks/bridge/selectors';
import { trackUnifiedSwapBridgeEvent } from '../../ducks/bridge/actions';
import { useSourceInputAmount } from './useSourceInputAmount';

const mockDispatch = jest.fn();
const mockValues = new Map();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockValues.get(selector),
}));

jest.mock('../../store/hooks', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../../ducks/bridge/actions', () => ({
  setInputPrimaryDenomination: jest.fn(),
  trackUnifiedSwapBridgeEvent: jest.fn(),
}));

const sourceToken = {
  assetId: 'eip155:1/slip44:60',
  chainId: 'eip155:1',
  decimals: 6,
  symbol: 'ETH',
} as never;

const destinationToken = {
  assetId: 'eip155:10/slip44:60',
  chainId: 'eip155:10',
  decimals: 18,
  symbol: 'ETH',
} as never;

const onSourceAmountChange = jest.fn();
const defaultSourceInputProps = {
  enabled: true,
  conversionRate: 2.5,
  sourceToken,
  destinationToken,
  onSourceAmountChange,
};

describe('useSourceInputAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValues.set(getInputPrimaryDenomination, 'token_amount');
  });

  it('converts the canonical token amount when switching to fiat mode', () => {
    const { result } = renderHook(() =>
      useSourceInputAmount({
        ...defaultSourceInputProps,
        sourceAmount: '1.234',
      }),
    );

    act(() => {
      result.current.togglePrimaryDenomination();
    });

    expect(result.current.isFiatPrimary).toBe(true);
    expect(result.current.amount).toBe('3.09');
    expect(result.current.selectedDenomination).toBe('fiat_value');
    /* eslint-disable @typescript-eslint/naming-convention */
    expect(trackUnifiedSwapBridgeEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        previous_primary_denomination: 'token_amount',
        new_primary_denomination: 'fiat_value',
      }),
    );
    /* eslint-enable @typescript-eslint/naming-convention */
  });

  it('converts fiat input back to token precision while keeping fiat input editable', () => {
    const initialProps = {
      ...defaultSourceInputProps,
      sourceAmount: '1',
    };
    const { result, rerender } = renderHook(
      (props) => useSourceInputAmount(props),
      { initialProps },
    );

    act(() => {
      result.current.togglePrimaryDenomination();
    });
    act(() => {
      result.current.handleAmountChange('3.09');
    });
    rerender({ ...initialProps, sourceAmount: '1.236000' });

    expect(result.current.amount).toBe('3.09');
    expect(onSourceAmountChange).toHaveBeenLastCalledWith('1.236');
  });

  it('falls back to token mode when no conversion rate is available without changing the preference', () => {
    mockValues.set(getInputPrimaryDenomination, 'fiat_value');

    const { result } = renderHook(() =>
      useSourceInputAmount({
        ...defaultSourceInputProps,
        sourceAmount: '1',
        conversionRate: null,
      }),
    );

    expect(result.current.isFiatPrimary).toBe(false);
    expect(result.current.amount).toBe('1');
  });
});
