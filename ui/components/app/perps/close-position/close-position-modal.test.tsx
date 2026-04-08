import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockPositions } from '../mocks';
import { ClosePositionModal } from './close-position-modal';

/** Matches rendered `perpsClosePartialMinNotional` after $1 is replaced with a formatted USD amount */
const PARTIAL_MIN_NOTIONAL_PATTERN =
  /Partial closes must be at least \$[\d,.]+ in USD value\. Increase the close amount or set the slider to 100%\./u;

const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const basePosition = mockPositions[0];

describe('ClosePositionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue({ success: true });
  });

  describe('ORDER_SIZE_MIN from background', () => {
    it('shows localized min-notional message when close rejects with ORDER_SIZE_MIN', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('ORDER_SIZE_MIN'),
      );

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(
          screen.getByText(PARTIAL_MIN_NOTIONAL_PATTERN),
        ).toBeInTheDocument();
      });
    });
  });

  describe('invalid current price', () => {
    it('disables submit when currentPrice is zero even at 100% close', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={0}
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeDisabled();
    });

    it('disables submit when currentPrice is NaN', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={NaN}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      await user.keyboard('{ArrowLeft}');

      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeDisabled();
    });
  });

  describe('partial close below minimum USD notional', () => {
    it('disables submit when partial notional is just under $10 even if rounded to cents it would be $10', async () => {
      const user = userEvent.setup();
      const positionOneUnit = {
        ...basePosition,
        size: '1',
      };

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={positionOneUnit}
          currentPrice={19.992}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      await user.keyboard(
        Array.from({ length: 50 }, () => '{ArrowLeft}').join(''),
      );

      await waitFor(() => {
        expect(
          screen.getByText(PARTIAL_MIN_NOTIONAL_PATTERN),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('perps-close-position-modal-submit'),
        ).toBeDisabled();
      });
    });

    it('disables submit and shows warning when partial notional is under $10', async () => {
      const user = userEvent.setup();
      const smallPosition = {
        ...basePosition,
        size: '0.01',
      };

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={smallPosition}
          currentPrice={500}
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).not.toBeDisabled();

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(
          screen.getByText(PARTIAL_MIN_NOTIONAL_PATTERN),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('perps-close-position-modal-submit'),
        ).toBeDisabled();
      });
    });
  });
});
