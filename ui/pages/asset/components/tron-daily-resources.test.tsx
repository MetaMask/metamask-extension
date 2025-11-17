import React from 'react';
import { render, screen } from '@testing-library/react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { TronDailyResources } from './tron-daily-resources';
import * as useTronResourcesHook from '../hooks/useTronResources';

// Mock the hooks
jest.mock('../hooks/useTronResources');

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, values?: string[]) => {
    if (values) {
      return `${key}-${values.join('-')}`;
    }
    return key;
  },
}));

describe('TronDailyResources', () => {
  const mockAccount: InternalAccount = {
    id: 'test-account-id',
    address: 'TTestAddress123',
    type: 'tron:account',
    scopes: [MultichainNetworks.TRON],
    metadata: {
      name: 'Test Account',
      keyring: { type: 'HD Key Tree' },
    },
    methods: [],
  } as unknown as InternalAccount;

  const chainId = MultichainNetworks.TRON;

  const mockUseTronResources =
    useTronResourcesHook.useTronResources as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the component with energy and bandwidth resources', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 65000,
          max: 100000,
          percentage: 65,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 1000,
          max: 5000,
          percentage: 20,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      expect(screen.getByText('tronDailyResources')).toBeInTheDocument();
      expect(
        screen.getByText('tronDailyResourcesDescription'),
      ).toBeInTheDocument();
      expect(screen.getByText('tronEnergy')).toBeInTheDocument();
      expect(screen.getByText('tronBandwidth')).toBeInTheDocument();
    });

    it('displays formatted current values for energy and bandwidth', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 65000,
          max: 100000,
          percentage: 65,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 1000,
          max: 5000,
          percentage: 20,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Check that values are formatted with locale
      expect(screen.getByText('65,000')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('calculates USDT transfer coverage correctly (1 transfer)', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 65000, // Exactly 1 transfer
          max: 100000,
          percentage: 65,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 1000,
          max: 5000,
          percentage: 20,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Should show "1" USDT transfer covered
      expect(
        screen.getByText('tronEnergyCoverageDescription-1'),
      ).toBeInTheDocument();
    });

    it('calculates USDT transfer coverage correctly (multiple transfers)', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 195000, // 3 transfers (195000 / 65000 = 3)
          max: 300000,
          percentage: 65,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 1000,
          max: 5000,
          percentage: 20,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Should show "3" USDT transfers covered
      expect(
        screen.getByText('tronEnergyCoverageDescription-3'),
      ).toBeInTheDocument();
    });

    it('calculates USDT transfer coverage as 0 when energy is insufficient', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 30000, // Less than 65000 needed
          max: 100000,
          percentage: 30,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 1000,
          max: 5000,
          percentage: 20,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Should show "0" USDT transfers covered
      expect(
        screen.getByText('tronEnergyCoverageDescription-0'),
      ).toBeInTheDocument();
    });

    it('calculates TRX transfer coverage correctly (1 transfer)', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 65000,
          max: 100000,
          percentage: 65,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 280, // Exactly 1 transfer
          max: 5000,
          percentage: 5.6,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Should show "1" TRX transfer covered
      expect(
        screen.getByText('tronBandwidthCoverageDescription-1'),
      ).toBeInTheDocument();
    });

    it('calculates TRX transfer coverage correctly (multiple transfers)', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 65000,
          max: 100000,
          percentage: 65,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 1120, // 4 transfers (1120 / 280 = 4)
          max: 5000,
          percentage: 22.4,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Should show "4" TRX transfers covered
      expect(
        screen.getByText('tronBandwidthCoverageDescription-4'),
      ).toBeInTheDocument();
    });

    it('calculates TRX transfer coverage as 0 when bandwidth is insufficient', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 65000,
          max: 100000,
          percentage: 65,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 100, // Less than 280 needed
          max: 5000,
          percentage: 2,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Should show "0" TRX transfers covered
      expect(
        screen.getByText('tronBandwidthCoverageDescription-0'),
      ).toBeInTheDocument();
    });

    it('handles zero resources gracefully', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 0,
          max: 100000,
          percentage: 0,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 0,
          max: 5000,
          percentage: 0,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Both energy and bandwidth show "0", so we expect 2 instances
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements).toHaveLength(2);
      expect(
        screen.getByText('tronEnergyCoverageDescription-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('tronBandwidthCoverageDescription-0'),
      ).toBeInTheDocument();
    });

    it('handles very high resource values', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 1000000,
          max: 2000000,
          percentage: 50,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 50000,
          max: 100000,
          percentage: 50,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Check formatted large numbers
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
      expect(screen.getByText('50,000')).toBeInTheDocument();

      // 1000000 / 65000 = 15 USDT transfers
      expect(
        screen.getByText('tronEnergyCoverageDescription-15'),
      ).toBeInTheDocument();

      // 50000 / 280 = 178 TRX transfers
      expect(
        screen.getByText('tronBandwidthCoverageDescription-178'),
      ).toBeInTheDocument();
    });

    it('handles percentage over 100 correctly (capped at 100 for display)', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 150000,
          max: 100000,
          percentage: 150, // Over 100%
        },
        bandwidth: {
          type: 'bandwidth',
          current: 7500,
          max: 5000,
          percentage: 150, // Over 100%
        },
      });

      const { container } = render(
        <TronDailyResources account={mockAccount} chainId={chainId} />,
      );

      // Component should still render without errors
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByText('150,000')).toBeInTheDocument();
      expect(screen.getByText('7,500')).toBeInTheDocument();
    });

    it('renders ResourceCircle with correct SVG elements', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 50000,
          max: 100000,
          percentage: 50,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 2500,
          max: 5000,
          percentage: 50,
        },
      });

      const { container } = render(
        <TronDailyResources account={mockAccount} chainId={chainId} />,
      );

      // Check that SVG circles are rendered (2 circles per resource: background + progress)
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);

      // Check that SVG elements exist
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('passes correct props to useTronResources hook', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 65000,
          max: 100000,
          percentage: 65,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 1000,
          max: 5000,
          percentage: 20,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      expect(mockUseTronResources).toHaveBeenCalledWith(mockAccount, chainId);
      expect(mockUseTronResources).toHaveBeenCalledTimes(1);
    });

    it('handles fractional transfer calculations correctly', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 100000, // 1.538 transfers, should floor to 1
          max: 200000,
          percentage: 50,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 500, // 1.785 transfers, should floor to 1
          max: 1000,
          percentage: 50,
        },
      });

      render(<TronDailyResources account={mockAccount} chainId={chainId} />);

      // Should floor fractional transfers
      expect(
        screen.getByText('tronEnergyCoverageDescription-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('tronBandwidthCoverageDescription-1'),
      ).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles undefined account gracefully', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 0,
          max: 1,
          percentage: 0,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 0,
          max: 1,
          percentage: 0,
        },
      });

      const { container } = render(
        <TronDailyResources
          account={undefined as unknown as InternalAccount}
          chainId={chainId}
        />,
      );

      // Should still render without crashing
      expect(container.firstChild).not.toBeNull();
    });

    it('handles empty chainId gracefully', () => {
      mockUseTronResources.mockReturnValue({
        energy: {
          type: 'energy',
          current: 0,
          max: 1,
          percentage: 0,
        },
        bandwidth: {
          type: 'bandwidth',
          current: 0,
          max: 1,
          percentage: 0,
        },
      });

      const { container } = render(
        <TronDailyResources account={mockAccount} chainId="" />,
      );

      // Should still render without crashing
      expect(container.firstChild).not.toBeNull();
    });
  });
});
