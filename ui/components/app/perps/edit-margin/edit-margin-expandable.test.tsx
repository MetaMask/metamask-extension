import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockPositions, mockAccountState } from '../mocks';
import { EditMarginExpandable } from './edit-margin-expandable';

const mockGetPerpsController = jest.fn();
const mockGetPerpsStreamManager = jest.fn();

jest.mock('../../../../providers/perps', () => ({
  getPerpsController: (...args: unknown[]) => mockGetPerpsController(...args),
}));

jest.mock('../../../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => ({ isEligible: true }),
}));

jest.mock('../../../../providers/perps/PerpsStreamManager', () => ({
  getPerpsStreamManager: () => mockGetPerpsStreamManager(),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const defaultProps = {
  position: mockPositions[0],
  account: mockAccountState,
  currentPrice: 2900,
  selectedAddress: '0x123',
  isExpanded: true,
  onToggle: jest.fn(),
};

describe('EditMarginExpandable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPerpsController.mockResolvedValue({
      updateMargin: jest.fn().mockResolvedValue({ success: true }),
      getPositions: jest.fn().mockResolvedValue(mockPositions),
    });
    mockGetPerpsStreamManager.mockReturnValue({
      pushPositionsWithOverrides: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('renders Add Margin and Remove Margin mode options when expanded', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      const addMarginElements = screen.getAllByText('Add Margin');
      // Mode toggle tab + confirm button both show 'Add Margin'
      expect(addMarginElements.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Remove Margin')).toBeInTheDocument();
    });

    it('renders amount input and preset buttons when expanded', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    it('renders confirm button with Add Margin when in add mode', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      const buttons = screen.getAllByRole('button', { name: /Add Margin/iu });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Available balance in add mode', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      expect(screen.getByText('Available balance')).toBeInTheDocument();
    });

    it('shows Max removable when Remove is selected', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      fireEvent.click(screen.getByText('Remove Margin'));

      expect(screen.getByText('Max removable')).toBeInTheDocument();
    });
  });

  describe('mode toggle', () => {
    it('switches to Remove mode when Remove Margin is clicked', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      fireEvent.click(screen.getByText('Remove Margin'));

      expect(screen.getByText('Max removable')).toBeInTheDocument();
    });

    it('switches back to Add mode when Add Margin is clicked', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      fireEvent.click(screen.getByText('Remove Margin'));
      fireEvent.click(screen.getByText('Add Margin'));

      expect(screen.getByText('Available balance')).toBeInTheDocument();
    });
  });

  describe('preset buttons', () => {
    it('sets amount when a preset is clicked', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      fireEvent.click(screen.getByText('25%'));

      const input = screen.getByPlaceholderText('0.00');
      expect(input).toHaveValue();
      expect(parseFloat((input as HTMLInputElement).value)).toBeGreaterThan(0);
    });
  });

  describe('submit', () => {
    it('calls controller updateMargin and onToggle on successful submit', async () => {
      const onToggle = jest.fn();
      const updateMargin = jest.fn().mockResolvedValue({ success: true });
      const getPositions = jest.fn().mockResolvedValue(mockPositions);

      mockGetPerpsController.mockResolvedValue({
        updateMargin,
        getPositions,
      });

      renderWithProvider(
        <EditMarginExpandable
          {...defaultProps}
          onToggle={onToggle}
          isExpanded
        />,
        mockStore,
      );

      const input = screen.getByPlaceholderText('0.00');
      fireEvent.change(input, { target: { value: '100' } });

      const confirmButton = screen.getByRole('button', {
        name: /Add Margin/iu,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockGetPerpsController).toHaveBeenCalledWith('0x123');
        expect(updateMargin).toHaveBeenCalledWith({
          symbol: mockPositions[0].symbol,
          amount: '100',
        });
      });
      await waitFor(() => {
        expect(onToggle).toHaveBeenCalled();
      });
    });

    it('does not call updateMargin when amount is empty', () => {
      const updateMargin = jest.fn().mockResolvedValue({ success: true });

      mockGetPerpsController.mockResolvedValue({
        updateMargin,
        getPositions: jest.fn().mockResolvedValue(mockPositions),
      });

      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      const confirmButton = screen.getByRole('button', {
        name: /Add Margin/iu,
      });
      expect(confirmButton).toBeDisabled();
      fireEvent.click(confirmButton);

      expect(updateMargin).not.toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('shows error message when updateMargin fails', async () => {
      mockGetPerpsController.mockResolvedValue({
        updateMargin: jest
          .fn()
          .mockResolvedValue({ success: false, error: 'Insufficient balance' }),
        getPositions: jest.fn().mockResolvedValue(mockPositions),
      });

      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      const input = screen.getByPlaceholderText('0.00');
      fireEvent.change(input, { target: { value: '100' } });

      const confirmButton = screen.getByRole('button', {
        name: /Add Margin/iu,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
      });
    });
  });
});
