import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { SeedlessOnboardingControllerErrorMessage } from '@metamask/seedless-onboarding-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { ONBOARDING_WELCOME_ROUTE } from '../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import UnlockPage from '.';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockUseNavState = jest.fn(() => null);
jest.mock('../../contexts/navigation-state', () => ({
  useNavState: () => mockUseNavState(),
  useSetNavState: () => jest.fn(),
  NavigationStateProvider: ({ children }) => children,
}));

jest.mock('../onboarding-flow/welcome/fox-appear-animation', () => ({
  __esModule: true,
  default: () => <div data-testid="fox-appear-animation" />,
}));

const mockTryUnlockMetamask = jest.fn(() => {
  return async () => {
    return Promise.resolve();
  };
});
const mockMarkPasswordForgotten = jest.fn();
const mockResetWallet = jest.fn(() => {
  return Promise.resolve();
});

jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  tryUnlockMetamask: () => mockTryUnlockMetamask,
  markPasswordForgotten: () => mockMarkPasswordForgotten,
  resetWallet: () => mockResetWallet,
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

  const mockState = {
    metamask: {},
  };
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavState.mockReturnValue(null); // Reset navState to null for each test
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<UnlockPage />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('changes password and submits', async () => {
    const props = {
      onSubmit: jest.fn(),
    };

    const { queryByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
    );

    const passwordField = queryByTestId('unlock-password');
    const loginButton = queryByTestId('unlock-submit');

    expect(passwordField).toBeInTheDocument();
    expect(passwordField).toHaveAttribute('type', 'password');
    expect(passwordField.nodeName).toBe('INPUT');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toBeDisabled();

    fireEvent.change(passwordField, { target: { value: 'a-password' } });

    expect(loginButton).toBeEnabled();

    fireEvent.click(loginButton);

    expect(props.onSubmit).toHaveBeenCalled();
  });

  it('clicks imports seed button', () => {
    const mockStateNonUnlocked = {
      metamask: { completedOnboarding: true },
    };
    const store = configureMockStore([thunk])(mockStateNonUnlocked);
    const { getByText, getByTestId } = renderWithProvider(
      <UnlockPage />,
      store,
    );

    fireEvent.click(getByText('Forgot password?'));

    const resetPasswordButton = getByTestId('reset-password-modal-button');

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

    const { queryByText } = renderWithProvider(
      <UnlockPage {...props} />,
      store,
      '/unlock',
    );

    fireEvent.click(queryByText('Use a different login method'));

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
    const pathname = '/unlock';
    const locationState = { from: { pathname: intendedPath } };

    renderWithProvider(<UnlockPage />, store, {
      pathname,
      state: locationState,
    });

    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(intendedPath);
  });

  it('should redirect to context-stored location when unlocked (HashRouter v5-compat workaround)', () => {
    const intendedPath = '/previous-route';
    const mockStateWithUnlock = {
      metamask: { isUnlocked: true },
    };
    const store = configureMockStore([thunk])(mockStateWithUnlock);

    const pathname = '/unlock';

    // Mock navState to provide the redirect location (v5-compat way)
    mockUseNavState.mockReturnValueOnce({
      from: { pathname: intendedPath },
    });

    renderWithProvider(<UnlockPage />, store, {
      pathname,
    });

    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(intendedPath);
  });

  it('changes password, submits, and redirects to the specified route (from location.state)', async () => {
    const intendedPath = '/intended-route';
    const intendedSearch = '?abc=123';
    const mockStateNonUnlocked = {
      metamask: { isUnlocked: false },
    };
    const store = configureMockStore([thunk])(mockStateNonUnlocked);

    // Set up the router to have the location state that would come from a redirect
    const pathname = '/unlock';
    const locationState = {
      from: { pathname: intendedPath, search: intendedSearch },
    };

    const { queryByTestId } = renderWithProvider(<UnlockPage />, store, {
      pathname,
      state: locationState,
    });

    const passwordField = queryByTestId('unlock-password');
    const loginButton = queryByTestId('unlock-submit');
    fireEvent.change(passwordField, { target: { value: 'a-password' } });
    fireEvent.click(loginButton);
    await Promise.resolve(); // Wait for async operations

    expect(mockTryUnlockMetamask).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(intendedPath + intendedSearch);
  });

  it('changes password, submits, and redirects to the specified route (from navState)', async () => {
    const intendedPath = '/intended-route';
    const intendedSearch = '?abc=123';
    const mockStateNonUnlocked = {
      metamask: { isUnlocked: false },
    };
    const store = configureMockStore([thunk])(mockStateNonUnlocked);

    const pathname = '/unlock';

    // Mock navState to provide the redirect location (v5-compat way)
    mockUseNavState.mockReturnValue({
      from: { pathname: intendedPath, search: intendedSearch },
    });

    const { queryByTestId } = renderWithProvider(<UnlockPage />, store, {
      pathname,
    });

    const passwordField = queryByTestId('unlock-password');
    const loginButton = queryByTestId('unlock-submit');
    fireEvent.change(passwordField, { target: { value: 'a-password' } });
    fireEvent.click(loginButton);
    await Promise.resolve(); // Wait for async operations

    expect(mockTryUnlockMetamask).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(intendedPath + intendedSearch);
  });

  it('should show login error modal when authentication error is thrown', async () => {
    const intendedPath = '/intended-route';
    const intendedSearch = '?abc=123';
    const mockStateNonUnlocked = {
      metamask: { isUnlocked: false, completedOnboarding: true },
    };
    const store = configureMockStore([thunk])(mockStateNonUnlocked);
    const pathname = '/unlock';
    // Mock navState to provide the redirect location (v5-compat way)
    mockUseNavState.mockReturnValue({
      from: { pathname: intendedPath, search: intendedSearch },
    });

    mockTryUnlockMetamask.mockImplementationOnce(
      jest.fn(() => {
        return Promise.reject(
          new Error(
            SeedlessOnboardingControllerErrorMessage.AuthenticationError,
          ),
        );
      }),
    );
    const mockForceUpdateMetamaskState = jest.fn();

    const { queryByTestId } = renderWithProvider(
      <UnlockPage forceUpdateMetamaskState={mockForceUpdateMetamaskState} />,
      store,
      {
        pathname,
      },
    );
    const passwordField = queryByTestId('unlock-password');
    const loginButton = queryByTestId('unlock-submit');
    fireEvent.change(passwordField, { target: { value: 'a-password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(queryByTestId('login-error-modal')).toBeInTheDocument();
    });
  });
});
