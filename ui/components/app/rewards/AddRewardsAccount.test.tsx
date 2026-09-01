import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useLinkAccountAddress } from '../../../hooks/rewards/useLinkAccountAddress';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import AddRewardsAccount from './AddRewardsAccount';

// Mock dependencies
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../../hooks/rewards/useLinkAccountAddress', () => ({
  useLinkAccountAddress: jest.fn(),
}));

const mockUseI18nContext = useI18nContext as jest.MockedFunction<
  typeof useI18nContext
>;

const mockUseLinkAccountAddress = useLinkAccountAddress as jest.MockedFunction<
  typeof useLinkAccountAddress
>;

describe('AddRewardsAccount', () => {
  const mockT = jest.fn((key: string) => {
    if (key === 'rewardsLinkAccount') {
      return 'Link Account';
    }
    if (key === 'rewardsLinkAccountError') {
      return 'Error linking account';
    }
    if (key === 'rewardsPointsIcon') {
      return 'Rewards Points Icon';
    }
    return key;
  });

  const mockLinkAccountAddress = jest.fn();
  const defaultHookReturn = {
    linkAccountAddress: mockLinkAccountAddress,
    isLoading: false,
    isError: false,
  };

  let mockAccount: InternalAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
    mockUseLinkAccountAddress.mockReturnValue(defaultHookReturn);
    mockAccount = createMockInternalAccount({
      id: 'test-account-1',
      address: '0x1234567890123456789012345678901234567890',
      name: 'Test Account',
    });
  });

  describe('rendering', () => {
    it('should render the component with account', () => {
      render(<AddRewardsAccount account={mockAccount} />);

      expect(screen.getByText('Link Account')).toBeInTheDocument();
    });

    it('should render the rewards points icon when not loading', () => {
      render(<AddRewardsAccount account={mockAccount} />);

      const image = screen.getByAltText('Rewards Points Icon');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        'src',
        './images/metamask-rewards-points-alternative.svg',
      );
      expect(image).toHaveAttribute('width', '16');
      expect(image).toHaveAttribute('height', '16');
    });

    it('should return null when account is not provided', () => {
      const { container } = render(
        <AddRewardsAccount account={null as unknown as InternalAccount} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should call useLinkAccountAddress hook', () => {
      render(<AddRewardsAccount account={mockAccount} />);

      expect(mockUseLinkAccountAddress).toHaveBeenCalled();
    });

    it('should call useI18nContext hook', () => {
      render(<AddRewardsAccount account={mockAccount} />);

      expect(mockUseI18nContext).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading icon when isLoading is true', () => {
      mockUseLinkAccountAddress.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      const { container } = render(<AddRewardsAccount account={mockAccount} />);

      const loadingIcon = container.querySelector('svg');
      expect(loadingIcon).toBeInTheDocument();
      expect(
        screen.queryByAltText('Rewards Points Icon'),
      ).not.toBeInTheDocument();
    });

    it('should disable button when isLoading is true', () => {
      mockUseLinkAccountAddress.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      render(<AddRewardsAccount account={mockAccount} />);

      const button = screen.getByText('Link Account').closest('button');
      expect(button).toBeDisabled();
    });

    it('should not disable button when isLoading is false', () => {
      render(<AddRewardsAccount account={mockAccount} />);

      const button = screen.getByText('Link Account').closest('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('error state', () => {
    it('should show error icon when isError is true', () => {
      mockUseLinkAccountAddress.mockReturnValue({
        ...defaultHookReturn,
        isError: true,
      });

      const { container } = render(<AddRewardsAccount account={mockAccount} />);

      const errorIcons = container.querySelectorAll('svg');
      expect(errorIcons.length).toBeGreaterThan(0);
    });

    it('should show error text when isError is true', () => {
      mockUseLinkAccountAddress.mockReturnValue({
        ...defaultHookReturn,
        isError: true,
      });

      render(<AddRewardsAccount account={mockAccount} />);

      expect(screen.getByText('Error linking account')).toBeInTheDocument();
      expect(screen.queryByText('Link Account')).not.toBeInTheDocument();
    });

    it('should not show error icon when isError is false', () => {
      const { container } = render(<AddRewardsAccount account={mockAccount} />);

      // When not in error state, there should be no SVG icon in endAccessory
      // Only the image should be present in startAccessory
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBe(0);
    });
  });

  describe('user interaction', () => {
    it('should call linkAccountAddress when button is clicked', async () => {
      mockLinkAccountAddress.mockResolvedValue(true);

      render(<AddRewardsAccount account={mockAccount} />);

      const button = screen.getByText('Link Account');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLinkAccountAddress).toHaveBeenCalledWith(mockAccount);
      });
    });

    it('should not call linkAccountAddress when account is null', async () => {
      mockLinkAccountAddress.mockResolvedValue(true);

      const { container } = render(
        <AddRewardsAccount account={null as unknown as InternalAccount} />,
      );

      expect(container.firstChild).toBeNull();
      expect(mockLinkAccountAddress).not.toHaveBeenCalled();
    });

    it('should handle click when linkAccountAddress is called', async () => {
      mockLinkAccountAddress.mockResolvedValue(true);

      render(<AddRewardsAccount account={mockAccount} />);

      const button = screen.getByText('Link Account');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLinkAccountAddress).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('combined states', () => {
    it('should show loading icon and disable button when loading', () => {
      mockUseLinkAccountAddress.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
        isError: false,
      });

      const { container } = render(<AddRewardsAccount account={mockAccount} />);

      const loadingIcon = container.querySelector('svg');
      expect(loadingIcon).toBeInTheDocument();
      const button = screen.getByText('Link Account').closest('button');
      expect(button).toBeDisabled();
    });

    it('should show error icon and error text when error occurs', () => {
      mockUseLinkAccountAddress.mockReturnValue({
        ...defaultHookReturn,
        isLoading: false,
        isError: true,
      });

      const { container } = render(<AddRewardsAccount account={mockAccount} />);

      const errorIcons = container.querySelectorAll('svg');
      expect(errorIcons.length).toBeGreaterThan(0);
      expect(screen.getByText('Error linking account')).toBeInTheDocument();
    });

    it('should show normal state when not loading and no error', () => {
      const { container } = render(<AddRewardsAccount account={mockAccount} />);

      expect(screen.getByAltText('Rewards Points Icon')).toBeInTheDocument();
      expect(screen.getByText('Link Account')).toBeInTheDocument();
      // No SVG Icon components should be present, only the image
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBe(0);
    });
  });

  describe('translation', () => {
    it('should call translation function with rewardsLinkAccount key', () => {
      render(<AddRewardsAccount account={mockAccount} />);

      expect(mockT).toHaveBeenCalledWith('rewardsLinkAccount');
    });

    it('should call translation function with rewardsLinkAccountError key when error', () => {
      mockUseLinkAccountAddress.mockReturnValue({
        ...defaultHookReturn,
        isError: true,
      });

      render(<AddRewardsAccount account={mockAccount} />);

      expect(mockT).toHaveBeenCalledWith('rewardsLinkAccountError');
    });

    it('should call translation function with rewardsPointsIcon key for image alt', () => {
      render(<AddRewardsAccount account={mockAccount} />);

      expect(mockT).toHaveBeenCalledWith('rewardsPointsIcon');
    });
  });
});
