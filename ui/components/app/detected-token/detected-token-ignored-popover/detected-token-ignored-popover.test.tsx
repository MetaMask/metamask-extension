import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DetectedTokenIgnoredPopover from './detected-token-ignored-popover';

describe('DetectedTokenIgnoredPopover', () => {
  const defaultProps = {
    partiallyIgnoreDetectedTokens: false,
    onCancelIgnore: jest.fn(),
    handleClearTokensSelection: jest.fn(),
    isOpen: true,
  };

  const renderComponent = (props = {}) =>
    render(<DetectedTokenIgnoredPopover {...defaultProps} {...props} />);

  it('should match snapshot for ignore mode', () => {
    const { baseElement } = renderComponent();
    expect(baseElement).toMatchSnapshot();
  });

  it('should match snapshot for import mode', () => {
    const { baseElement } = renderComponent({
      partiallyIgnoreDetectedTokens: true,
    });
    expect(baseElement).toMatchSnapshot();
  });

  it('should call handleClearTokensSelection when the confirm button is clicked', () => {
    renderComponent();
    const confirmButton = screen.getByTestId(
      'detected-token-ignored-popover-confirm-button',
    );
    fireEvent.click(confirmButton);
    expect(defaultProps.handleClearTokensSelection).toHaveBeenCalled();
    expect(defaultProps.handleClearTokensSelection).not.toThrow();
  });
});
