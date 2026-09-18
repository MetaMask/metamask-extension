/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, fireEvent } from '@testing-library/react';
import {
  FontWeight,
  SensitiveTextLength,
  TextVariant,
} from '@metamask/design-system-react';
import { TooltipText } from './tooltip-text';

const showPopover = jest.fn();
const hidePopover = jest.fn();

const renderTooltipText = (
  props: Partial<React.ComponentProps<typeof TooltipText>> = {},
) =>
  render(
    <TooltipText data-testid="test-tooltip" text="money" {...props}>
      <span>Tooltip content</span>
    </TooltipText>,
  );

const hover = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.mouseEnter(element);
  });
};

const leave = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.mouseLeave(element);
    jest.runAllTimers();
  });
};

describe('TooltipText', () => {
  beforeAll(() => {
    Object.assign(HTMLElement.prototype, { showPopover, hidePopover });
  });

  beforeEach(() => {
    jest.useFakeTimers();
    showPopover.mockClear();
    hidePopover.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a focusable button trigger wired to a hint popover', () => {
    const { getByTestId } = renderTooltipText();

    const trigger = getByTestId('test-tooltip-trigger');
    const popover = getByTestId('test-tooltip');

    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger).toHaveTextContent('money');
    expect(trigger).toHaveClass('underline', 'decoration-dotted');
    expect(trigger).toHaveAttribute('interestfor', popover.id);
    expect(popover).toHaveAttribute('popover', 'hint');
    expect(popover).toHaveTextContent('Tooltip content');
    expect(popover).toHaveStyle({ maxWidth: '250px' });
    expect(showPopover).not.toHaveBeenCalled();
  });

  it('shows the popover on hover and hides it after the pointer leaves', async () => {
    const { getByTestId } = renderTooltipText();
    const trigger = getByTestId('test-tooltip-trigger');

    await hover(trigger);
    expect(showPopover).toHaveBeenCalledTimes(1);

    await leave(trigger);
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it('shows the popover on keyboard focus and hides it on blur', async () => {
    const { getByTestId } = renderTooltipText();
    const trigger = getByTestId('test-tooltip-trigger');

    await act(async () => {
      fireEvent.focus(trigger);
    });
    expect(showPopover).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.blur(trigger);
      jest.runAllTimers();
    });
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it('stays open while the pointer moves from the trigger onto the popover', async () => {
    const { getByTestId } = renderTooltipText();
    const trigger = getByTestId('test-tooltip-trigger');
    const popover = getByTestId('test-tooltip');

    await hover(trigger);
    await act(async () => {
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(popover);
      jest.runAllTimers();
    });
    expect(hidePopover).not.toHaveBeenCalled();

    await leave(popover);
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it('closes the popover when Escape is pressed', async () => {
    const { getByTestId } = renderTooltipText();

    await hover(getByTestId('test-tooltip-trigger'));

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    });
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it('calls onOpen once per open', async () => {
    const onOpen = jest.fn();
    const { getByTestId } = renderTooltipText({ onOpen });
    const trigger = getByTestId('test-tooltip-trigger');

    await hover(trigger);
    await act(async () => {
      fireEvent.focus(trigger);
    });
    expect(onOpen).toHaveBeenCalledTimes(1);

    await leave(trigger);
    await hover(trigger);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('applies the position area for the requested placement', () => {
    const { getByTestId } = renderTooltipText({ position: 'bottom-start' });

    expect(getByTestId('test-tooltip')).toHaveClass(
      '[position-area:bottom_span-right]',
    );
  });

  it('points the arrow at the trigger once the popover has opened', () => {
    const { getByTestId } = renderTooltipText();
    const trigger = getByTestId('test-tooltip-trigger');
    const popover = getByTestId('test-tooltip');
    const mockRect = (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => ({ left, top, width, height, bottom: top + height }) as DOMRect;

    trigger.getBoundingClientRect = () => mockRect(100, 20, 60, 20);
    popover.getBoundingClientRect = () => mockRect(80, 40, 250, 80);
    act(() => {
      popover.dispatchEvent(
        Object.assign(new Event('toggle'), { newState: 'open' }),
      );
    });

    expect(popover).toHaveAttribute('data-placement', 'bottom');
    expect(popover.style.getPropertyValue('--tooltip-arrow-left')).toBe('50px');

    popover.getBoundingClientRect = () => mockRect(80, -60, 250, 80);
    act(() => {
      popover.dispatchEvent(
        Object.assign(new Event('toggle'), { newState: 'open' }),
      );
    });

    expect(popover).toHaveAttribute('data-placement', 'top');
  });

  it('merges popoverStyle over the default panel styles', () => {
    const { getByTestId } = renderTooltipText({
      popoverStyle: { maxWidth: 315, paddingTop: '12px' },
    });

    expect(getByTestId('test-tooltip')).toHaveStyle({
      maxWidth: '315px',
      paddingTop: '12px',
      paddingBottom: '6px',
    });
  });

  it('masks the trigger text with bullets when hidden', () => {
    const { getByTestId } = renderTooltipText({
      isHidden: true,
      length: SensitiveTextLength.Medium,
    });

    expect(getByTestId('test-tooltip-trigger')).toHaveTextContent(
      '•'.repeat(9),
    );
  });

  it('forwards Text props and className to the trigger', () => {
    const { getByTestId } = renderTooltipText({
      variant: TextVariant.BodySm,
      fontWeight: FontWeight.Medium,
      className: 'custom-class',
    });

    expect(getByTestId('test-tooltip-trigger')).toHaveClass(
      'text-s-body-sm',
      'font-medium',
      'custom-class',
    );
  });
});
