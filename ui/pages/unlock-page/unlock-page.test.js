import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import UnlockPage from '.';

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
    const { getByText, getByTestId } = renderWithProvider(
      <UnlockPage />,
      mockStore,
    );

    fireEvent.click(getByText('Forgot password?'));

    const resetPasswordButton = getByTestId('reset-password-modal-button');

    expect(resetPasswordButton).toBeInTheDocument();

    fireEvent.click(resetPasswordButton);

    expect(mockMarkPasswordForgotten).toHaveBeenCalled();
  });

  it('should redirect to history location when unlocked', () => {
    const intendedPath = '/previous-route';
    const mockStateWithUnlock = {
      metamask: { isUnlocked: true },
    };
    const store = configureMockStore([thunk])(mockStateWithUnlock);
    const history = createMemoryHistory({
      initialEntries: [
        { pathname: '/unlock', state: { from: { pathname: intendedPath } } },
      ],
    });
    jest.spyOn(history, 'push');
    renderWithProvider(
      <Router history={history}>
        <UnlockPage />
      </Router>,
      store,
    );
    expect(history.push).toHaveBeenCalledTimes(1);
    expect(history.push).toHaveBeenCalledWith(intendedPath);
    expect(history.location.pathname).toBe(intendedPath);
  });

  it('changes password, submits, and redirects to the specified route', async () => {
    const intendedPath = '/intended-route';
    const intendedSearch = '?abc=123';
    const mockStateNonUnlocked = {
      metamask: { isUnlocked: false },
    };
    const store = configureMockStore([thunk])(mockStateNonUnlocked);
    const history = createMemoryHistory({
      initialEntries: [
        {
          pathname: '/unlock',
          state: { from: { pathname: intendedPath, search: intendedSearch } },
        },
      ],
    });
    jest.spyOn(history, 'push');
    const { queryByTestId } = renderWithProvider(
      <Router history={history}>
        <UnlockPage />
      </Router>,
      store,
    );
    const passwordField = queryByTestId('unlock-password');
    const loginButton = queryByTestId('unlock-submit');
    fireEvent.change(passwordField, { target: { value: 'a-password' } });
    fireEvent.click(loginButton);
    await Promise.resolve(); // Wait for async operations

    expect(mockTryUnlockMetamask).toHaveBeenCalledTimes(1);
    expect(history.push).toHaveBeenCalledTimes(1);
    expect(history.push).toHaveBeenCalledWith(intendedPath + intendedSearch);
    expect(history.location.pathname).toBe(intendedPath);
    expect(history.location.search).toBe(intendedSearch);
  });
});
