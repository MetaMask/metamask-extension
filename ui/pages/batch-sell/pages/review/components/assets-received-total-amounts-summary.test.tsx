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

jest.mock('../../../../../components/component-library/skeleton', () => ({
  Skeleton: ({
    isLoading,
    children,
  }: {
    isLoading?: boolean;
    children: React.ReactNode;
  }) => (isLoading ? <div data-testid="skeleton-loading" /> : <>{children}</>),
}));

const mockUseSelector = jest.mocked(useSelector);

beforeEach(() => {
  mockUseSelector.mockReset();
  mockUseSelector.mockReturnValue('en-US' as never);
});

describe('AssetsReceivedTotalAmountsSummary', () => {
  describe('labels', () => {
    it('renders both the total received and minimum received labels', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={95}
          isLoading={false}
        />,
      );

      expect(screen.getByText('totalReceived')).toBeInTheDocument();
      expect(screen.getByText('minimumReceivedLabel')).toBeInTheDocument();
    });
  });

  describe('amounts', () => {
    it('renders the formatted total received amount with a leading +', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={95}
          isLoading={false}
        />,
      );

      expect(screen.getByText(/\+.*100/u)).toBeInTheDocument();
    });

    it('renders the formatted minimum received amount with a leading +', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={95}
          isLoading={false}
        />,
      );

      expect(screen.getByText(/\+.*95/u)).toBeInTheDocument();
    });

    it('falls back to +0 when totalReceivedAmount is undefined', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={undefined}
          minimumReceivedAmount={95}
          isLoading={false}
        />,
      );

      expect(screen.queryByText(/\+.*100/u)).not.toBeInTheDocument();
      expect(screen.getByText(/\+.*0/u)).toBeInTheDocument();
    });

    it('falls back to +0 when minimumReceivedAmount is undefined', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={undefined}
          isLoading={false}
        />,
      );

      expect(screen.queryByText(/\+.*95/u)).not.toBeInTheDocument();
    });
  });

  describe('divider', () => {
    it('renders the divider when totalReceivedAmount is defined', () => {
      const { container } = render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={95}
          isLoading={false}
        />,
      );

      expect(container.querySelector('.border-muted')).toBeInTheDocument();
    });

    it('does not render the divider when totalReceivedAmount is undefined', () => {
      const { container } = render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={undefined}
          minimumReceivedAmount={95}
          isLoading={false}
        />,
      );

      expect(container.querySelector('.border-muted')).not.toBeInTheDocument();
    });
  });

  describe('isLoading', () => {
    it('renders skeleton placeholders for both rows when isLoading is true', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={95}
          isLoading={true}
        />,
      );

      expect(screen.getAllByTestId('skeleton-loading')).toHaveLength(2);
    });

    it('does not render skeleton placeholders when isLoading is false', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={95}
          isLoading={false}
        />,
      );

      expect(screen.queryByTestId('skeleton-loading')).not.toBeInTheDocument();
    });

    it('shows actual amounts when isLoading is false', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={95}
          isLoading={false}
        />,
      );

      expect(screen.getByText(/\+.*100/u)).toBeInTheDocument();
      expect(screen.getByText(/\+.*95/u)).toBeInTheDocument();
    });

    it('hides actual amounts while loading', () => {
      render(
        <AssetsReceivedTotalAmountsSummary
          receivedAsset={{ symbol: 'USDC' }}
          totalReceivedAmount={100}
          minimumReceivedAmount={95}
          isLoading={true}
        />,
      );

      expect(screen.queryByText(/\+.*100/u)).not.toBeInTheDocument();
      expect(screen.queryByText(/\+.*95/u)).not.toBeInTheDocument();
    });
  });
});
