/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, fireEvent } from '@testing-library/react';
import { IconColor, IconName } from '@metamask/design-system-react';
import { PopoverPosition } from '../../../component-library';
import { InfoPopover } from './info-popover';

describe('InfoPopover', () => {
  it('renders the info button', () => {
    const { getByRole } = render(
      <InfoPopover data-testid="test-tooltip">
        <span>Content</span>
      </InfoPopover>,
    );

    expect(getByRole('button', { name: 'info' })).toBeInTheDocument();
  });

  it('opens the popover when the info button is clicked', async () => {
    const { getByTestId } = render(
      <InfoPopover data-testid="test-tooltip">
        <span>Tooltip content</span>
      </InfoPopover>,
    );

    await act(async () => {
      fireEvent.click(getByTestId('test-tooltip-button'));
    });

    expect(getByTestId('test-tooltip')).toBeInTheDocument();
    expect(getByTestId('test-tooltip')).toHaveTextContent('Tooltip content');
    expect(getByTestId('test-tooltip')).toHaveStyle({ maxWidth: '250px' });
  });

  it('closes the popover when clicking outside', async () => {
    const { getByTestId, queryByTestId } = render(
      <InfoPopover data-testid="test-tooltip">
        <span>Tooltip content</span>
      </InfoPopover>,
    );

    await act(async () => {
      fireEvent.click(getByTestId('test-tooltip-button'));
    });
    expect(getByTestId('test-tooltip')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(document.body);
    });

    expect(queryByTestId('test-tooltip')).not.toBeInTheDocument();
  });

  it('toggles popover on repeated clicks', async () => {
    const { getByTestId, queryByTestId } = render(
      <InfoPopover data-testid="test-tooltip">
        <span>Content</span>
      </InfoPopover>,
    );

    const button = getByTestId('test-tooltip-button');

    await act(async () => {
      fireEvent.click(button);
    });
    expect(getByTestId('test-tooltip')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(queryByTestId('test-tooltip')).not.toBeInTheDocument();
  });

  it('accepts custom position and iconColor', () => {
    const { getByTestId } = render(
      <InfoPopover
        data-testid="custom-tooltip"
        position={PopoverPosition.BottomStart}
        iconColor={IconColor.IconAlternative}
      >
        <span>Custom content</span>
      </InfoPopover>,
    );

    expect(getByTestId('custom-tooltip-button')).toBeInTheDocument();
  });

  it('accepts a custom iconName', async () => {
    const { getByTestId } = render(
      <InfoPopover data-testid="question-tooltip" iconName={IconName.Question}>
        <span>Question content</span>
      </InfoPopover>,
    );

    const button = getByTestId('question-tooltip-button');
    expect(button).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(button);
    });
    expect(getByTestId('question-tooltip')).toHaveTextContent(
      'Question content',
    );
  });

  it('renders plain icon with correct aria label', async () => {
    const { getByTestId, getByRole } = render(
      <InfoPopover
        data-testid="plain-tooltip"
        iconName={IconName.Question}
        iconColor={IconColor.IconAlternative}
        ariaLabel="bonus info"
      >
        <span>Plain icon content</span>
      </InfoPopover>,
    );

    const button = getByRole('button', { name: 'bonus info' });
    expect(button).toBeInTheDocument();

    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(getByTestId('plain-tooltip-button'));
    });
    expect(getByTestId('plain-tooltip')).toHaveTextContent(
      'Plain icon content',
    );
  });

  it('closes the popover when Escape is pressed', async () => {
    const { getByTestId, queryByTestId } = render(
      <InfoPopover data-testid="esc-tooltip">
        <span>Esc closes</span>
      </InfoPopover>,
    );

    await act(async () => {
      fireEvent.click(getByTestId('esc-tooltip-button'));
    });
    expect(getByTestId('esc-tooltip')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    });

    expect(queryByTestId('esc-tooltip')).not.toBeInTheDocument();
  });
});
