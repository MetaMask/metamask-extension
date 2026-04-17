import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
import * as actionConstants from '../../../../store/actionConstants';
import { PasskeySettingsToastType } from '../../../../../shared/constants/app-state';
import RegisterPasskey from './register-passkey';

const mockUseNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockProtectVaultKeyWithPasskey = jest.fn().mockResolvedValue(undefined);
const mockGeneratePasskeyRegistrationOptions = jest.fn().mockResolvedValue({
  rp: { name: 'MetaMask' },
  user: { id: 'AQ', name: 'MetaMask User', displayName: 'MetaMask' },
  challenge: 'AQ',
  pubKeyCredParams: [
    { alg: -7, type: 'public-key' },
    { alg: -257, type: 'public-key' },
  ],
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'required',
    authenticatorAttachment: 'platform',
  },
  extensions: { prf: { eval: { first: 'AQ' } } },
});
const mockForceUpdateMetamaskState = jest.fn().mockResolvedValue(undefined);

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../../../../shared/lib/passkey', () => ({
  startPasskeyRegistration: jest.fn().mockResolvedValue({
    id: 'AQ',
    rawId: 'AQ',
    type: 'public-key',
    response: {
      clientDataJSON: 'e30',
      attestationObject: 'e30',
    },
    clientExtensionResults: {},
  }),
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  generatePasskeyRegistrationOptions: (...args: unknown[]) =>
    mockGeneratePasskeyRegistrationOptions(...args),
  protectVaultKeyWithPasskey: (...args: unknown[]) =>
    mockProtectVaultKeyWithPasskey(...args),
  forceUpdateMetamaskState: (...args: unknown[]) =>
    mockForceUpdateMetamaskState(...args),
}));

describe('RegisterPasskey', () => {
  const mockStore = configureMockStore()(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the biometrics heading and setup button', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <RegisterPasskey />,
      mockStore,
    );

    expect(getByText('Unlock with biometrics')).toBeInTheDocument();
    expect(getByTestId('register-passkey-set-up-button')).toBeInTheDocument();
  });

  it('renders cancel button when not from change-password', () => {
    const { getByTestId } = renderWithProvider(
      <RegisterPasskey />,
      mockStore,
    );

    expect(getByTestId('register-passkey-cancel-button')).toHaveTextContent(
      'Cancel',
    );
  });

  it('does not show password changed banner without from param', () => {
    const { queryByTestId } = renderWithProvider(
      <RegisterPasskey />,
      mockStore,
    );

    expect(
      queryByTestId('register-passkey-password-changed-banner'),
    ).not.toBeInTheDocument();
  });

  it('shows password changed banner when from=change-password', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <RegisterPasskey />,
      mockStore,
      '/settings/security-and-privacy/register-passkey?from=change-password',
    );

    expect(
      getByTestId('register-passkey-password-changed-banner'),
    ).toBeInTheDocument();
    expect(getByText('Your password was changed')).toBeInTheDocument();
  });

  it('shows maybe later button when from=change-password', () => {
    const { getByTestId } = renderWithProvider(
      <RegisterPasskey />,
      mockStore,
      '/settings/security-and-privacy/register-passkey?from=change-password',
    );

    expect(getByTestId('register-passkey-cancel-button')).toHaveTextContent(
      'Maybe later',
    );
  });

  it('navigates to security settings on cancel', () => {
    const { getByTestId } = renderWithProvider(
      <RegisterPasskey />,
      mockStore,
    );

    fireEvent.click(getByTestId('register-passkey-cancel-button'));

    expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE, {
      replace: true,
    });
  });

  it('completes passkey registration and navigates to security settings', async () => {
    const { getByTestId } = renderWithProvider(
      <RegisterPasskey />,
      mockStore,
    );

    fireEvent.click(getByTestId('register-passkey-set-up-button'));

    await waitFor(() => {
      expect(mockGeneratePasskeyRegistrationOptions).toHaveBeenCalled();
      expect(mockProtectVaultKeyWithPasskey).toHaveBeenCalled();
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: actionConstants.SET_SHOW_PASSKEY_SETTINGS_TOAST,
        payload: PasskeySettingsToastType.TurnedOn,
      });
      expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE, {
        replace: true,
      });
    });
  });

  it('navigates to security settings even on registration failure', async () => {
    mockProtectVaultKeyWithPasskey.mockRejectedValueOnce(
      new Error('cancelled'),
    );

    const { getByTestId } = renderWithProvider(
      <RegisterPasskey />,
      mockStore,
    );

    fireEvent.click(getByTestId('register-passkey-set-up-button'));

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE, {
        replace: true,
      });
    });
  });
});
