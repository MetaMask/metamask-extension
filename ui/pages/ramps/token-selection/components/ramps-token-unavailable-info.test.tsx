import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { RampsTokenUnavailableInfo } from './ramps-token-unavailable-info';

describe('RampsTokenUnavailableInfo', () => {
  it('opens and closes the "Token unavailable" modal from the info button', () => {
    const store = configureStore(mockState);
    renderWithProvider(<RampsTokenUnavailableInfo />, store);

    expect(
      screen.queryByText(messages.rampsTokenUnavailableTitle.message),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ramps-token-unavailable-info-button'));

    expect(
      screen.getByText(messages.rampsTokenUnavailableTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.rampsTokenUnavailableDescription.message),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(messages.gotIt.message));

    expect(
      screen.queryByText(messages.rampsTokenUnavailableTitle.message),
    ).not.toBeInTheDocument();
  });
});
