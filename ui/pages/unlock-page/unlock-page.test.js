import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import UnlockPage from './unlock-page.component';

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

    const { getByTestId } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
    );

    const passwordField = getByTestId('unlock-password');
    const loginButton = getByTestId('unlock-submit');

    fireEvent.change(passwordField, { target: { value: 'a-password' } });
    expect(passwordField.value).toBe('a-password');

    fireEvent.click(loginButton);

    expect(props.onSubmit).toHaveBeenCalled();
  });

  it('clicks imports seed button', () => {
    const props = {
      onRestore: mockMarkPasswordForgotten,
    };

    const { getByText } = renderWithProvider(
      <UnlockPage {...props} />,
      mockStore,
    );

    fireEvent.click(getByText('Forgot password?'));

    expect(mockMarkPasswordForgotten).toHaveBeenCalled();
  });
});
