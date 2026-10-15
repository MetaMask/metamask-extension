import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { IconColor } from '@metamask/design-system-react';

import mockState from '../../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import { OrderEntryHeader } from './order-entry-header';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('OrderEntryHeader', () => {
  it('renders the market identity and negative price change', () => {
    renderWithProvider(
      <OrderEntryHeader
        displayName="BTC"
        displayPrice="$64,486"
        displayChange="-0.91%"
        onBack={jest.fn()}
      />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-order-entry-asset-symbol'),
    ).toHaveTextContent('BTC');
    expect(screen.getByTestId('perps-order-entry-price')).toHaveTextContent(
      '$64,486',
    );
    expect(screen.getByTestId('perps-order-entry-change')).toHaveTextContent(
      '-0.91%',
    );
    expect(screen.getByTestId('perps-order-entry-change')).toHaveClass(
      'text-error-default',
    );
  });

  it('calls onBack when the back control is clicked', () => {
    const onBack = jest.fn();
    renderWithProvider(
      <OrderEntryHeader
        displayName="BTC"
        displayPrice="$64,486"
        onBack={onBack}
      />,
      mockStore,
    );

    const backButton = screen.getByRole('button', {
      name: messages.back.message,
    });
    expect(backButton).toHaveAttribute(
      'data-testid',
      'perps-order-entry-back-button',
    );
    expect(backButton.querySelector('svg')).toHaveClass(
      IconColor.IconAlternative,
    );
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('supports flow-specific test identifiers', () => {
    renderWithProvider(
      <OrderEntryHeader
        displayName="ETH"
        displayPrice="$2,900"
        displayChange="+1.25%"
        onBack={jest.fn()}
        testIdPrefix="perps-close-position"
      />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-close-position-asset-symbol'),
    ).toHaveTextContent('ETH');
    expect(screen.getByTestId('perps-close-position-change')).toHaveTextContent(
      '+1.25%',
    );
  });
});
