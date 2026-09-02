import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { PerpsMarketCategoryPill } from './perps-market-category-pill';

const mockStore = configureStore({ metamask: { ...mockState.metamask } });

const renderPill = (
  category: 'all' | 'crypto' | 'pre-ipo' = 'crypto',
  onPress = jest.fn(),
) => {
  renderWithProvider(
    <PerpsMarketCategoryPill category={category} onPress={onPress} />,
    mockStore,
  );
  return onPress;
};

describe('PerpsMarketCategoryPill', () => {
  it('labels the pill with the shared market filter copy', () => {
    renderPill();

    expect(
      screen.getByTestId('perps-market-categories-pill-crypto'),
    ).toHaveTextContent(messages.perpsFilterCrypto.message);
  });

  it('keys the test id off a category id containing a hyphen', () => {
    renderPill('pre-ipo');

    expect(
      screen.getByTestId('perps-market-categories-pill-pre-ipo'),
    ).toHaveTextContent(messages.perpsFilterPreIpo.message);
  });

  it('reports its own category when pressed', () => {
    const onPress = renderPill('all');

    fireEvent.click(screen.getByTestId('perps-market-categories-pill-all'));

    expect(onPress).toHaveBeenCalledWith('all');
  });

  it('renders a native button so the pill is reachable by keyboard', () => {
    renderPill();

    const pill = screen.getByTestId('perps-market-categories-pill-crypto');

    expect(pill.tagName).toBe('BUTTON');
    expect(pill).not.toBeDisabled();
    expect(pill).not.toHaveAttribute('tabindex', '-1');
  });

  it('does not claim a pressed state, because the pill navigates rather than toggles', () => {
    renderPill();

    expect(
      screen.getByTestId('perps-market-categories-pill-crypto'),
    ).not.toHaveAttribute('aria-pressed');
  });
});
