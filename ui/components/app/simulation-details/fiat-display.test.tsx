import React from 'react';
import { render, screen } from '@testing-library/react';
import { IndividualFiatDisplay, TotalFiatDisplay } from './fiat-display';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import { FIAT_UNAVAILABLE, FiatAmount } from './types';

jest.mock('../../../hooks/useI18nContext');
jest.mock('../../../hooks/useFiatFormatter');

describe('IndividualFiatDisplay', () => {
  beforeEach(() => {
    (useI18nContext as jest.Mock).mockReturnValue((key: string) => key);
    (useFiatFormatter as jest.Mock).mockReturnValue((value: number) => `$${value}`);
  });

  it('renders fiat not available message when fiatAmount is FIAT_UNAVAILABLE', () => {
    render(<IndividualFiatDisplay fiatAmount={FIAT_UNAVAILABLE} />);
    expect(screen.getByText('simulationDetailsFiatNotAvailable')).toBeInTheDocument();
  });

  it('renders the fiat amount when fiatAmount is a valid number', () => {
    render(<IndividualFiatDisplay fiatAmount={100} />);
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('renders the absolute value of the fiat amount', () => {
    render(<IndividualFiatDisplay fiatAmount={-100} />);
    expect(screen.getByText('$100')).toBeInTheDocument();
  });
});

describe('TotalFiatDisplay', () => {
  beforeEach(() => {
    (useI18nContext as jest.Mock).mockReturnValue((key: string, params?: string[]) => {
      if (params) {
        return `${key}: ${params[0]}`;
      }
      return key;
    });
    (useFiatFormatter as jest.Mock).mockReturnValue((value: number) => `$${value}`);
  });

  it('renders fiat not available message when all fiatAmounts are null', () => {
    const fiatAmounts = [null, null, null] as FiatAmount[];
    render(<TotalFiatDisplay fiatAmounts={fiatAmounts} />);
    expect(screen.getByText('simulationDetailsFiatNotAvailable')).toBeInTheDocument();
  });

  it('renders the total fiat amount when there are valid fiat amounts', () => {
    const fiatAmounts = [100, 200, null, 300];
    render(<TotalFiatDisplay fiatAmounts={fiatAmounts} />);
    expect(screen.getByText('simulationDetailsTotalFiat: $600')).toBeInTheDocument();
  });

  it('renders the absolute value of the total fiat amount', () => {
    const fiatAmounts = [-100, -200, null, -300];
    render(<TotalFiatDisplay fiatAmounts={fiatAmounts} />);
    expect(screen.getByText('simulationDetailsTotalFiat: $600')).toBeInTheDocument();
  });

  it('renders fiat not available message when fiatAmounts is an empty array', () => {
    const fiatAmounts: (number | null)[] = [];
    render(<TotalFiatDisplay fiatAmounts={fiatAmounts} />);
    expect(screen.getByText('simulationDetailsFiatNotAvailable')).toBeInTheDocument();
  });
});
