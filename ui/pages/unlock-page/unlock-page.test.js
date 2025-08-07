import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { MemoryRouter } from 'react-router-dom-v5-compat';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { ONBOARDING_WELCOME_ROUTE } from '../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import UnlockPage from '.';

const mockNavigate = jest.fn();
const mockLocation = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation(),
  };
});

const mockTryUnlockMetamask = jest.fn(() => {
  return async () => {
    return Promise.resolve();
  };
});
const mockMarkPasswordForgotten = jest.fn();

jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  tryUnlockMetamask: () => mockTryUnlockMetamask,
  markPasswordForgotten: () => mockMarkPasswordForgotten,
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

  afterEach(() => {
    jest.resetAllMocks();
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

    const mockHistoryPush = jest.fn();
    mockNavigate.mockReturnValue(mockHistoryPush);

    const mockForceUpdateMetamaskState = jest.fn();

    const props = {
      loginWithDifferentMethod: mockNavigate,
      forceUpdateMetamaskState: mockForceUpdateMetamaskState,
    };

    const { queryByText } = renderWithProvider(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/unlock',
            state: { from: { pathname: ONBOARDING_WELCOME_ROUTE } },
          },
        ]}
      >
        <UnlockPage {...props} />
      </MemoryRouter>,
      store,
    );

    fireEvent.click(queryByText('Use a different login method'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE, {
        replace: true,
      });
    });
  });

  describe('Redirect on unlock', () => {
    it('should redirect to intended route on unlock', () => {
      const intendedPath = '/send';
      // Update mockLocation to match the test scenario
      mockLocation.mockReturnValue({
        pathname: '/unlock',
        state: { from: { pathname: intendedPath } },
        search: '',
      });

      const mockStateWithUnlock = {
        metamask: { isUnlocked: true },
      };
      const store = configureMockStore([thunk])(mockStateWithUnlock);
      renderWithProvider(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/unlock',
              state: { from: { pathname: intendedPath } },
            },
          ]}
        >
          <UnlockPage />
        </MemoryRouter>,
        store,
      );
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(intendedPath);
    });

    it('should redirect to intended route with search params on unlock', async () => {
      const intendedPath = '/send';
      const intendedSearch =
        '?asset=0x0000000000000000000000000000000000000000';
      // Update mockLocation to match the test scenario
      mockLocation.mockReturnValue({
        pathname: '/unlock',
        state: {
          from: { pathname: intendedPath, search: intendedSearch },
        },
        search: '',
      });

      const mockStateNonUnlocked = {
        metamask: { isUnlocked: false },
      };
      const store = configureMockStore([thunk])(mockStateNonUnlocked);
      const { queryByTestId } = renderWithProvider(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/unlock',
              state: {
                from: { pathname: intendedPath, search: intendedSearch },
              },
            },
          ]}
        >
          <UnlockPage />
        </MemoryRouter>,
        store,
      );
      const passwordField = queryByTestId('unlock-password');
      const loginButton = queryByTestId('unlock-submit');
      fireEvent.change(passwordField, { target: { value: 'a-password' } });
      fireEvent.click(loginButton);
      await Promise.resolve(); // Wait for async operations

      expect(mockTryUnlockMetamask).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(intendedPath + intendedSearch);
    });
  });
});
