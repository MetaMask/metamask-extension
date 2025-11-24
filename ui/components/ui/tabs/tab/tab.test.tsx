import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Tab } from './tab';

describe('Tab', () => {
  const defaultProps = {
    name: 'Test Tab',
    tabKey: 'test-tab',
    tabIndex: 0,
    onClick: jest.fn(),
    isActive: false,
  };

  const renderTab = (props = {}) => {
    return render(<Tab {...defaultProps} {...props} />);
  };

  it('renders the tab with name', () => {
    const { getByText } = renderTab();
    expect(getByText('Test Tab')).toBeInTheDocument();
  });

  it('sets aria-selected to true when isActive is true', () => {
    const { getByRole } = renderTab({ isActive: true });
    expect(getByRole('tab')).toHaveAttribute('aria-selected', 'true');
  });

  it('sets aria-selected to false when isActive is false', () => {
    const { getByRole } = renderTab({ isActive: false });
    expect(getByRole('tab')).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onClick with tabIndex when clicked', () => {
    const onClick = jest.fn();
    const { getByRole } = renderTab({ onClick });

    fireEvent.click(getByRole('tab'));

    expect(onClick).toHaveBeenCalledWith(defaultProps.tabIndex);
  });

  it('applies className to the root element', () => {
    const { container } = renderTab({
      className: 'custom-root-class',
    });
    expect(container.firstChild).toHaveClass('custom-root-class');
  });

  it('applies data-testid attribute', () => {
    const { container } = renderTab({
      'data-testid': 'test-tab-id',
    });
    expect(container.firstChild).toHaveAttribute('data-testid', 'test-tab-id');
  });

  it('spreads additional props to root element', () => {
    const { container } = renderTab({
      id: 'test-id',
      role: 'tab',
    });

    expect(container.firstChild).toHaveAttribute('id', 'test-id');
    expect(container.firstChild).toHaveAttribute('role', 'tab');
  });

  it('renders with complex name node', () => {
    const complexName = (
      <div data-testid="complex-name">
        <span>Complex</span>
        <span>Name</span>
      </div>
    );

    const { getByTestId } = renderTab({ name: complexName });
    expect(getByTestId('complex-name')).toBeInTheDocument();
  });

  it('sets aria-disabled to true when disabled is true', () => {
    const { getByRole } = renderTab({ disabled: true });
    expect(getByRole('tab')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not call onClick when disabled and clicked', () => {
    const onClick = jest.fn();
    const { getByRole } = renderTab({ disabled: true, onClick });

    fireEvent.click(getByRole('tab'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies disabled attribute to button when disabled', () => {
    const { getByRole } = renderTab({ disabled: true });
    expect(getByRole('tab')).toHaveAttribute('disabled');
  });
});
