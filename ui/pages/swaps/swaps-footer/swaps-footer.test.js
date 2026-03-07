import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
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
    expect(getByText(messages.back.message)).toBeInTheDocument();
    expect(getByText(messages.termsOfService.message)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('clicks on a block explorer link', () => {
    global.platform = { openTab: jest.fn() };
    const props = createProps();
    const { getByText } = renderWithProvider(<SwapsFooter {...props} />);
    expect(getByText(props.submitText)).toBeInTheDocument();
    fireEvent.click(getByText(messages.termsOfService.message));
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://metamask.io/terms.html',
    });
  });
});
