/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { PopoverHeader } from './popover-header';

describe('PopoverHeader', () => {
  it('should render PopoverHeader correctly', () => {
    const { getByTestId, container } = render(
      <PopoverHeader data-testid="popover-header">
        Popover Header
      </PopoverHeader>,
    );
    expect(getByTestId('popover-header')).toHaveClass('mm-popover-header');
    expect(container).toMatchSnapshot();
  });

  it('should render popover header title', () => {
    const { getByText } = render(
      <PopoverHeader data-testid="popover-header">
        Popover Header Test
      </PopoverHeader>,
    );
    expect(getByText('Popover Header Test')).toBeDefined();
  });

  it('should render popover header back button', () => {
    const onBackTest = jest.fn();
    const { getByTestId } = render(
      <PopoverHeader
        data-testid="popover"
        onBack={onBackTest}
        backButtonProps={{ 'data-testid': 'back' }}
      >
        Popover
      </PopoverHeader>,
    );

    const backButton = getByTestId('back');
    fireEvent.click(backButton);

    expect(onBackTest).toHaveBeenCalled();
  });

  it('should render popover header close button', () => {
    const onCloseTest = jest.fn();
    const { getByTestId } = render(
      <PopoverHeader
        data-testid="popover"
        onClose={onCloseTest}
        closeButtonProps={{ 'data-testid': 'close' }}
      >
        Popover
      </PopoverHeader>,
    );

    const closeButton = getByTestId('close');
    fireEvent.click(closeButton);

    expect(onCloseTest).toHaveBeenCalled();
  });
});
