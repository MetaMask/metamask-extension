import { renderHook } from '@testing-library/react-hooks';
import { Numeric } from '../../../../../shared/modules/Numeric';
import useProcessNewDecimalValue from './useProcessNewDecimalValue';

const renderUseProcessNewDecimalValue = (
  assetDecimals: number,
  isFiatPrimary: boolean,
  tokenToFiatConversionRate: Numeric,
) => {
  return renderHook(() =>
    useProcessNewDecimalValue(
      assetDecimals,
      isFiatPrimary,
      tokenToFiatConversionRate,
    ),
  );
};

describe('useProcessNewDecimalValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fiat is primary', () => {
    const {
      result: { current: processingFunction },
    } = renderUseProcessNewDecimalValue(6, false, new Numeric(0.5, 10));

    expect(processingFunction('1')).toStrictEqual({
      newFiatDecimalValue: '1.00',
      newTokenDecimalValue: '2',
    });
    expect(processingFunction('0')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: '0',
    });
    expect(processingFunction('1.66666666')).toStrictEqual({
      newFiatDecimalValue: '1.67',
      newTokenDecimalValue: '3.333333',
    });

    expect(processingFunction('1.123456789')).toStrictEqual({
      newFiatDecimalValue: '1.12',
      newTokenDecimalValue: '2.246914',
    });
  });

  it('token is primary', () => {
    const {
      result: { current: processingFunction },
    } = renderUseProcessNewDecimalValue(6, true, new Numeric(0.5, 10));

    expect(processingFunction('1')).toStrictEqual({
      newFiatDecimalValue: '0.50',
      newTokenDecimalValue: '1',
    });
    expect(processingFunction('0')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: '0',
    });
    expect(processingFunction('1.66666666')).toStrictEqual({
      newFiatDecimalValue: '0.83',
      newTokenDecimalValue: '1.666667',
    });
    expect(processingFunction('1.123456789')).toStrictEqual({
      newFiatDecimalValue: '0.56',
      newTokenDecimalValue: '1.123457',
    });
  });

  it('fiat is primary; conversion is zero', () => {
    const {
      result: { current: processingFunction },
    } = renderUseProcessNewDecimalValue(6, false, new Numeric(0, 10));

    expect(processingFunction('1')).toStrictEqual({
      newFiatDecimalValue: '1.00',
      newTokenDecimalValue: 'Infinity',
    });
    expect(processingFunction('0')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: 'NaN',
    });
    expect(processingFunction('1.66666666')).toStrictEqual({
      newFiatDecimalValue: '1.67',
      newTokenDecimalValue: 'Infinity',
    });

    expect(processingFunction('1.123456789')).toStrictEqual({
      newFiatDecimalValue: '1.12',
      newTokenDecimalValue: 'Infinity',
    });
  });

  it('token is primary; conversion is zero', () => {
    const {
      result: { current: processingFunction },
    } = renderUseProcessNewDecimalValue(6, true, new Numeric(0, 10));

    expect(processingFunction('1')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: '1',
    });
    expect(processingFunction('0')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: '0',
    });
    expect(processingFunction('1.66666666')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: '1.666667',
    });
    expect(processingFunction('1.123456789')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: '1.123457',
    });
  });

  it('fiat is primary; decimals are 0', () => {
    const {
      result: { current: processingFunction },
    } = renderUseProcessNewDecimalValue(0, false, new Numeric(0.5, 10));

    expect(processingFunction('1')).toStrictEqual({
      newFiatDecimalValue: '1.00',
      newTokenDecimalValue: '2',
    });
    expect(processingFunction('0')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: '0',
    });
    expect(processingFunction('1.66666666')).toStrictEqual({
      newFiatDecimalValue: '1.67',
      newTokenDecimalValue: '3',
    });

    expect(processingFunction('1.123456789')).toStrictEqual({
      newFiatDecimalValue: '1.12',
      newTokenDecimalValue: '2',
    });
  });

  it('token is primary; decimals are 0', () => {
    const {
      result: { current: processingFunction },
    } = renderUseProcessNewDecimalValue(0, true, new Numeric(0.5, 10));

    expect(processingFunction('1')).toStrictEqual({
      newFiatDecimalValue: '0.50',
      newTokenDecimalValue: '1',
    });
    expect(processingFunction('0')).toStrictEqual({
      newFiatDecimalValue: '0.00',
      newTokenDecimalValue: '0',
    });
    expect(processingFunction('1.66666666')).toStrictEqual({
      newFiatDecimalValue: '0.83',
      newTokenDecimalValue: '2',
    });
    expect(processingFunction('1.123456789')).toStrictEqual({
      newFiatDecimalValue: '0.56',
      newTokenDecimalValue: '1',
    });
  });
});
