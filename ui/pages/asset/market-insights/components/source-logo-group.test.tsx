import React from 'react';
import type { MarketInsightsSource } from '@metamask/ai-controllers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  SourceLogoGroup,
  SOURCE_LOGO_GROUP_TEST_ID,
} from './source-logo-group';

const makeSources = (
  count: number,
  overrides: Partial<MarketInsightsSource> = {},
): MarketInsightsSource[] =>
  Array.from({ length: count }, (_, index) => ({
    name: `Source ${index + 1}`,
    type: 'news',
    url: `https://source${index + 1}.com`,
    ...overrides,
  }));

describe('SourceLogoGroup', () => {
  it('renders one logo per source up to the visible maximum', () => {
    const { container } = renderWithProvider(
      <SourceLogoGroup sources={makeSources(5)} />,
    );

    const logos = container.querySelectorAll('img');
    expect(logos).toHaveLength(3);
  });

  it('renders all logos when there are fewer than the visible maximum', () => {
    const { container } = renderWithProvider(
      <SourceLogoGroup sources={makeSources(2)} />,
    );

    expect(container.querySelectorAll('img')).toHaveLength(2);
  });

  it('renders nothing when there are no sources', () => {
    const { queryByTestId, container } = renderWithProvider(
      <SourceLogoGroup sources={[]} />,
    );

    expect(queryByTestId(SOURCE_LOGO_GROUP_TEST_ID)).not.toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('renders the X icon instead of a favicon for X sources', () => {
    const xSources: MarketInsightsSource[] = [
      { name: 'X', type: 'social', url: 'https://x.com/a/status/1' },
    ];

    const { container, getByTestId } = renderWithProvider(
      <SourceLogoGroup sources={xSources} />,
    );

    expect(getByTestId(SOURCE_LOGO_GROUP_TEST_ID)).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
