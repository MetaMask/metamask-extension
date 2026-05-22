import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { AssetsReceivedTotalAmountsSummary } from './assets-received-total-amounts-summary';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../ducks/locale/locale', () => ({
  getIntlLocale: (state: { locale?: string }) => state?.locale,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

beforeEach(() => {
  mockUseSelector.mockReset();
  mockUseSelector.mockReturnValue('en-US' as never);
});

describe('AssetsReceivedTotalAmountsSummary', () => {
  it('renders both labels', () => {
    render(
      <AssetsReceivedTotalAmountsSummary
        receivedAsset={{ symbol: 'USDC' }}
        totalReceivedAmount={100}
        minimumReceivedAmount={95}
      />,
    );

    expect(screen.getByText('totalReceived')).toBeInTheDocument();
    expect(screen.getByText('minimumReceivedLabel')).toBeInTheDocument();
  });

  it('renders the formatted total received amount with leading +', () => {
    render(
      <AssetsReceivedTotalAmountsSummary
        receivedAsset={{ symbol: 'USDC' }}
        totalReceivedAmount={100}
        minimumReceivedAmount={95}
      />,
    );

    expect(screen.getByText(/\+.*100/u)).toBeInTheDocument();
  });

  it('renders the formatted minimum received amount with leading +', () => {
    render(
      <AssetsReceivedTotalAmountsSummary
        receivedAsset={{ symbol: 'USDC' }}
        totalReceivedAmount={100}
        minimumReceivedAmount={95}
      />,
    );

    expect(screen.getByText(/\+.*95/u)).toBeInTheDocument();
  });

  it('does not show the resolved total when totalReceivedAmount is undefined', () => {
    render(
      <AssetsReceivedTotalAmountsSummary
        receivedAsset={{ symbol: 'USDC' }}
        totalReceivedAmount={undefined}
        minimumReceivedAmount={95}
      />,
    );

    // Resolved 95 still shown for minimum, but the total row stays in
    // skeleton state so the explicit +100 / +0 text should not appear.
    expect(screen.queryByText(/\+.*100/u)).not.toBeInTheDocument();
  });

  it('does not show the resolved minimum when minimumReceivedAmount is undefined', () => {
    render(
      <AssetsReceivedTotalAmountsSummary
        receivedAsset={{ symbol: 'USDC' }}
        totalReceivedAmount={100}
        minimumReceivedAmount={undefined}
      />,
    );

    expect(screen.queryByText(/\+.*95/u)).not.toBeInTheDocument();
  });
});
