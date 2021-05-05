import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import SwapsFooter from '.';

const createProps = (customProps = {}) => {
  return {
    onCancel: jest.fn(),
    onSubmit: jest.fn(),
    submitText: 'submitText',
    disabled: false,
    showTermsOfService: true,
    ...customProps,
  };
};

describe('SwapsFooter', () => {
  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByText } = renderWithProvider(
      <SwapsFooter {...props} />,
    );
    expect(getByText(props.submitText)).toBeInTheDocument();
    expect(getByText('Back')).toBeInTheDocument();
    expect(getByText('Terms of Service')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
