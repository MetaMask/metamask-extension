import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { SECOND } from '../../../../shared/constants/time';
import { toast } from '../../../components/ui/toast/toast';
import PasskeyTurnOffSubPage from './passkey-turn-off-sub-page';

jest.mock('../../../components/ui/toast/toast', () => ({
  toast: {
    success: jest.fn(),
  },
  ToastContent: ({ title }: { title: string }) => title,
}));

const mockUseNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockRemovePasskeyWithPasswordVerification = jest
  .fn()
  .mockResolvedValue(undefined);
const mockForceUpdateMetamaskState = jest.fn().mockResolvedValue(undefined);
const mockGeneratePasskeyAuthenticationOptions = jest.fn().mockResolvedValue({
  challenge: 'AQ',
});
const mockRemovePasskeyWithPasskeyVerification = jest
  .fn()
  .mockResolvedValue(undefined);

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
  startPasskeyAuthentication: jest.fn().mockResolvedValue({
    id: 'AQ',
    rawId: 'AQ',
    type: 'public-key',
    response: {
      clientDataJSON: 'e30',
      authenticatorData: 'e30',
      signature: 'e30',
    },
    clientExtensionResults: {},
  }),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  removePasskeyWithPasswordVerification: (password: string) =>
    mockRemovePasskeyWithPasswordVerification(password),
  forceUpdateMetamaskState: () => mockForceUpdateMetamaskState(),
  generatePasskeyAuthenticationOptions: (...args: unknown[]) =>
    mockGeneratePasskeyAuthenticationOptions(...args),
  removePasskeyWithPasskeyVerification: (...args: unknown[]) =>
    mockRemovePasskeyWithPasskeyVerification(...args),
}));

describe('PasskeyTurnOffSubPage', () => {
  const mockStore = configureMockStore()(mockState);
  const mockToastSuccess = jest.mocked(toast.success);

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    mockRemovePasskeyWithPasswordVerification.mockResolvedValue(undefined);
    mockGeneratePasskeyAuthenticationOptions.mockResolvedValue({
      challenge: 'AQ',
    });
    mockRemovePasskeyWithPasskeyVerification.mockResolvedValue(undefined);
  });

  it('submits password and navigates to security and password on success', async () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyTurnOffSubPage />,
      mockStore,
    );

    fireEvent.change(getByTestId('turn-off-passkey-password-input'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(getByTestId('turn-off-passkey-submit'));

    await waitFor(() => {
      expect(mockRemovePasskeyWithPasswordVerification).toHaveBeenCalledWith(
        'correct-password',
      );
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess.mock.calls[0][1]).toStrictEqual({
        duration: 5 * SECOND,
      });
      expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_AND_PASSWORD_ROUTE);
    });
  });

  it('shows incorrect password error when verification fails', async () => {
    mockRemovePasskeyWithPasswordVerification.mockRejectedValueOnce(
      new Error('wrong'),
    );

    const { getByTestId, getByText } = renderWithProvider(
      <PasskeyTurnOffSubPage />,
      mockStore,
    );

    fireEvent.change(getByTestId('turn-off-passkey-password-input'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(getByTestId('turn-off-passkey-submit'));

    await waitFor(() => {
      expect(
        getByText('Password is incorrect. Please try again.'),
      ).toBeInTheDocument();
    });
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('attempts passkey removal first when enrolled, then navigates on success', async () => {
    const storeWithPasskey = configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        passkeyRecord: { credentialId: 'test' },
      },
    });

    renderWithProvider(<PasskeyTurnOffSubPage />, storeWithPasskey);

    await waitFor(() => {
      expect(mockGeneratePasskeyAuthenticationOptions).toHaveBeenCalled();
      expect(mockRemovePasskeyWithPasskeyVerification).toHaveBeenCalled();
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_AND_PASSWORD_ROUTE);
    });

    expect(mockRemovePasskeyWithPasswordVerification).not.toHaveBeenCalled();
  });

  it('shows password fallback when automatic passkey removal fails', async () => {
    mockRemovePasskeyWithPasskeyVerification.mockRejectedValueOnce(
      new Error('cancelled'),
    );

    const storeWithPasskey = configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        passkeyRecord: { credentialId: 'test' },
      },
    });

    const { getByTestId } = renderWithProvider(
      <PasskeyTurnOffSubPage />,
      storeWithPasskey,
    );

    await waitFor(() => {
      expect(
        getByTestId('turn-off-passkey-password-input'),
      ).toBeInTheDocument();
    });

    fireEvent.change(getByTestId('turn-off-passkey-password-input'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(getByTestId('turn-off-passkey-submit'));

    await waitFor(() => {
      expect(mockRemovePasskeyWithPasswordVerification).toHaveBeenCalledWith(
        'correct-password',
      );
    });
  });
});
