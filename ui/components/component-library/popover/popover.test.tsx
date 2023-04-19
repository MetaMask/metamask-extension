/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { PopoverHeader } from '../popover-header';
import { Popover } from './popover';
import { PopoverPosition } from './popover.types';

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

  it('should render popover children', () => {
    const { getByText } = render(
      <Popover isOpen={true}>Popover content goes here</Popover>,
    );
    expect(getByText('Popover content goes here')).toBeDefined();
  });

  it('should render popover back button', () => {
    const onBackTest = jest.fn();
    const { getByTestId } = render(
      <Popover data-testid="popover" isOpen={true}>
        <PopoverHeader
          onBack={onBackTest}
          backButtonProps={{ 'data-testid': 'back' }}
        >
          onClose Test
        </PopoverHeader>
      </Popover>,
    );

    const backButton = getByTestId('back');
    fireEvent.click(backButton);

    expect(onBackTest).toHaveBeenCalled();
  });

  it('should render popover close button', () => {
    const onCloseTest = jest.fn();
    const { getByTestId } = render(
      <Popover data-testid="popover" isOpen={true}>
        <PopoverHeader
          onClose={onCloseTest}
          closeButtonProps={{ 'data-testid': 'close' }}
        >
          onClose Test
        </PopoverHeader>
      </Popover>,
    );

    const closeButton = getByTestId('close');
    fireEvent.click(closeButton);

    expect(onCloseTest).toHaveBeenCalled();
  });

  it('should render popover position', () => {
    const { getByText } = render(
      <>
        <Popover
          isOpen={true}
          data-testid={PopoverPosition.Auto}
          position={PopoverPosition.Auto}
        >
          {PopoverPosition.Auto}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.AutoStart}
          position={PopoverPosition.AutoStart}
        >
          {PopoverPosition.AutoStart}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.AutoEnd}
          position={PopoverPosition.AutoEnd}
        >
          {PopoverPosition.AutoEnd}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.Top}
          position={PopoverPosition.Top}
        >
          {PopoverPosition.Top}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.TopStart}
          position={PopoverPosition.TopStart}
        >
          {PopoverPosition.TopStart}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.TopEnd}
          position={PopoverPosition.TopEnd}
        >
          {PopoverPosition.TopEnd}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.Right}
          position={PopoverPosition.Right}
        >
          {PopoverPosition.Right}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.RightStart}
          position={PopoverPosition.RightStart}
        >
          {PopoverPosition.RightStart}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.RightEnd}
          position={PopoverPosition.RightEnd}
        >
          {PopoverPosition.RightEnd}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.Bottom}
          position={PopoverPosition.Bottom}
        >
          {PopoverPosition.Bottom}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.BottomStart}
          position={PopoverPosition.BottomStart}
        >
          {PopoverPosition.BottomStart}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.BottomEnd}
          position={PopoverPosition.BottomEnd}
        >
          {PopoverPosition.BottomEnd}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.Left}
          position={PopoverPosition.Left}
        >
          {PopoverPosition.Left}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.LeftStart}
          position={PopoverPosition.LeftStart}
        >
          {PopoverPosition.LeftStart}
        </Popover>

        <Popover
          isOpen={true}
          data-testid={PopoverPosition.LeftEnd}
          position={PopoverPosition.LeftEnd}
        >
          {PopoverPosition.LeftEnd}
        </Popover>
      </>,
    );

    expect(getByText(PopoverPosition.Auto)).toBeDefined();
    expect(getByText(PopoverPosition.AutoStart)).toBeDefined();
    expect(getByText(PopoverPosition.AutoEnd)).toBeDefined();
    expect(getByText(PopoverPosition.Top)).toBeDefined();
    expect(getByText(PopoverPosition.TopStart)).toBeDefined();
    expect(getByText(PopoverPosition.TopEnd)).toBeDefined();
    expect(getByText(PopoverPosition.Right)).toBeDefined();
    expect(getByText(PopoverPosition.RightStart)).toBeDefined();
    expect(getByText(PopoverPosition.RightEnd)).toBeDefined();
    expect(getByText(PopoverPosition.Bottom)).toBeDefined();
    expect(getByText(PopoverPosition.BottomStart)).toBeDefined();
    expect(getByText(PopoverPosition.BottomEnd)).toBeDefined();
    expect(getByText(PopoverPosition.Left)).toBeDefined();
    expect(getByText(PopoverPosition.LeftStart)).toBeDefined();
    expect(getByText(PopoverPosition.LeftEnd)).toBeDefined();
  });

  it('should render an arrow on popover', () => {
    const { getByTestId } = render(
      <Popover data-testid="popover" isOpen={true} hasArrow>
        Popover
      </Popover>,
    );

    const arrowElement =
      getByTestId('popover').querySelector('.mm-popover__arrow');
    expect(arrowElement).toHaveClass('mm-popover__arrow');
  });
});
