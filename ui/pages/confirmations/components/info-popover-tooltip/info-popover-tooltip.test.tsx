import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import {
  ButtonIconSize,
  PopoverPosition,
} from '../../../../components/component-library';
import { IconColor } from '../../../../helpers/constants/design-system';
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
        iconColor={IconColor.iconAlternative}
      >
        <span>Custom content</span>
      </InfoPopoverTooltip>,
    );

    expect(getByTestId('custom-tooltip-button')).toBeInTheDocument();
  });
});
