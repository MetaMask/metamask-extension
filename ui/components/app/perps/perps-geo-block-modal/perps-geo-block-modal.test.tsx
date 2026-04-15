import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { PerpsGeoBlockModal } from './perps-geo-block-modal';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsGeoBlockModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and description when open', () => {
    renderWithProvider(<PerpsGeoBlockModal {...defaultProps} />, mockStore);

    expect(
      screen.getByText(messages.perpsGeoBlockedTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsGeoBlockedDescription.message),
    ).toBeInTheDocument();
  });

  it('renders a "Got it" dismiss button', () => {
    renderWithProvider(<PerpsGeoBlockModal {...defaultProps} />, mockStore);

    expect(
      screen.getByTestId('perps-geo-block-modal-dismiss'),
    ).toBeInTheDocument();
  });

  it('calls onClose when dismiss button is clicked', () => {
    renderWithProvider(<PerpsGeoBlockModal {...defaultProps} />, mockStore);

    fireEvent.click(screen.getByTestId('perps-geo-block-modal-dismiss'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
