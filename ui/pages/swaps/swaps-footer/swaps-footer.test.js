import React from 'react';

import { renderWithProvider, fireEvent } from '../../../../test/jest';
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
    expect(getByText('Terms of service')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('clicks on a block explorer link', () => {
    global.platform = { openTab: jest.fn() };
    const props = createProps();
    const { getByText } = renderWithProvider(<SwapsFooter {...props} />);
    expect(getByText(props.submitText)).toBeInTheDocument();
    fireEvent.click(getByText('Terms of service'));
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://metamask.io/terms.html',
    });
  });
});
