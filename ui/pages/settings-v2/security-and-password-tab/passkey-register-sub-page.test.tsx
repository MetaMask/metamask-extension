import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { SECOND } from '../../../../shared/constants/time';
import { toast } from '../../../components/ui/toast/toast';
import PasskeyRegisterSubPage from './passkey-register-sub-page';

jest.mock('../../../components/ui/toast/toast', () => ({
  toast: {
    success: jest.fn(),
  },
  ToastContent: ({ title }: { title: string }) => title,
}));

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

jest.mock('../../../../shared/lib/passkey', () => ({
  cancelPasskeyCeremony: jest.fn(),
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

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  generatePasskeyRegistrationOptions: (...args: unknown[]) =>
    mockGeneratePasskeyRegistrationOptions(...args),
  protectVaultKeyWithPasskey: (...args: unknown[]) =>
    mockProtectVaultKeyWithPasskey(...args),
  forceUpdateMetamaskState: (...args: unknown[]) =>
    mockForceUpdateMetamaskState(...args),
}));

describe('PasskeyRegisterSubPage', () => {
  const mockStore = configureMockStore()(mockState);
  const mockToastSuccess = jest.mocked(toast.success);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the passkey registration description and setup button', () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    expect(getByTestId('register-passkey-description')).toBeInTheDocument();
    expect(getByTestId('register-passkey-set-up-button')).toBeInTheDocument();
  });

  it('renders cancel button when not from change-password', () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    expect(getByTestId('register-passkey-cancel-button')).toHaveTextContent(
      'Cancel',
    );
  });

  it('does not show password changed banner without from param', () => {
    const { queryByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    expect(
      queryByTestId('register-passkey-password-changed-banner'),
    ).not.toBeInTheDocument();
  });

  it('shows password changed banner when from=change-password', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <PasskeyRegisterSubPage />,
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
      <PasskeyRegisterSubPage />,
      mockStore,
      '/settings/security-and-privacy/register-passkey?from=change-password',
    );

    expect(getByTestId('register-passkey-cancel-button')).toHaveTextContent(
      'Maybe later',
    );
  });

  it('navigates to security and password settings on cancel', () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    fireEvent.click(getByTestId('register-passkey-cancel-button'));

    expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_AND_PASSWORD_ROUTE, {
      replace: true,
    });
  });

  it('completes passkey registration and navigates to security and password settings', async () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    fireEvent.click(getByTestId('register-passkey-set-up-button'));

    await waitFor(() => {
      expect(mockGeneratePasskeyRegistrationOptions).toHaveBeenCalled();
      expect(mockProtectVaultKeyWithPasskey).toHaveBeenCalled();
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess.mock.calls[0][1]).toStrictEqual({
        duration: 5 * SECOND,
      });
      expect(mockUseNavigate).toHaveBeenCalledWith(
        SECURITY_AND_PASSWORD_ROUTE,
        {
          replace: true,
        },
      );
    });
  });

  it('stays on register passkey when registration fails', async () => {
    mockProtectVaultKeyWithPasskey.mockRejectedValueOnce(
      new Error('cancelled'),
    );

    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    fireEvent.click(getByTestId('register-passkey-set-up-button'));

    await waitFor(() => {
      expect(mockProtectVaultKeyWithPasskey).toHaveBeenCalled();
    });

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});
