import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Tab from './tab.component';

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

  it('applies active class when isActive is true', () => {
    const { container } = renderTab({ isActive: true });
    expect(container.firstChild).toHaveClass('tab--active');
  });

  it('applies custom activeClassName when provided and active', () => {
    const { container } = renderTab({
      isActive: true,
      activeClassName: 'custom-active',
    });
    expect(container.firstChild).toHaveClass('custom-active');
  });

  it('calls onClick with tabIndex when clicked', () => {
    const onClick = jest.fn();
    const { getByRole } = renderTab({ onClick });

    fireEvent.click(getByRole('button'));

    expect(onClick).toHaveBeenCalledWith(defaultProps.tabIndex);
  });

  it('applies buttonClassName to the button element', () => {
    const { getByRole } = renderTab({
      buttonClassName: 'custom-button-class',
    });
    expect(getByRole('button')).toHaveClass('custom-button-class');
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

  it('spreads textProps to Text component', () => {
    const { getByRole } = renderTab({
      textProps: {
        'data-testid': 'text-component',
        className: 'custom-text-class',
      },
    });

    const textElement = getByRole('button');
    expect(textElement).toHaveAttribute('data-testid', 'text-component');
    expect(textElement).toHaveClass('custom-text-class');
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

  it('applies disabled class when disabled is true', () => {
    const { container } = renderTab({ disabled: true });
    expect(container.firstChild).toHaveClass('tab--disabled');
  });

  it('does not call onClick when disabled and clicked', () => {
    const onClick = jest.fn();
    const { getByRole } = renderTab({ disabled: true, onClick });

    fireEvent.click(getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies disabled attribute to button when disabled', () => {
    const { getByRole } = renderTab({ disabled: true });
    expect(getByRole('button')).toHaveAttribute('disabled');
  });
});
