import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import UnlockPage from '.';

const mockMarkPasswordForgotten = jest.fn();

jest.mock('../../store/actions.ts', () => ({
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

  it('changes password and submits', () => {
    const props = {
      onSubmit: jest.fn(),
    };

    const { queryByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
    );

    const passwordField = queryByTestId('unlock-password');
    const loginButton = queryByTestId('unlock-submit');

    fireEvent.change(passwordField, { target: { value: 'a-password' } });
    expect(passwordField).toHaveAttribute('value', 'a-password');

    fireEvent.click(loginButton);

    expect(props.onSubmit).toHaveBeenCalled();
  });

  it('clicks imports seed button', () => {
    const { getByText } = renderWithProvider(<UnlockPage />, mockStore);

    fireEvent.click(getByText('Forgot password?'));

    expect(mockMarkPasswordForgotten).toHaveBeenCalled();
  });
});
