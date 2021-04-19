import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import ActionableMessage from '.';

describe('ActionableMessage', () => {
  const createProps = (customProps = {}) => {
    return {
      message: 'I am an actionable message!',
      ...customProps,
    };
  };

  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByText } = renderWithProvider(
      <ActionableMessage {...props} />,
    );
    expect(getByText(props.message)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
