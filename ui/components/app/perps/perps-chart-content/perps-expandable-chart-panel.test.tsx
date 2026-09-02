import React from 'react';
import { render, screen } from '@testing-library/react';

import { PerpsExpandableChartPanel } from './perps-expandable-chart-panel';

describe('PerpsExpandableChartPanel', () => {
  it('keeps the named region and unmounts children when collapsed', () => {
    render(
      <PerpsExpandableChartPanel
        isExpanded={false}
        id="perps-order-entry-chart"
        label="Price chart"
      >
        <div>chart body</div>
      </PerpsExpandableChartPanel>,
    );

    const region = screen.getByTestId('perps-order-entry-chart');
    expect(region).toHaveAttribute('aria-hidden', 'true');
    expect(region).not.toHaveTextContent('chart body');
  });

  it('renders children in the named region when expanded', () => {
    render(
      <PerpsExpandableChartPanel
        isExpanded={true}
        id="perps-order-entry-chart"
        label="Price chart"
      >
        <div>chart body</div>
      </PerpsExpandableChartPanel>,
    );

    const region = screen.getByTestId('perps-order-entry-chart');
    expect(region).toHaveAttribute('role', 'region');
    expect(region).toHaveAttribute('aria-label', 'Price chart');
    expect(region).toHaveAttribute('aria-hidden', 'false');
    expect(region).toHaveTextContent('chart body');
  });
});
