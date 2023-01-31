import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
  fireEvent,
} from '../../../../test/jest';
import DropdownInputPair from '.';

const createProps = (customProps = {}) => {
  return {
    onInputChange: jest.fn(),
    ...customProps,
  };
};

describe('DropdownInputPair', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByPlaceholderText } = renderWithProvider(
      <DropdownInputPair {...props} />,
      store,
    );
    expect(getByPlaceholderText('0')).toBeInTheDocument();
    expect(
      document.querySelector('.dropdown-input-pair__input'),
    ).toMatchSnapshot();
  });

  it('changes the input field', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByPlaceholderText } = renderWithProvider(
      <DropdownInputPair {...props} />,
      store,
    );
    fireEvent.change(getByPlaceholderText('0'), {
      target: { value: 1.1 },
    });
    expect(props.onInputChange).toHaveBeenCalledWith('1.1');
  });
});
