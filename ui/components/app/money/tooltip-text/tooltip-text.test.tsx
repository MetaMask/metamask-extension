/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, fireEvent } from '@testing-library/react';
import { FontWeight, TextVariant } from '@metamask/design-system-react';
import { PopoverPosition } from '../../../component-library';
import { TooltipText } from './tooltip-text';

const renderTooltipText = (
  props: Partial<React.ComponentProps<typeof TooltipText>> = {},
) =>
  render(
    <TooltipText data-testid="test-tooltip" text="money" {...props}>
      <span>Tooltip content</span>
    </TooltipText>,
  );

describe('TooltipText', () => {
  it('renders the underlined trigger text without the tooltip', () => {
    const { getByTestId, queryByTestId } = renderTooltipText();

    const trigger = getByTestId('test-tooltip-trigger');
    expect(trigger).toHaveTextContent('Money');
    expect(trigger).toHaveClass('underline', 'decoration-dotted');
    expect(queryByTestId('test-tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on hover and hides it on mouse leave', async () => {
    const { getByTestId, queryByTestId } = renderTooltipText();
    const trigger = getByTestId('test-tooltip-trigger');

    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });

    const popover = getByTestId('test-tooltip');
    expect(popover).toHaveTextContent('Tooltip content');
    expect(popover).toHaveStyle({ maxWidth: '250px' });
    expect(popover).toHaveClass(
      'mm-box--background-color-background-elevated2',
    );

    await act(async () => {
      fireEvent.mouseLeave(trigger);
    });

    expect(queryByTestId('test-tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on keyboard focus and hides it on blur', async () => {
    const { getByTestId, queryByTestId } = renderTooltipText();
    const trigger = getByTestId('test-tooltip-trigger');

    expect(trigger).toHaveAttribute('tabindex', '0');

    await act(async () => {
      fireEvent.focus(trigger);
    });
    expect(getByTestId('test-tooltip')).toBeInTheDocument();

    await act(async () => {
      fireEvent.blur(trigger);
    });
    expect(queryByTestId('test-tooltip')).not.toBeInTheDocument();
  });

  it('links the trigger to the tooltip with aria-describedby while open', async () => {
    const { getByTestId } = renderTooltipText();
    const trigger = getByTestId('test-tooltip-trigger');

    expect(trigger).not.toHaveAttribute('aria-describedby');

    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });

    const popover = getByTestId('test-tooltip');
    expect(popover).toHaveAttribute('role', 'tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', popover.id);
  });

  it('closes the tooltip when Escape is pressed', async () => {
    const { getByTestId, queryByTestId } = renderTooltipText();

    await act(async () => {
      fireEvent.mouseEnter(getByTestId('test-tooltip-trigger'));
    });
    expect(getByTestId('test-tooltip')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    });
    expect(queryByTestId('test-tooltip')).not.toBeInTheDocument();
  });

  it('merges popoverStyle over the default panel styles', async () => {
    const { getByTestId } = renderTooltipText({
      position: PopoverPosition.Auto,
      popoverStyle: { maxWidth: 315, paddingTop: '12px' },
    });

    await act(async () => {
      fireEvent.mouseEnter(getByTestId('test-tooltip-trigger'));
    });

    expect(getByTestId('test-tooltip')).toHaveStyle({
      maxWidth: '315px',
      paddingTop: '12px',
      paddingBottom: '6px',
    });
  });

  it('forwards Text props and className to the trigger', () => {
    const { getByTestId } = renderTooltipText({
      variant: TextVariant.BodySm,
      fontWeight: FontWeight.Medium,
      className: 'custom-class',
    });

    const trigger = getByTestId('test-tooltip-trigger');
    expect(trigger.tagName).toBe('SPAN');
    expect(trigger).toHaveClass(
      'text-s-body-sm',
      'font-medium',
      'custom-class',
    );
  });
});
