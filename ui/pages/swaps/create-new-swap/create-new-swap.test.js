import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import CreateNewSwap from '.';

const createProps = (customProps = {}) => {
  return {
    sensitiveProperties: {},
    ...customProps,
  };
};

describe('CreateNewSwap', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(
      <CreateNewSwap {...props} />,
      store,
    );
    expect(getByText('Create a new swap')).toBeInTheDocument();
  });
});
