import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  fireEvent,
  createSwapsMockStore,
  screen,
} from '../../../../test/jest';
import {
  SLIPPAGE_HIGH_ERROR,
  SLIPPAGE_LOW_ERROR,
} from '../../../../shared/constants/swaps';
import SlippageNotificationModal from './slippage-notification-modal';

const middleware = [thunk];

const createProps = (customProps = {}) => {
  return {
    isOpen: true,
    slippageErrorKey: SLIPPAGE_HIGH_ERROR,
    setSlippageNotificationModalOpened: jest.fn(),
    onSwapSubmit: jest.fn(),
    currentSlippage: 1,
    ...customProps,
  };
};

describe('SlippageNotificationModal', () => {
  it('renders the component with the SLIPPAGE_HIGH_ERROR, clicks on "Swap anyway"', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({ currentSlippage: 10 });
    const { getByText } = renderWithProvider(
      <SlippageNotificationModal {...props} />,
      store,
    );
    expect(screen.getByTestId('swaps-banner-title')).toHaveTextContent(
      'High slippage',
    );
    expect(
      getByText(
        'The slippage entered (10%) is considered very high and may result in a bad rate',
      ),
    ).toBeInTheDocument();
    expect(getByText('Adjust slippage')).toBeInTheDocument();
    const swapAnywayButton = getByText('Swap anyway');
    expect(swapAnywayButton).toBeInTheDocument();
    fireEvent.click(swapAnywayButton);
    expect(props.onSwapSubmit).toHaveBeenCalledWith({
      acknowledgedSlippage: true,
    });
    expect(props.setSlippageNotificationModalOpened).not.toHaveBeenCalledWith(
      false,
    );
  });

  it('renders the component with the SLIPPAGE_LOW_ERROR, clicks on "Swap anyway"', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({
      slippageErrorKey: SLIPPAGE_LOW_ERROR,
    });
    const { getByText } = renderWithProvider(
      <SlippageNotificationModal {...props} />,
      store,
    );
    expect(screen.getByTestId('swaps-banner-title')).toHaveTextContent(
      'Low slippage',
    );
    expect(
      getByText('A value this low (1%) may result in a failed swap'),
    ).toBeInTheDocument();
    expect(getByText('Adjust slippage')).toBeInTheDocument();
    expect(getByText('Swap anyway')).toBeInTheDocument();
    const swapAnywayButton = getByText('Swap anyway');
    expect(swapAnywayButton).toBeInTheDocument();
    fireEvent.click(swapAnywayButton);
    expect(props.onSwapSubmit).toHaveBeenCalledWith({
      acknowledgedSlippage: true,
    });
    expect(props.setSlippageNotificationModalOpened).not.toHaveBeenCalledWith(
      false,
    );
  });
});
