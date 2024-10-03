import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import JwtUrlForm from './jwt-url-form';

describe('JwtUrlForm', function () {
  const mockStore = {
    metamask: {},
  };

  const store = configureMockStore()(mockStore);

  const props = {
    jwtList: ['jwt1'],
    currentJwt: 'jwt1',
    onJwtChange: jest.fn(),
    jwtInputText: 'input text',
    onUrlChange: jest.fn(),
  };

  it('opens JWT Url Form without input for new JWT', () => {
    const { getByText } = renderWithProvider(<JwtUrlForm {...props} />, store);

    expect(getByText('Add new token')).toBeInTheDocument();
  });

  it('shows JWT textarea with provided input text', () => {
    const { getAllByTestId } = renderWithProvider(
      <JwtUrlForm {...props} />,
      store,
    );

    const btn = getAllByTestId('addNewToken-btn')[0];
    fireEvent.click(btn);
    expect(screen.getByText('input text')).toBeInTheDocument();
  });

  it('shows JWT text area when no jwt token exists', () => {
    const customProps = {
      ...props,
      currentJwt: '',
      jwtList: [],
    };

    const { container } = renderWithProvider(
      <JwtUrlForm {...customProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('calls onJwtChange when JWT textarea value changes', () => {
    const customProps = {
      ...props,
      currentJwt: '',
      jwtList: [],
    };

    const { getByTestId } = renderWithProvider(
      <JwtUrlForm {...customProps} />,
      store,
    );
    fireEvent.change(getByTestId('jwt-input'), { target: { value: 'jwt2' } });
    expect(props.onJwtChange).toHaveBeenCalled();
  });

  it('shows JWT dropdown when jwtList has at least one token', () => {
    const { getByTestId } = renderWithProvider(
      <JwtUrlForm {...props} />,
      store,
    );

    expect(getByTestId('jwt-dropdown')).toBeInTheDocument();
  });

  it('calls onJwtChange when JWT dropdown value changes', () => {
    const { getByTestId } = renderWithProvider(
      <JwtUrlForm {...props} />,
      store,
    );

    fireEvent.change(getByTestId('jwt-dropdown'), {
      target: { value: 'jwt2' },
    });

    expect(props.onJwtChange).toHaveBeenCalled();
  });
});
