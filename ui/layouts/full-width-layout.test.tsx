import React from 'react';
import { render } from '@testing-library/react';
import { Outlet } from 'react-router-dom';
import { FullWidthLayout } from './full-width-layout';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Outlet: jest.fn(() => <div data-testid="outlet" />),
  };
});

describe('FullWidthLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<FullWidthLayout />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the Outlet', () => {
    const { getByTestId } = render(<FullWidthLayout />);
    expect(getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders a full-width container', () => {
    const { container } = render(<FullWidthLayout />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('w-full');
    expect(div.className).toContain('h-full');
  });

  it('calls Outlet once', () => {
    render(<FullWidthLayout />);
    expect(Outlet).toHaveBeenCalledTimes(1);
  });
});
