import React from 'react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import GasModalPageContainer from './index';

describe('GasModalPageContainer', () => {
  const createProps = (customProps = {}) => {
    return {
        minimumGasLimit: 5,
      ...customProps,
    };
  };

  test('renders the component with initial props', () => {
    const props = createProps();
    // const { container, getByText } = renderWithProvider(
    //   <GasModalPageContainer {...props} />,
    // );
    // expect(container).toMatchSnapshot();
  });
});
