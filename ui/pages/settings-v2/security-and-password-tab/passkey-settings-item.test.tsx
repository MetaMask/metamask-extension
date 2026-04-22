import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import PasskeySettingsItem from './passkey-settings-item';

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsPasskeyFeatureEnabled: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../../../shared/lib/passkey'),
  isWebAuthnSupported: jest.fn().mockReturnValue(true),
  cancelPasskeyCeremony: jest.fn(),
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('PasskeySettingsItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders the passkey unlock toggle when the passkey feature is available', () => {
    renderWithProvider(<PasskeySettingsItem />, mockStore);

    expect(
      screen.getByText(messages.unlockWithBiometrics.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('security-passkey-settings-toggle'),
    ).toBeInTheDocument();
  });
});
