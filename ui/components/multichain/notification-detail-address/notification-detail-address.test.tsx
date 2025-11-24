import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { NotificationDetailAddress } from './notification-detail-address';

const store = configureStore(mockState);

describe('NotificationDetailAddress', () => {
  it('renders without crashing', () => {
    renderWithProvider(
      <NotificationDetailAddress
        side="From"
        address="0x7830c87C02e56AFf27FA8Ab1241711331FA86F43"
      />,
      store,
    );
    expect(screen.getByText('From')).toBeInTheDocument();
  });
});
