import React from 'react';
import { act, render, fireEvent } from '@testing-library/react';
import {
  ButtonIconSize,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../../../components/component-library';
import { InfoPopoverTooltip } from './info-popover-tooltip';

describe('InfoPopoverTooltip', () => {
  it('renders the info button', () => {
    const { getByRole } = render(
      <InfoPopoverTooltip data-testid="test-tooltip">
        <span>Content</span>
      </InfoPopoverTooltip>,
    );

    expect(getByRole('button', { name: 'info' })).toBeInTheDocument();
  });

  it('opens the popover when the info button is clicked', () => {
    const { getByTestId } = render(
      <InfoPopoverTooltip data-testid="test-tooltip">
        <span>Tooltip content</span>
      </InfoPopoverTooltip>,
    );

    fireEvent.click(getByTestId('test-tooltip-button'));

    expect(getByTestId('test-tooltip')).toBeInTheDocument();
    expect(getByTestId('test-tooltip')).toHaveTextContent('Tooltip content');
    expect(getByTestId('test-tooltip')).toHaveStyle({ maxWidth: '250px' });
  });

  it('closes the popover when clicking outside', () => {
    const { getByTestId } = render(
      <InfoPopoverTooltip data-testid="test-tooltip">
        <span>Tooltip content</span>
      </InfoPopoverTooltip>,
    );

    fireEvent.click(getByTestId('test-tooltip-button'));
    expect(getByTestId('test-tooltip')).toBeInTheDocument();

    fireEvent.click(document.body);
  });

  it('toggles popover on repeated clicks', () => {
    const { getByTestId } = render(
      <InfoPopoverTooltip data-testid="test-tooltip">
        <span>Content</span>
      </InfoPopoverTooltip>,
    );

    const button = getByTestId('test-tooltip-button');

    fireEvent.click(button);
    expect(getByTestId('test-tooltip')).toBeInTheDocument();

    fireEvent.click(button);
  });

  it('accepts custom position, iconSize, and iconColor', () => {
    const { getByTestId } = render(
      <InfoPopoverTooltip
        data-testid="custom-tooltip"
        position={PopoverPosition.BottomStart}
        iconSize={ButtonIconSize.Sm}
        iconColor={IconColor.IconAlternative}
      >
        <span>Custom content</span>
      </InfoPopoverTooltip>,
    );

    expect(getByTestId('custom-tooltip-button')).toBeInTheDocument();
  });

  it('accepts a custom iconName', () => {
    const { getByTestId } = render(
      <InfoPopoverTooltip
        data-testid="question-tooltip"
        iconName={IconName.Question}
      >
        <span>Question content</span>
      </InfoPopoverTooltip>,
    );

    const button = getByTestId('question-tooltip-button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(getByTestId('question-tooltip')).toHaveTextContent(
      'Question content',
    );
  });

  it('renders a plain icon with the correct icon name when plainIcon is true', async () => {
    const { getByTestId, getByRole } = render(
      <InfoPopoverTooltip
        data-testid="plain-tooltip"
        iconName={IconName.Question}
        iconColor={IconColor.IconAlternative}
        plainIcon
        ariaLabel="bonus info"
      >
        <span>Plain icon content</span>
      </InfoPopoverTooltip>,
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
});
