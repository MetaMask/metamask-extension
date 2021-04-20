import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../../test/jest';
import IntroPopup from '.';

const createProps = (customProps = {}) => {
  return {
    onClose: jest.fn(),
    ...customProps,
  };
};

describe('IntroPopup', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { container } = renderWithProvider(<IntroPopup {...props} />, store);
    expect(container).toMatchSnapshot();
  });
});
