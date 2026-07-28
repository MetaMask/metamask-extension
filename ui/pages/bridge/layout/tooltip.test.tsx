import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TextColor } from '../../../helpers/constants/design-system';
import Tooltip from './tooltip';

jest.mock('@metamask/design-system-react', () => ({
  ...jest.requireActual('@metamask/design-system-react'),
  usePureBlack: jest.fn(() => false),
}));

const hoverTooltipTrigger = async (container: HTMLElement) => {
  const trigger = container.querySelector('.flex');
  expect(trigger).toBeTruthy();
  await act(async () => {
    fireEvent.mouseEnter(trigger as Element);
  });
};

describe('Bridge layout Tooltip', () => {
  it('opens on hover and does not force an inverted background color', async () => {
    const { container } = render(
      <Tooltip data-testid="bridge-layout-tooltip">Slippage info</Tooltip>,
    );

    await hoverTooltipTrigger(container);

    const popover = screen.getByTestId('bridge-layout-tooltip');
    expect(popover).toHaveTextContent('Slippage info');
    expect(popover.getAttribute('style') ?? '').not.toContain(
      'var(--color-text-default)',
    );
    expect(popover).toHaveClass('mm-box--background-color-background-default');
  });

  it('does not apply inverse text color to the tooltip body', async () => {
    const { container } = render(
      <Tooltip data-testid="bridge-layout-tooltip" title="Title">
        Body copy
      </Tooltip>,
    );

    await hoverTooltipTrigger(container);

    const body = screen.getByText('Body copy');
    expect(body).not.toHaveClass(`mm-box--color-${TextColor.infoInverse}`);
  });
});
