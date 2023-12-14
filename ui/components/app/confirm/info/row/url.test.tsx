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

  it('should render the URL correctly', () => {
    const { getByText } = render(
      <ConfirmInfoRowUrl url="https://www.example.com" />,
    );
    expect(getByText('www.example.com')).toBeInTheDocument();
  });

  it('should render the URL correctly when it includes a path', () => {
    const { getByText } = render(
      <ConfirmInfoRowUrl url="https://www.example.com/foo" />,
    );
    expect(getByText('www.example.com/foo')).toBeInTheDocument();
  });

  it('should render the URL, protocol, and warning icon when the protocol is "http"', () => {
    const { container, getByText } = render(
      <ConfirmInfoRowUrl url="http://www.example.com/" />,
    );
    expect(getByText('www.example.com')).toBeInTheDocument();
    expect(getByText('HTTP')).toBeInTheDocument();
    expect(container.querySelector('.mm-icon')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
