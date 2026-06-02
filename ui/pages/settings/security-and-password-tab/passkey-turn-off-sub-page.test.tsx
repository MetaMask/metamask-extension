import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { toast } from '@metamask/design-system-react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { SECOND } from '../../../../shared/constants/time';
import PasskeyTurnOffSubPage from './passkey-turn-off-sub-page';
import React from 'react';

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  return {
    ...actual,
    toast: Object.assign(jest.fn(), { dismiss: jest.fn() }),
  };
});

const mockUseNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockRemovePasskeyWithPasswordVerification = jest
  .fn()
  .mockResolvedValue(undefined);
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

const mockVerifyPassword = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  removePasskeyWithPasswordVerification: (...args: unknown[]) =>
    mockRemovePasskeyWithPasswordVerification(...args),
  forceUpdateMetamaskState: (...args: unknown[]) =>
    mockForceUpdateMetamaskState(...args),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/passkey')>(
    '../../../../shared/lib/passkey',
  ),
  cancelPasskeyCeremony: jest.fn(),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/sentry')>(
    '../../../../shared/lib/sentry',
  ),
  captureException: jest.fn(),
}));

const stateWithPasskey = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    passkeyRecord: { credentialId: 'test-credential' },
  },
};

describe('PasskeyTurnOffSubPage', () => {
  const mockStore = configureMockStore()(stateWithPasskey);
  const mockStoreWithoutPasskey = configureMockStore()(mockState);
  const mockToast = jest.mocked(toast);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to security when biometrics is not registered', async () => {
    const { queryByTestId } = renderWithProvider(
      <PasskeyTurnOffSubPage />,
      mockStoreWithoutPasskey,
    );

    expect(
      queryByTestId('turn-off-passkey-password-input'),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        SECURITY_AND_PASSWORD_ROUTE,
        { replace: true },
      );
    });
  });

  it('renders the verify-password step first', () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyTurnOffSubPage />,
      mockStore,
    );

    expect(getByTestId('turn-off-passkey-password-input')).toBeInTheDocument();
    expect(
      getByTestId('turn-off-passkey-verify-continue-button'),
    ).toBeInTheDocument();
  });

  it('completes turn off and navigates to security and password settings', async () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyTurnOffSubPage />,
      mockStore,
    );

    fireEvent.change(getByTestId('turn-off-passkey-password-input'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(getByTestId('turn-off-passkey-verify-continue-button'));

    await waitFor(() => {
      expect(mockVerifyPassword).toHaveBeenCalledWith('test-password');
      expect(mockRemovePasskeyWithPasswordVerification).toHaveBeenCalledWith(
        'test-password',
      );
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          title: expect.any(String),
        }),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        SECURITY_AND_PASSWORD_ROUTE,
        {
          replace: true,
        },
      );
    });
  });

  it('shows error toast and navigates home when removal fails', async () => {
    mockRemovePasskeyWithPasswordVerification.mockRejectedValueOnce(
      new Error('failed'),
    );

    const { getByTestId } = renderWithProvider(
      <PasskeyTurnOffSubPage />,
      mockStore,
    );

    fireEvent.change(getByTestId('turn-off-passkey-password-input'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(getByTestId('turn-off-passkey-verify-continue-button'));

    await waitFor(() => {
      expect(mockVerifyPassword).toHaveBeenCalledWith('test-password');
      expect(mockRemovePasskeyWithPasswordVerification).toHaveBeenCalledWith(
        'test-password',
      );
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'danger',
          title: expect.any(String),
        }),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        SECURITY_AND_PASSWORD_ROUTE,
        {
          replace: true,
        },
      );
    });
  });
});
