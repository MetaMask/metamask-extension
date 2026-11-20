import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { DottedTriggerTooltip } from './dotted-trigger-tooltip';

const store = configureStore(mockState);

describe('DottedTriggerTooltip', () => {
  it('opens and closes the popover on hover, focus, and click', async () => {
    renderWithProvider(
      <DottedTriggerTooltip data-testid="sample-tooltip" text="$1.23">
        <span>Fee breakdown</span>
      </DottedTriggerTooltip>,
      store,
    );

    const trigger = screen.getByTestId('sample-tooltip-trigger');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveTextContent('$1.23');
    expect(trigger).toHaveClass('underline', 'decoration-dotted');

    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });
    const popover = screen.getByTestId('sample-tooltip');
    expect(popover).toHaveTextContent('Fee breakdown');
    expect(trigger).toHaveAttribute('aria-describedby', popover.id);

    await act(async () => {
      fireEvent.mouseLeave(trigger);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('sample-tooltip')).not.toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.focus(trigger);
    });
    expect(screen.getByTestId('sample-tooltip')).toHaveTextContent(
      'Fee breakdown',
    );

    await act(async () => {
      fireEvent.blur(trigger);
    });
    expect(screen.queryByTestId('sample-tooltip')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.getByTestId('sample-tooltip')).toHaveTextContent(
      'Fee breakdown',
    );
  });

  it('stays open when clicked after mouseEnter and focus', async () => {
    renderWithProvider(
      <DottedTriggerTooltip data-testid="click-after-hover" text="$1.23">
        <span>Fee breakdown</span>
      </DottedTriggerTooltip>,
      store,
    );

    const trigger = screen.getByTestId('click-after-hover-trigger');

    await act(async () => {
      fireEvent.mouseEnter(trigger);
      fireEvent.focus(trigger);
      fireEvent.click(trigger);
    });

    expect(screen.getByTestId('click-after-hover')).toHaveTextContent(
      'Fee breakdown',
    );
  });

  it('stays open when moving the pointer from the trigger onto the popover', async () => {
    renderWithProvider(
      <DottedTriggerTooltip data-testid="hover-bridge-tooltip" text="$1.23">
        <span>Fee breakdown</span>
      </DottedTriggerTooltip>,
      store,
    );

    const trigger = screen.getByTestId('hover-bridge-tooltip-trigger');

    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });
    const popover = screen.getByTestId('hover-bridge-tooltip');

    await act(async () => {
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(popover);
    });

    expect(screen.getByTestId('hover-bridge-tooltip')).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseLeave(popover);
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId('hover-bridge-tooltip'),
      ).not.toBeInTheDocument();
    });
  });
});
