import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import CustomNonce from './custom-nonce';

describe('CustomNonce', () => {
  const store = configureMockStore()({});
  let props = {};

  beforeEach(() => {
    props = {
      nextNonce: 1,
      customNonceValue: '',
      showCustomizeNonceModal: jest.fn(),
    };
  });

  it('should render CustomNonce component header', () => {
    const { queryByText } = renderWithProvider(
      <CustomNonce {...props} />,
      store,
    );

    expect(queryByText('Nonce')).toBeInTheDocument();
    expect(queryByText('Edit')).toBeInTheDocument();
  });

  it('should render CustomNonce component value when custom nonce value is a empty string', () => {
    const { queryByText } = renderWithProvider(
      <CustomNonce {...props} />,
      store,
    );

    expect(queryByText('Nonce')).toBeInTheDocument();
    expect(queryByText('Edit')).toBeInTheDocument();
    expect(queryByText('1')).toBeInTheDocument();
  });

  it('should render CustomNonce component value when custom nonce value is edited', () => {
    props.customNonceValue = '3';
    const { queryByText } = renderWithProvider(
      <CustomNonce {...props} />,
      store,
    );

    expect(queryByText('Nonce')).toBeInTheDocument();
    expect(queryByText('Edit')).toBeInTheDocument();
    expect(queryByText('3')).toBeInTheDocument();
  });

  it('should render CustomNonce component to show customize nonce modal', () => {
    const { queryByText, getByText } = renderWithProvider(
      <CustomNonce {...props} />,
      store,
    );

    const editButton = getByText('Edit');
    expect(queryByText('Nonce')).toBeInTheDocument();
    expect(editButton).toBeInTheDocument();
    expect(queryByText('1')).toBeInTheDocument();
    fireEvent.click(editButton);
    expect(props.showCustomizeNonceModal).toHaveBeenCalledTimes(1);
  });
});
