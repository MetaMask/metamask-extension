import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import DropdownInputPair from '.';

const createProps = (customProps = {}) => {
  return {
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
});
