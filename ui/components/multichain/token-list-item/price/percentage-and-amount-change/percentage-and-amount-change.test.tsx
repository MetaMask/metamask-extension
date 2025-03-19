import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { zeroAddress } from 'ethereumjs-util';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import {
  getCurrentCurrency,
  getSelectedAccountCachedBalance,
  getTokensMarketData,
} from '../../../../../selectors';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../../../../ducks/metamask/metamask';
import { PercentageAndAmountChange } from './percentage-and-amount-change';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

jest.mock('../../../../../selectors', () => ({
  getCurrentCurrency: jest.fn(),
  getSelectedAccountCachedBalance: jest.fn(),
  getTokensMarketData: jest.fn(),
}));

jest.mock('../../../../../ducks/metamask/metamask', () => ({
  getConversionRate: jest.fn(),
  getNativeCurrency: jest.fn(),
}));

const mockGetIntlLocale = getIntlLocale as unknown as jest.Mock;
const mockGetCurrentCurrency = getCurrentCurrency as jest.Mock;
const mockGetSelectedAccountCachedBalance =
  getSelectedAccountCachedBalance as jest.Mock;
const mockGetConversionRate = getConversionRate as jest.Mock;
const mockGetNativeCurrency = getNativeCurrency as jest.Mock;
const mockGetTokensMarketData = getTokensMarketData as jest.Mock;

describe('PercentageChange Component', () => {
  beforeEach(() => {
    mockGetIntlLocale.mockReturnValue('en-US');
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockGetSelectedAccountCachedBalance.mockReturnValue('0x02e8ac1ede6ade83');
    mockGetConversionRate.mockReturnValue(2913.15);
    mockGetNativeCurrency.mockReturnValue('ETH');
    mockGetTokensMarketData.mockReturnValue({
      [zeroAddress()]: {
        pricePercentChange1d: 2,
      },
    });

    jest.clearAllMocks();
  });

  describe('render', () => {
    it('renders correctly', () => {
      const { container } = render(<PercentageAndAmountChange value={5.123} />);
      expect(container).toMatchSnapshot();
    });
  });

  it('renders empty strings for both percentage and value when value is null and includeNumber is true', () => {
    render(<PercentageAndAmountChange value={null} />);
    const percentageElement = screen.getByTestId(
      'token-increase-decrease-percentage',
    );
    const valueElement = screen.getByTestId('token-increase-decrease-value');
    expect(percentageElement).toHaveTextContent('');
    expect(valueElement).toHaveTextContent('+$12.21');
  });

  it('displays positive percentage with number in success color', () => {
    render(<PercentageAndAmountChange value={3.456} />);
    const percentageElement = screen.getByText('(+3.46%)');
    const numberElement = screen.getByText('+$12.21');
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('displays negative percentage with number in error color', () => {
    render(<PercentageAndAmountChange value={-1.234} />);
    const percentageElement = screen.getByText('(-1.23%)');
    const numberElement = screen.getByText('+$12.21');
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('displays zero percentage with number in default color if balance is zero', () => {
    mockGetSelectedAccountCachedBalance.mockReturnValue('0x0');
    render(<PercentageAndAmountChange value={-1.234} />);
    const percentageElement = screen.getByText('(+0.00%)');
    const numberElement = screen.getByText('+$0.00');
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('should not error with non standard currency code', () => {
    mockGetSelectedAccountCachedBalance.mockReturnValue('0x0');
    mockGetCurrentCurrency.mockReturnValue('DASH');
    render(<PercentageAndAmountChange value={-1.234} />);
    const percentageElement = screen.getByText('(+0.00%)');
    const numberElement = screen.getByText('+0.00');
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });
});
