import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import IntroPopup from './index';

describe('IntroPopup', () => {
  const createProps = (customProps = {}) => {
    return {
        onClose: jest.fn(),
      ...customProps,
    };
  };

  const store = configureMockStore()(global.createSwapsMockStore());

  test('renders the component with initial props', () => {
    const props = createProps();
    const { container } = renderWithProvider(
      <IntroPopup {...props} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });
});
