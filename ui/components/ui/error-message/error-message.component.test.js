import React from 'react';

import ErrorMessage from '.';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

describe('ErrorMessage Component', () => {
  it('should render a message from props.errorMessage', () => {
    const props = {
      errorMessage: 'This is an error.',
    };
    const { container } = renderWithProvider(<ErrorMessage {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should render a message translated from props.errorKey', () => {
    const props = {
      errorKey: 'testKey',
    };
    const { container } = renderWithProvider(<ErrorMessage {...props} />);

    expect(container).toMatchSnapshot();
  });
});
