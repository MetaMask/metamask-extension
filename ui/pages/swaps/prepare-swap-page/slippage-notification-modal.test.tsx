import React from 'react';

import { renderWithProvider, fireEvent } from '../../../../test/jest';
import {
  SLIPPAGE_VERY_HIGH_ERROR,
  SLIPPAGE_TOO_LOW_ERROR,
} from '../../../../shared/constants/swaps';
import SlippageNotificationModal from './slippage-notification-modal';

const createProps = (customProps = {}) => {
  return {
    isOpen: true,
    slippageErrorKey: SLIPPAGE_VERY_HIGH_ERROR,
    setSlippageNotificationModalOpened: jest.fn(),
    onSwapSubmit: jest.fn(),
    ...customProps,
  };
};

describe('SlippageNotificationModal', () => {
  it('renders the component with the SLIPPAGE_VERY_HIGH_ERROR, clicks on "Swap anyway"', () => {
    const props = createProps();
    const { getByText } = renderWithProvider(
      <SlippageNotificationModal {...props} />,
    );
    expect(getByText('High slippage')).toBeInTheDocument();
    expect(getByText('Very high slippage')).toBeInTheDocument();
    expect(
      getByText(
        'The slippage entered is considered very high and may result in a bad rate.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Edit transaction settings')).toBeInTheDocument();
    const swapAnywayButton = getByText('Swap anyway');
    expect(swapAnywayButton).toBeInTheDocument();
    fireEvent.click(swapAnywayButton);
    expect(props.onSwapSubmit).toHaveBeenCalledWith({
      acknowledgedSlippage: true,
    });
    expect(props.setSlippageNotificationModalOpened).toHaveBeenCalledWith(
      false,
    );
  });

  it('renders the component with the SLIPPAGE_TOO_LOW_ERROR, clicks on "Swap anyway"', () => {
    const props = createProps({
      slippageErrorKey: SLIPPAGE_TOO_LOW_ERROR,
    });
    const { getByText } = renderWithProvider(
      <SlippageNotificationModal {...props} />,
    );
    expect(getByText('Low slippage')).toBeInTheDocument();
    expect(
      getByText('Increase slippage to avoid transaction failure'),
    ).toBeInTheDocument();
    expect(
      getByText(
        'Max slippage is too low which may cause your transaction to fail.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Edit transaction settings')).toBeInTheDocument();
    expect(getByText('Swap anyway')).toBeInTheDocument();
    const swapAnywayButton = getByText('Swap anyway');
    expect(swapAnywayButton).toBeInTheDocument();
    fireEvent.click(swapAnywayButton);
    expect(props.onSwapSubmit).toHaveBeenCalledWith({
      acknowledgedSlippage: true,
    });
    expect(props.setSlippageNotificationModalOpened).toHaveBeenCalledWith(
      false,
    );
  });
});
