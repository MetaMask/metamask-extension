import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import { NotificationsSettingsAccount } from './notifications-settings-account';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  toChecksumHexAddress: jest.fn().mockImplementation((address) => address),
}));

describe('NotificationsSettingsAccount', () => {
  it('renders the component with an address and a name', () => {
    const testAddress = '0x7830c87C02e56AFf27FA8Ab1241711331FA86F43';
    const testName = 'Account Name';

    const store = configureStore({});
    renderWithProvider(
      <NotificationsSettingsAccount address={testAddress} name={testName} />,
      store,
    );

    expect(screen.getByText(testName)).toBeInTheDocument();
    expect(screen.getByText(/0x7830c...86F43/u)).toBeInTheDocument();
  });

  it('renders the component with only an address', () => {
    const testAddress = '0x7830c87C02e56AFf27FA8Ab1241711331FA86F43';

    const store = configureStore({});
    renderWithProvider(
      <NotificationsSettingsAccount address={testAddress} />,
      store,
    );

    expect(screen.getByText(/0x7830c...86F43/u)).toBeInTheDocument();
    expect(
      screen.getByText(/0x7830c87C02e56AFf27FA8Ab1241711331FA86F43/u),
    ).toBeInTheDocument();
  });
});
