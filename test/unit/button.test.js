import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from '../../ui/components/ui/button';

describe('Button component', () => {
  it('renders text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
