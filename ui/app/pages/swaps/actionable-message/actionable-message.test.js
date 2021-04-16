import React from 'react';
import { render } from '@testing-library/react';

import ActionableMessage from './index';

describe('ActionableMessage', () => {
  const createProps = (customProps = {}) => {
    return {
      message: 'I am an actionable message!',
      ...customProps,
    };
  };

  test('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByText } = render(<ActionableMessage {...props} />);
    expect(getByText(props.message)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
