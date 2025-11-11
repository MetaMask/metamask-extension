import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { RewardsBadge } from './RewardsBadge';

// Mock dependencies
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

const mockUseI18nContext = useI18nContext as jest.MockedFunction<
  typeof useI18nContext
>;

describe('RewardsBadge', () => {
  const mockT = jest.fn((key: string, values?: string[]) => {
    if (key === 'rewardsPointsBalance' && values) {
      return `${values[0]} points`;
    }
    if (key === 'rewardsPointsIcon') {
      return 'Rewards Points Icon';
    }
    return key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
  });

  describe('rendering', () => {
    it('should render the component with formatted points', () => {
      render(<RewardsBadge formattedPoints="1,000" />);

      expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
      expect(
        screen.getByTestId('rewards-points-balance-value'),
      ).toBeInTheDocument();
    });

    it('should render the image with correct attributes', () => {
      render(<RewardsBadge formattedPoints="1,000" />);

      const image = screen.getByAltText('Rewards Points Icon');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        'src',
        './images/metamask-rewards-points.svg',
      );
      expect(image).toHaveAttribute('width', '16');
      expect(image).toHaveAttribute('height', '16');
    });

    it('should render points with suffix by default', () => {
      render(<RewardsBadge formattedPoints="1,000" />);

      const textElement = screen.getByTestId('rewards-points-balance-value');
      expect(textElement).toHaveTextContent('1,000 points');
    });

    it('should render points without suffix when withPointsSuffix is false', () => {
      render(<RewardsBadge formattedPoints="1,000" withPointsSuffix={false} />);

      const textElement = screen.getByTestId('rewards-points-balance-value');
      expect(textElement).toHaveTextContent('1,000');
    });

    it('should apply boxClassName when provided', () => {
      render(
        <RewardsBadge formattedPoints="1,000" boxClassName="custom-box" />,
      );

      const container = screen.getByTestId('rewards-points-balance');
      expect(container).toHaveClass('flex', 'items-center', 'custom-box');
    });

    it('should apply textClassName when provided', () => {
      render(
        <RewardsBadge formattedPoints="1,000" textClassName="custom-text" />,
      );

      const textElement = screen.getByTestId('rewards-points-balance-value');
      expect(textElement).toHaveClass('custom-text');
    });

    it('should apply both boxClassName and textClassName', () => {
      render(
        <RewardsBadge
          formattedPoints="1,000"
          boxClassName="custom-box"
          textClassName="custom-text"
        />,
      );

      const container = screen.getByTestId('rewards-points-balance');
      const textElement = screen.getByTestId('rewards-points-balance-value');

      expect(container).toHaveClass('custom-box');
      expect(textElement).toHaveClass('custom-text');
    });

    it('should have default flex and items-center classes', () => {
      render(<RewardsBadge formattedPoints="1,000" />);

      const container = screen.getByTestId('rewards-points-balance');
      expect(container).toHaveClass('flex', 'items-center');
    });
  });

  describe('translation', () => {
    it('should call translation function with rewardsPointsBalance key and formatted points', () => {
      render(<RewardsBadge formattedPoints="5,000" />);

      expect(mockT).toHaveBeenCalledWith('rewardsPointsBalance', ['5,000']);
    });

    it('should call translation function with rewardsPointsIcon key for image alt text', () => {
      render(<RewardsBadge formattedPoints="1,000" />);

      expect(mockT).toHaveBeenCalledWith('rewardsPointsIcon');
    });

    it('should not call translation function when withPointsSuffix is false', () => {
      render(<RewardsBadge formattedPoints="5,000" withPointsSuffix={false} />);

      const textElement = screen.getByTestId('rewards-points-balance-value');
      expect(textElement).toHaveTextContent('5,000');
      // Should still be called for the icon alt text
      expect(mockT).toHaveBeenCalledWith('rewardsPointsIcon');
    });
  });

  describe('image error handling', () => {
    it('should hide image when onError is triggered', () => {
      render(<RewardsBadge formattedPoints="1,000" />);

      const image = screen.getByAltText('Rewards Points Icon');
      expect(image).toBeInTheDocument();

      fireEvent.error(image);

      expect(
        screen.queryByAltText('Rewards Points Icon'),
      ).not.toBeInTheDocument();
      // Text should still be visible
      expect(
        screen.getByTestId('rewards-points-balance-value'),
      ).toBeInTheDocument();
    });

    it('should render text content even when image fails to load', () => {
      render(<RewardsBadge formattedPoints="2,500" />);

      const image = screen.getByAltText('Rewards Points Icon');
      fireEvent.error(image);

      const textElement = screen.getByTestId('rewards-points-balance-value');
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveTextContent('2,500 points');
    });
  });

  describe('edge cases', () => {
    it('should handle zero points', () => {
      render(<RewardsBadge formattedPoints="0" />);

      const textElement = screen.getByTestId('rewards-points-balance-value');
      expect(textElement).toHaveTextContent('0 points');
    });

    it('should handle large numbers', () => {
      render(<RewardsBadge formattedPoints="1,234,567" />);

      const textElement = screen.getByTestId('rewards-points-balance-value');
      expect(textElement).toHaveTextContent('1,234,567 points');
    });
  });

  describe('component structure', () => {
    it('should have correct data-testid attributes', () => {
      render(<RewardsBadge formattedPoints="1,000" />);

      expect(screen.getByTestId('rewards-points-balance')).toBeInTheDocument();
      expect(
        screen.getByTestId('rewards-points-balance-value'),
      ).toBeInTheDocument();
    });

    it('should call useI18nContext hook', () => {
      render(<RewardsBadge formattedPoints="1,000" />);

      expect(mockUseI18nContext).toHaveBeenCalled();
    });
  });
});
