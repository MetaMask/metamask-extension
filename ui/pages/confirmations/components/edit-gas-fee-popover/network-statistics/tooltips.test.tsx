import React from 'react';
import { render } from '@testing-library/react';

import { NetworkStabilityTooltip } from './tooltips';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext:
    () =>
    (key: string, substitutions: React.ReactNode[] = []) => {
      const dictionary: Record<string, React.ReactNode> = {
        networkStatusStabilityFeeTooltip: (
          <>Gas fees are {substitutions[0]} relative to the past 72 hours.</>
        ),
        stableLowercase: 'stable',
        lowLowercase: 'low',
        highLowercase: 'high',
      };

      return dictionary[key] ?? key;
    },
}));

jest.mock('../../../../../components/ui/box', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../../../../../components/ui/tooltip', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    children,
    html,
    title,
  }: {
    children: React.ReactNode;
    html?: React.ReactNode;
    title?: string;
  }) => (
    <div>
      {title ? <div data-testid="tooltip-title">{title}</div> : null}
      <div data-testid="tooltip-html">{html}</div>
      <div data-testid="tooltip-children">{children}</div>
    </div>
  ),
}));

describe('NetworkStabilityTooltip', () => {
  it('renders stable tooltip label without special styling', () => {
    const { container, getByTestId } = render(
      <NetworkStabilityTooltip color="#ff0000" tooltipLabel="stableLowercase">
        <div>child</div>
      </NetworkStabilityTooltip>,
    );

    expect(getByTestId('tooltip-html')).toHaveTextContent(
      'Gas fees are stable relative to the past 72 hours.',
    );
    expect(container.querySelector('strong')).not.toBeInTheDocument();
  });

  it('renders non-stable tooltip label with color styling', () => {
    const { container, getByTestId } = render(
      <NetworkStabilityTooltip color="#ff0000" tooltipLabel="highLowercase">
        <div>child</div>
      </NetworkStabilityTooltip>,
    );

    expect(getByTestId('tooltip-html')).toHaveTextContent(
      'Gas fees are high relative to the past 72 hours.',
    );
    const label = container.querySelector('strong');
    expect(label).toBeInTheDocument();
    expect(label).toHaveStyle('color: #ff0000');
  });
});
