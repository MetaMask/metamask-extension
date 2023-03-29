import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import JwtUrlForm from './jwt-url-form';

describe('JwtUrlForm', function () {
  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
  };

  const store = configureMockStore()(mockStore);

  const props = {
    jwtList: ['jwt1'],
    currentJwt: 'jwt1',
    onJwtChange: sinon.spy(),
    jwtInputText: 'input text',
    apiUrl: 'url',
    urlInputText: '',
    onUrlChange: sinon.spy(),
  };

  it('opens JWT Url Form without input for new JWT', () => {
    const { container, getByText } = renderWithProvider(
      <JwtUrlForm {...props} />,
      store,
    );

    const btn = container.querySelector(
      '.jwt-url-form__btn__container .btn-secondary',
    );
    expect(btn).toHaveClass('button');
    expect(getByText('Add new token')).toBeInTheDocument();
  });

  it('shows JWT textarea with provided input text', () => {
    const { container } = renderWithProvider(<JwtUrlForm {...props} />, store);

    const btn = container.querySelector(
      '.jwt-url-form__btn__container .btn-secondary',
    );
    fireEvent.click(btn);
    expect(screen.getByText('input text')).toBeInTheDocument();
  });

  it('goes through the api url input', () => {
    const { queryByTestId } = renderWithProvider(
      <JwtUrlForm {...props} />,
      store,
    );

    const apiUrlinput = queryByTestId('jwt-api-url-input');
    fireEvent.change(apiUrlinput, { target: { value: 'url' } });
    expect(apiUrlinput.value).toBe('url');
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
});
