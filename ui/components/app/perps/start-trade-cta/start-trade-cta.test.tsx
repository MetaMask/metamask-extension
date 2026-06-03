import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { StartTradeCta } from './start-trade-cta';

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));

jest.mock('../../../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('StartTradeCta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
  });

  it('renders the CTA button', () => {
    renderWithProvider(<StartTradeCta />, mockStore);

    expect(screen.getByTestId('start-new-trade-cta')).toBeInTheDocument();
  });

  it('displays the start new trade text', () => {
    renderWithProvider(<StartTradeCta />, mockStore);

    expect(screen.getByText(/start a new trade/iu)).toBeInTheDocument();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    renderWithProvider(<StartTradeCta onPress={onPress} />, mockStore);

    const button = screen.getByTestId('start-new-trade-cta');
    fireEvent.click(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without onPress callback', () => {
    renderWithProvider(<StartTradeCta />, mockStore);

    const button = screen.getByTestId('start-new-trade-cta');
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('is clickable as a button', () => {
    const onPress = jest.fn();
    renderWithProvider(<StartTradeCta onPress={onPress} />, mockStore);

    const button = screen.getByTestId('start-new-trade-cta');
    expect(button).not.toBeDisabled();
  });

  it('renders the plus icon', () => {
    renderWithProvider(<StartTradeCta />, mockStore);

    const cta = screen.getByTestId('start-new-trade-cta');
    expect(cta).toBeInTheDocument();
  });

  it('handles multiple clicks', () => {
    const onPress = jest.fn();
    renderWithProvider(<StartTradeCta onPress={onPress} />, mockStore);

    const button = screen.getByTestId('start-new-trade-cta');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('shows geo-block modal and does not call onPress when geo-blocked', () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
    const onPress = jest.fn();
    renderWithProvider(<StartTradeCta onPress={onPress} />, mockStore);

    fireEvent.click(screen.getByTestId('start-new-trade-cta'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
  });
});
