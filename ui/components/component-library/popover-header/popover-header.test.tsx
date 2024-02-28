/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { IconName } from '..';
import { PopoverHeader } from './popover-header';

describe('PopoverHeader', () => {
  it('should render PopoverHeader correctly', () => {
    const { getByTestId, container } = render(
      <PopoverHeader data-testid="popover-header">PopoverHeader</PopoverHeader>,
    );
    expect(getByTestId('popover-header')).toHaveClass('mm-popover-header');
    expect(container).toMatchSnapshot();
  });

  it('should render popover header children as a string', () => {
    const { getByText } = render(
      <PopoverHeader data-testid="popover-header">
        PopoverHeader test
      </PopoverHeader>,
    );
    expect(getByText('PopoverHeader test')).toBeDefined();
  });

  it('should render popover header children as a node', () => {
    const { getByText, getByTestId } = render(
      <PopoverHeader data-testid="popover-header">
        <div data-testid="div">PopoverHeader test</div>
      </PopoverHeader>,
    );
    expect(getByText('PopoverHeader test')).toBeDefined();
    expect(getByTestId('div')).toBeDefined();
  });

  it('should render popover header back button', () => {
    const onBackTest = jest.fn();
    const { getByTestId } = render(
      <PopoverHeader
        onBack={onBackTest}
        backButtonProps={{
          'data-testid': 'back',
          ariaLabel: '',
          iconName: IconName.Close,
        }}
      >
        PopoverHeader
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
        onClose={onCloseTest}
        closeButtonProps={{
          'data-testid': 'close',
          ariaLabel: '',
          iconName: IconName.Close,
        }}
      >
        PopoverHeader
      </PopoverHeader>,
    );

    const closeButton = getByTestId('close');
    fireEvent.click(closeButton);

    expect(onCloseTest).toHaveBeenCalled();
  });
});
