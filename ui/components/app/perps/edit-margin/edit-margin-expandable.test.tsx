import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { mockPositions, mockAccountState } from '../mocks';
import { EditMarginExpandable } from './edit-margin-expandable';

const mockGetPerpsStreamManager = jest.fn();
const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => ({ isEligible: true }),
}));

jest.mock('../../../../providers/perps', () => ({
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
  isExpanded: true,
  onToggle: jest.fn(),
};

describe('EditMarginExpandable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsUpdateMargin') {
        return Promise.resolve({ success: true });
      }
      if (method === 'perpsGetPositions') {
        return Promise.resolve(mockPositions);
      }
      return Promise.resolve(undefined);
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

      const addMarginElements = screen.getAllByText(
        messages.perpsAddMargin.message,
      );
      // Mode toggle tab + confirm button both show 'Add Margin'
      expect(addMarginElements.length).toBeGreaterThanOrEqual(2);
      expect(
        screen.getByText(messages.perpsRemoveMargin.message),
      ).toBeInTheDocument();
    });

    it('renders amount input and preset buttons when expanded', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText(messages.max.message)).toBeInTheDocument();
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

      expect(
        screen.getByText(messages.perpsAvailableBalance.message),
      ).toBeInTheDocument();
    });

    it('shows Max removable when Remove is selected', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      fireEvent.click(screen.getByText(messages.perpsRemoveMargin.message));

      expect(
        screen.getByText(messages.perpsMaxRemovable.message),
      ).toBeInTheDocument();
    });
  });

  describe('mode toggle', () => {
    it('switches to Remove mode when Remove Margin is clicked', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      fireEvent.click(screen.getByText(messages.perpsRemoveMargin.message));

      expect(
        screen.getByText(messages.perpsMaxRemovable.message),
      ).toBeInTheDocument();
    });

    it('switches back to Add mode when Add Margin is clicked', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      fireEvent.click(screen.getByText(messages.perpsRemoveMargin.message));
      fireEvent.click(screen.getByText(messages.perpsAddMargin.message));

      expect(
        screen.getByText(messages.perpsAvailableBalance.message),
      ).toBeInTheDocument();
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
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsUpdateMargin',
          [{ symbol: mockPositions[0].symbol, amount: '100' }],
        );
      });
      await waitFor(() => {
        expect(onToggle).toHaveBeenCalled();
      });
    });

    it('does not call updateMargin when amount is empty', () => {
      renderWithProvider(
        <EditMarginExpandable {...defaultProps} isExpanded />,
        mockStore,
      );

      const confirmButton = screen.getByRole('button', {
        name: /Add Margin/iu,
      });
      expect(confirmButton).toBeDisabled();
      fireEvent.click(confirmButton);

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsUpdateMargin',
        expect.any(Array),
      );
    });
  });

  describe('error display', () => {
    it('shows error message when updateMargin fails', async () => {
      mockSubmitRequestToBackground.mockResolvedValueOnce({
        success: false,
        error: 'Insufficient balance',
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
