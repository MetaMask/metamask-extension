/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { Popover } from './popover';
import { PopoverPosition } from './popover.constants';

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
});
