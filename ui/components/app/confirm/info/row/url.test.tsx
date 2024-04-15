import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmInfoRowUrl } from './url';

describe('ConfirmInfoRowUrl', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoRowUrl url={'https://example.com'} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders a URL', () => {
    const { getByText } = render(
      <ConfirmInfoRowUrl url="https://www.example.com" />,
    );
    expect(getByText('https://www.example.com')).toBeInTheDocument();
  });

  it('renders a URL with a path', () => {
    const { getByText } = render(
      <ConfirmInfoRowUrl url="https://www.example.com/foo" />,
    );
    expect(getByText('https://www.example.com/foo')).toBeInTheDocument();
  });

  it('renders a URL, protocol, and warning icon when the protocol is "http"', () => {
    const { container, getByText } = render(
      <ConfirmInfoRowUrl url="http://www.example.com/" />,
    );
    expect(getByText('http://www.example.com/')).toBeInTheDocument();
    expect(getByText('HTTP')).toBeInTheDocument();
    expect(container.querySelector('.mm-icon')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
