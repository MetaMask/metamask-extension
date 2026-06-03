import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { SeedlessOnboardingControllerErrorMessage } from '@metamask/seedless-onboarding-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { captureException } from '../../../shared/lib/sentry';
import { ONBOARDING_WELCOME_ROUTE } from '../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  generatePasskeyAuthenticationOptions,
  tryUnlockMetamaskWithPasskey,
} from '../../store/actions';
import UnlockPageImport from '.';

// The container uses compose() which returns ComponentType, but TypeScript sees it as 'any'
const UnlockPage = UnlockPageImport as React.ComponentType<
  Record<string, unknown>
>;

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../onboarding-flow/welcome/fox-appear-animation', () => ({
  // This is the name of the property that turns this into an ES module.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="fox-appear-animation" />,
}));

jest.mock('../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/passkey')>(
    '../../../shared/lib/passkey',
  ),
  startPasskeyAuthentication: jest.fn().mockResolvedValue({
    id: 'cred',
    rawId: 'cred',
    type: 'public-key',
    response: {
      clientDataJSON: 'e30',
      authenticatorData: 'AA',
      signature: 'AQ',
    },
  }),
  isWebAuthnSupported: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../shared/lib/environment'),
  getIsPasskeyFeatureEnabled: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockTryUnlockMetamask = jest.fn(() => {
  return async () => {
    return Promise.resolve();
  };
});
const mockTryUnlockMetamaskWithPasskey = jest.fn(() => {
  return async () => {
    return Promise.resolve();
  };
});
const mockMarkPasswordForgotten = jest.fn();
const mockCaptureException = captureException as jest.MockedFunction<
  typeof captureException
>;

jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  tryUnlockMetamask: jest.fn(() => mockTryUnlockMetamask),
  tryUnlockMetamaskWithPasskey: jest.fn(() => mockTryUnlockMetamaskWithPasskey),
  markPasswordForgotten: () => mockMarkPasswordForgotten,
  generatePasskeyAuthenticationOptions: jest.fn().mockResolvedValue({
    challenge: 'AQ',
    allowCredentials: [{ id: 'AQ', type: 'public-key' }],
    userVerification: 'required',
  }),
}));

const mockElement = document.createElement('svg');

jest.mock('@metamask/logo', () => () => {
  return {
    container: mockElement,
    setFollowMouse: jest.fn(),
    stopAnimation: jest.fn(),
    lookAt: jest.fn(),
    lookAtAndRender: jest.fn(),
  };
});

