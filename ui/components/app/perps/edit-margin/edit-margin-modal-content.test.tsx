import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockPositions, mockAccountState } from '../mocks';
import { EditMarginModalContent } from './edit-margin-modal-content';

const mockSubmitRequestToBackground = jest.fn();
const mockReplacePerpsToastByKey = jest.fn();
const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
  usePerpsEventTracking: () => ({ track: jest.fn() }),
}));

jest.mock('../../../../hooks/perps/usePerpsMarginCalculations', () => ({
  usePerpsMarginCalculations: () => ({
    maxAmount: 5000,
    anchorLiquidationPrice: 2000,
    estimatedLiquidationPrice: 1800,
    anchorLiquidationDistance: 0.2,
    estimatedLiquidationDistance: 0.3,
    riskAssessment: { riskLevel: 'safe' },
    isValid: true,
  }),
}));

jest.mock('../../../../providers/perps', () => ({
  getPerpsStreamManager: () => ({
    pushPositionsWithOverrides: jest.fn(),
    positions: {
      getCachedData: jest.fn().mockReturnValue(mockPositions),
      pushData: jest.fn(),
    },
  }),
}));

jest.mock('../perps-toast', () => ({
  PERPS_TOAST_KEYS: {
    MARGIN_ADD_FAILED: 'perpsToastMarginAddFailed',
    MARGIN_ADD_IN_PROGRESS: 'perpsToastMarginAddInProgress',
    MARGIN_ADD_SUCCESS: 'perpsToastMarginAddSuccess',
    MARGIN_REMOVE_FAILED: 'perpsToastMarginRemoveFailed',
    MARGIN_REMOVE_IN_PROGRESS: 'perpsToastMarginRemoveInProgress',
    MARGIN_REMOVE_SUCCESS: 'perpsToastMarginRemoveSuccess',
  },
  usePerpsToast: () => ({
    replacePerpsToastByKey: mockReplacePerpsToastByKey,
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const basePosition = mockPositions[0];

const defaultProps = {
  position: basePosition,
  account: mockAccountState,
  currentPrice: 2900,
  mode: 'add' as const,
  onClose: jest.fn(),
};

describe('EditMarginModalContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockSubmitRequestToBackground.mockResolvedValue({ success: true });
  });

  it('renders the margin form', () => {
    renderWithProvider(<EditMarginModalContent {...defaultProps} />, mockStore);

    expect(screen.getByText(/available/iu)).toBeInTheDocument();
  });

  describe('geo-blocking', () => {
    it('shows geo-block modal instead of saving when user is not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });

      renderWithProvider(
        <EditMarginModalContent {...defaultProps} />,
        mockStore,
      );

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });

      const confirmButton = screen.getByTestId('perps-edit-margin-confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });
});
