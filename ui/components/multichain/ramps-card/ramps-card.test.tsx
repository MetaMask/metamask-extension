import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { submitRequestToBackground } from '../../../store/background-connection';
import { RampsCard, RAMPS_CARD_VARIANT_TYPES } from './ramps-card';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const renderRampsCard = (variant: string, handleOnClick?: VoidFunction) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      isRampCardClosed: false,
    },
  });
  return renderWithProvider(
    <RampsCard variant={variant} handleOnClick={handleOnClick} />,
    store,
  );
};

describe('RampsCard', () => {
  it('renders RampsCard component with TOKEN variant', () => {
    renderRampsCard(RAMPS_CARD_VARIANT_TYPES.TOKEN);
    expect(screen.getByText('Tips for using a wallet')).toBeInTheDocument();
    expect(
      screen.getByText('Adding tokens unlocks more ways to use web3.'),
    ).toBeInTheDocument();
  });

  it('renders RampsCard component with ACTIVITY variant', () => {
    renderRampsCard(RAMPS_CARD_VARIANT_TYPES.ACTIVITY);
    expect(screen.getByText('Tips for using a wallet')).toBeInTheDocument();
    expect(
      screen.getByText('Adding tokens unlocks more ways to use web3.'),
    ).toBeInTheDocument();
  });

  it('renders RampsCard component with BTC variant', () => {
    renderRampsCard(RAMPS_CARD_VARIANT_TYPES.BTC);
    expect(screen.getByText('Tips for using a wallet')).toBeInTheDocument();
    expect(
      screen.getByText('Adding tokens unlocks more ways to use web3.'),
    ).toBeInTheDocument();
  });

  it('calls handleOnClick when CTA button is clicked', () => {
    const handleOnClick = jest.fn();
    renderRampsCard(RAMPS_CARD_VARIANT_TYPES.TOKEN, handleOnClick);
    fireEvent.click(screen.getByText('Token marketplace'));
    expect(handleOnClick).toHaveBeenCalled();
  });

  it('calls submitRequestToBackground when close button is clicked', () => {
    renderRampsCard(RAMPS_CARD_VARIANT_TYPES.TOKEN);
    fireEvent.click(screen.getByTestId('ramp-card-close-btn'));
    expect(submitRequestToBackground).toHaveBeenCalledWith('setRampCardClosed');
  });

  it('does not render RampsCard component when isRampCardClosed is true', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        isRampCardClosed: true,
      },
    });
    renderWithProvider(
      <RampsCard variant={RAMPS_CARD_VARIANT_TYPES.TOKEN} />,
      store,
    );
    expect(
      screen.queryByText('Tips for using a wallet'),
    ).not.toBeInTheDocument();
  });
});
