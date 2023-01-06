/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Popover } from './popover-header';

describe('Popover', () => {
  it('should render popover element correctly', () => {
    const { getByTestId, getByText, container } = render(
      <Popover data-testid="popover" isOpen={true}>
        Popover
      </Popover>,
    );
    expect(getByText('Popover')).toBeDefined();
    expect(container.querySelector('popover')).toBeDefined();
    expect(getByTestId('popover')).toHaveClass('mm-popover');
    expect(container).toMatchSnapshot();
  });

  it('should render popover title', () => {
    const { getByText } = render(
      <Popover data-testid="popover" title="Popover test" isOpen={true}>
        Popover
      </Popover>,
    );
    expect(getByText('Popover test')).toBeDefined();
    expect(getByText('Popover test')).toHaveClass('mm-popover__header-title');
  });

  it('should render popover back button', () => {
    const onBackTest = jest.fn();
    const { getByTestId } = render(
      <Popover
        data-testid="popover"
        isOpen={true}
        onBack={onBackTest}
        backButtonProps={{ 'data-testid': 'back' }}
      >
        Popover
      </Popover>,
    );

    const backButton = getByTestId('back');
    fireEvent.click(backButton);

    expect(onBackTest).toHaveBeenCalled();
  });

  it('should render popover close button', () => {
    const onCloseTest = jest.fn();
    const { getByTestId } = render(
      <Popover
        data-testid="popover"
        isOpen={true}
        onClose={onCloseTest}
        closeButtonProps={{ 'data-testid': 'close' }}
      >
        Popover
      </Popover>,
    );

    const closeButton = getByTestId('close');
    fireEvent.click(closeButton);

    expect(onCloseTest).toHaveBeenCalled();
  });
});
