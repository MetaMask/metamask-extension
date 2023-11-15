import React from 'react';
import { render } from '@testing-library/react';
import { Copyable } from './copyable';

describe('Copyable', () => {
  it('renders a copyable component', () => {
    const value = 'foo bar';
    const { getByText } = render(<Copyable text={value} />);

    expect(getByText(value)).toBeInTheDocument();
  });
});