describe('Unlock Page', () => {
  process.env.METAMASK_BUILD_TYPE = 'main';

  /** So `UnlockPasskeySection` selectors (`getAccountType` → `getCurrentKeyring`) do not throw. */
  const mockUnlockInternalAccounts = {
    selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    accounts: {
      'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          importTime: 0,
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: ['personal_sign', 'eth_signTransaction'],
        scopes: ['eip155:0'],
        type: 'eip155:eoa',
      },
    },
  };

  const mockState = {
    metamask: { passkeyRecord: null },
  };
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<UnlockPage />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('changes password and submits', async () => {
    const props = {
      onSubmit: jest.fn(),
    };

    const { queryByTestId, findByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
    );

    const passwordField = await findByTestId('unlock-password');
    const loginButton = queryByTestId('unlock-submit');

    expect(passwordField).toBeInTheDocument();
    expect(passwordField).toHaveAttribute('type', 'password');
    expect(passwordField?.nodeName).toBe('INPUT');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toBeDisabled();

    fireEvent.change(passwordField as HTMLElement, {
      target: { value: 'a-password' },
    });

    expect(loginButton).toBeEnabled();

    fireEvent.click(loginButton as HTMLElement);

    expect(props.onSubmit).toHaveBeenCalled();
  });

  it('clicks imports seed button', async () => {
    const mockStateNonUnlocked = {
      metamask: { completedOnboarding: true },
    };
    const store = configureMockStore([thunk])(mockStateNonUnlocked);
    const { getByText, findByTestId } = renderWithProvider(
      <UnlockPage />,
      store,
    );

    await findByTestId('unlock-password');

    fireEvent.click(getByText(messages.forgotPassword.message));

    const resetPasswordButton = await findByTestId(
      'reset-password-modal-button',
    );

    expect(resetPasswordButton).toBeInTheDocument();

    fireEvent.click(resetPasswordButton);

    expect(mockMarkPasswordForgotten).toHaveBeenCalled();
  });

  it('clicks use different login method button', async () => {
    const mockStateWithUnlock = {
      metamask: {
        firstTimeFlowType: FirstTimeFlowType.socialImport,
        completedOnboarding: false,
      },
    };
    const store = configureMockStore([thunk])(mockStateWithUnlock);

    const mockLoginWithDifferentMethod = jest.fn();
    const mockForceUpdateMetamaskState = jest.fn();

    const props = {
      loginWithDifferentMethod: mockLoginWithDifferentMethod,
      forceUpdateMetamaskState: mockForceUpdateMetamaskState,
    };

    const { queryByText, findByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      store,
      '/unlock',
    );

    await findByTestId('unlock-password');

    fireEvent.click(
      queryByText(messages.useDifferentLoginMethod.message) as HTMLElement,
    );

    await waitFor(() => {
      expect(mockLoginWithDifferentMethod).toHaveBeenCalled();
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE, {
        replace: true,
      });
    });
  });
  it('should redirect to history location when unlocked (from state)', () => {
    const intendedPath = '/previous-route';
    const mockStateWithUnlock = {
      metamask: { isUnlocked: true },
    };
    const store = configureMockStore([thunk])(mockStateWithUnlock);

    // Set up the router to have the location state that would come from a redirect
    const locationState = { from: { pathname: intendedPath } };

    renderWithProvider(<UnlockPage />, store, {
      pathname: '/unlock',
      state: locationState,
    } as unknown as string);

    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(intendedPath, {
      replace: true,
    });
  });

  it('changes password, submits, and redirects to the specified route (from location.state)', async () => {
    const intendedPath = '/intended-route';
    const intendedSearch = '?abc=123';
    const mockStateNonUnlocked = {
      metamask: { isUnlocked: false },
    };
    const store = configureMockStore([thunk])(mockStateNonUnlocked);

    // Set up the router to have the location state that would come from a redirect
    const locationState = {
      from: { pathname: intendedPath, search: intendedSearch },
    };

    const { queryByTestId, findByTestId } = renderWithProvider(
      <UnlockPage />,
      store,
      {
        pathname: '/unlock',
        state: locationState,
      } as unknown as string,
    );

    const passwordField = (await findByTestId(
      'unlock-password',
    )) as HTMLElement;
    const loginButton = queryByTestId('unlock-submit') as HTMLElement;
    fireEvent.change(passwordField, { target: { value: 'a-password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockTryUnlockMetamask).toHaveBeenCalledTimes(1);
      expect(mockUseNavigate).toHaveBeenCalledTimes(1);
      expect(mockUseNavigate).toHaveBeenCalledWith(
        intendedPath + intendedSearch,
        {
          replace: true,
        },
      );
    });
  });

  it('should show login error modal when authentication error is thrown', async () => {
    const mockStateNonUnlocked = {
      metamask: { isUnlocked: false, completedOnboarding: true },
    };
    const store = configureMockStore([thunk])(mockStateNonUnlocked);
    (mockTryUnlockMetamask as jest.Mock).mockImplementationOnce(() => {
      return Promise.reject(
        new Error(SeedlessOnboardingControllerErrorMessage.AuthenticationError),
      );
    });
    const mockForceUpdateMetamaskState = jest.fn();

    const { queryByTestId, findByTestId } = renderWithProvider(
      <UnlockPage forceUpdateMetamaskState={mockForceUpdateMetamaskState} />,
      store,
      '/unlock',
    );

    const passwordField = (await findByTestId(
      'unlock-password',
    )) as HTMLElement;
    const loginButton = queryByTestId('unlock-submit') as HTMLElement;
    fireEvent.change(passwordField, { target: { value: 'a-password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(queryByTestId('login-error-modal')).toBeInTheDocument();
    });

    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: SeedlessOnboardingControllerErrorMessage.AuthenticationError,
      }),
    );
  });

  it('shows password unlock when no passkey is registered', async () => {
    const { queryByTestId } = renderWithProvider(<UnlockPage />, mockStore);

    await waitFor(() => {
      expect(queryByTestId('unlock-biometrics')).not.toBeInTheDocument();
      expect(queryByTestId('unlock-password')).toBeInTheDocument();
    });
  });

  it('starts passkey unlock on mount when a passkey is registered', async () => {
    const mockForceUpdateMetamaskState = jest.fn().mockResolvedValue(undefined);
    const store = configureMockStore([thunk])({
      metamask: {
        completedOnboarding: true,
        internalAccounts: mockUnlockInternalAccounts,
        passkeyRecord: {
          credentialId: 'cred',
          derivationMethod: 'prf',
          wrappedEncryptionKey: 'e30',
          iv: 'e30',
        },
      },
    });

    renderWithProvider(
      <UnlockPage forceUpdateMetamaskState={mockForceUpdateMetamaskState} />,
      store,
      '/unlock',
    );

    await waitFor(() => {
      expect(generatePasskeyAuthenticationOptions).toHaveBeenCalled();
      expect(tryUnlockMetamaskWithPasskey).toHaveBeenCalled();
    });
  });

  it('does not start passkey unlock on mount when passkeyAutoUnlockSuppressed is set', async () => {
    const mockForceUpdateMetamaskState = jest.fn().mockResolvedValue(undefined);
    const store = configureMockStore([thunk])({
      metamask: {
        completedOnboarding: true,
        internalAccounts: mockUnlockInternalAccounts,
        passkeyRecord: {
          credentialId: 'cred',
          derivationMethod: 'prf',
          wrappedEncryptionKey: 'e30',
          iv: 'e30',
        },
        passkeyAutoUnlockSuppressed: true,
      },
    });

    renderWithProvider(
      <UnlockPage forceUpdateMetamaskState={mockForceUpdateMetamaskState} />,
      store,
      '/unlock',
    );

    await waitFor(() => {
      expect(generatePasskeyAuthenticationOptions).not.toHaveBeenCalled();
      expect(tryUnlockMetamaskWithPasskey).not.toHaveBeenCalled();
    });
  });

  it('does not start passkey unlock during onboarding incomplete flow', async () => {
    const store = configureMockStore([thunk])({
      metamask: {
        completedOnboarding: false,
        internalAccounts: mockUnlockInternalAccounts,
        passkeyRecord: {
          credentialId: 'cred',
          derivationMethod: 'prf',
          wrappedEncryptionKey: 'e30',
          iv: 'e30',
        },
      },
    });

    renderWithProvider(<UnlockPage />, store, '/onboarding/unlock');

    await waitFor(() => {
      expect(generatePasskeyAuthenticationOptions).not.toHaveBeenCalled();
      expect(tryUnlockMetamaskWithPasskey).not.toHaveBeenCalled();
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });
  });
});
