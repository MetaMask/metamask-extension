/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { Popover } from './popover';
import { PopoverPosition } from './popover.types';

describe('Popover', () => {
  it('should render popover element correctly', () => {
    const { getByTestId, getByText, container } = render(
      <Popover data-testid="popover" isOpen={true} isPortal={false}>
        Popover
      </Popover>,
    );
    expect(getByText('Popover')).toBeDefined();
    expect(container.querySelector('popover')).toBeDefined();
    expect(getByTestId('popover')).toHaveClass('mm-popover');
    expect(container).toMatchSnapshot();
  });

  it('should NOT render popover', () => {
    const { queryByTestId } = render(
      <>
        <Popover isOpen={false}>Popover not open</Popover>
      </>,
    );
    expect(queryByTestId('popover')).not.toBeInTheDocument();
  });

  it('should render popover children', () => {
    const { getByText } = render(
      <Popover isOpen={true}>Popover content goes here</Popover>,
    );
    expect(getByText('Popover content goes here')).toBeDefined();
  });

  it('should render popover position', () => {
    const { getByTestId } = render(
      <>
        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.Auto}
          position={PopoverPosition.Auto}
        >
          {PopoverPosition.Auto}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid="top"
          position={PopoverPosition.Top}
        >
          {PopoverPosition.Top}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.TopStart}
          position={PopoverPosition.TopStart}
        >
          {PopoverPosition.TopStart}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.TopEnd}
          position={PopoverPosition.TopEnd}
        >
          {PopoverPosition.TopEnd}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.Right}
          position={PopoverPosition.Right}
        >
          {PopoverPosition.Right}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.RightStart}
          position={PopoverPosition.RightStart}
        >
          {PopoverPosition.RightStart}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.RightEnd}
          position={PopoverPosition.RightEnd}
        >
          {PopoverPosition.RightEnd}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.Bottom}
          position={PopoverPosition.Bottom}
        >
          {PopoverPosition.Bottom}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.BottomStart}
          position={PopoverPosition.BottomStart}
        >
          {PopoverPosition.BottomStart}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.BottomEnd}
          position={PopoverPosition.BottomEnd}
        >
          {PopoverPosition.BottomEnd}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.Left}
          position={PopoverPosition.Left}
        >
          {PopoverPosition.Left}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.LeftStart}
          position={PopoverPosition.LeftStart}
        >
          {PopoverPosition.LeftStart}
        </Popover>

        <Popover
          isOpen={true}
          isPortal={false}
          data-testid={PopoverPosition.LeftEnd}
          position={PopoverPosition.LeftEnd}
        >
          {PopoverPosition.LeftEnd}
        </Popover>
      </>,
    );

    expect(getByTestId(PopoverPosition.Auto)).toBeDefined();
    expect(getByTestId(PopoverPosition.Top)).toBeDefined();
    expect(getByTestId(PopoverPosition.TopStart)).toBeDefined();
    expect(getByTestId(PopoverPosition.TopEnd)).toBeDefined();
    expect(getByTestId(PopoverPosition.Right)).toBeDefined();
    expect(getByTestId(PopoverPosition.RightStart)).toBeDefined();
    expect(getByTestId(PopoverPosition.RightEnd)).toBeDefined();
    expect(getByTestId(PopoverPosition.Bottom)).toBeDefined();
    expect(getByTestId(PopoverPosition.BottomStart)).toBeDefined();
    expect(getByTestId(PopoverPosition.BottomEnd)).toBeDefined();
    expect(getByTestId(PopoverPosition.Left)).toBeDefined();
    expect(getByTestId(PopoverPosition.LeftStart)).toBeDefined();
    expect(getByTestId(PopoverPosition.LeftEnd)).toBeDefined();
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

  test('should render Popover with isPortal set to false', () => {
    const { getByTestId } = render(
      <div>
        <Popover
          data-testid="popover"
          isOpen={true}
          position={PopoverPosition.Bottom}
          isPortal={false}
        >
          <p>Popover content</p>
        </Popover>
      </div>,
    );
    // Check that the Popover is rendered inside the body DOM
    expect(getByTestId('popover')).toBeInTheDocument();
  });

  test('should render Popover with isPortal set to true', () => {
    const { getByTestId } = render(
      <div>
        <Popover data-testid="popover" isOpen={true} isPortal={true}>
          <p>Popover content</p>
        </Popover>
      </div>,
    );

    expect(getByTestId('popover')).toBeTruthy();
  });

  test('should add reference-hidden classname when referenceHidden prop is true', () => {
    const { getByTestId } = render(
      <div>
        <Popover data-testid="popover" isOpen={true} referenceHidden={true}>
          <p>Popover content</p>
        </Popover>
      </div>,
    );

    expect(getByTestId('popover')).toHaveClass('mm-popover--reference-hidden');
  });

  const EscKeyTestComponent = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <Popover
        isOpen={isOpen}
        referenceHidden={false}
        onPressEscKey={() => setIsOpen(false)}
      >
        Press esc key to close
      </Popover>
    );
  };

  test('Press esc key to close fires', () => {
    // Render the component
    const { getByText, queryByText } = render(<EscKeyTestComponent />);

    // Assert that the popover is initially visible
    expect(getByText('Press esc key to close')).toBeVisible();

    // Trigger the "Escape" key press event
    fireEvent.keyDown(document, { key: 'Escape' });

    // Assert that the popover closes
    expect(queryByText('Press esc key to close')).not.toBeInTheDocument();
  });

  const ClickOutsideTestComponent = () => {
    const [isOpen, setIsOpen] = useState(true);

    const handleOnClickOutside = () => {
      setIsOpen(false);
    };

    return (
      <div>
        <Popover
          isOpen={isOpen}
          referenceHidden={false}
          onClickOutside={handleOnClickOutside}
        >
          Click outside to close
        </Popover>
        <div data-testid="outside-click-target">Click outside</div>
      </div>
    );
  };

  test('Close popover when clicking outside using onClickOutside prop', () => {
    const { getByText, getByTestId, queryByText } = render(
      <ClickOutsideTestComponent />,
    );

    // Assert that the popover is initially open
    expect(getByText('Click outside to close')).toBeVisible();

    // Simulate a click event outside the popover
    const outsideClickTarget = getByTestId('outside-click-target');
    fireEvent.click(outsideClickTarget);

    // Assert that the popover is closed after the click event
    expect(queryByText('Click outside to close')).not.toBeInTheDocument();
  });
});
