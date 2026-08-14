import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { tEn } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import * as environmentType from '../../../../shared/lib/environment-type';
import PasskeyItem from './passkey-item';

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

/** Must match private Google Password Manager AAGUID in shared/lib/passkey/passkey-sidepanel-aaguid.ts */
const GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID =
  'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4';

describe('PasskeyItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders the passkey unlock toggle when the passkey feature is available', () => {
    renderWithProvider(<PasskeyItem />, mockStore);

    expect(
      screen.getByText(
        tEn('unlockWithPasskey', [tEn('passkeyAuthMethodBiometrics')]),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('security-passkey-settings-toggle'),
    ).toBeInTheDocument();
  });

  it('opens security and password settings in browser when disabling in sidepanel with incompatible AAGUID', () => {
    const openExtensionInBrowser = jest.fn();
    globalThis.platform = { openExtensionInBrowser } as never;

    jest
      .spyOn(environmentType, 'getEnvironmentType')
      .mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

    const storeWithGpmPasskey = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        passkeyRecord: {
          credential: {
            id: 'cred-id',
            aaguid: GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID,
          },
        },
      },
    });

    renderWithProvider(<PasskeyItem />, storeWithGpmPasskey);

    fireEvent.click(screen.getByTestId('security-passkey-settings-toggle'));

    expect(openExtensionInBrowser).toHaveBeenCalledWith(
      SECURITY_AND_PASSWORD_ROUTE,
    );

    delete (globalThis as { platform?: unknown }).platform;
    jest.restoreAllMocks();
  });
});
