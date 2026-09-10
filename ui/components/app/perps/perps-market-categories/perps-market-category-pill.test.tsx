import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { IconName } from '@metamask/design-system-react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import {
  PerpsCategoryPillVariant,
  PerpsMarketCategoryPill,
} from './perps-market-category-pill';

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

  it('renders a leading glyph only for a surface that asks for one', () => {
    const { unmount } = renderWithProvider(
      <PerpsMarketCategoryPill
        category="crypto"
        onPress={jest.fn()}
        iconName={IconName.Ethereum}
      />,
      mockStore,
    );

    expect(
      screen
        .getByTestId('perps-market-categories-pill-crypto')
        .querySelector('svg'),
    ).toBeInTheDocument();

    unmount();
    renderPill();

    // The market list's own rail renders bare pills.
    expect(
      screen
        .getByTestId('perps-market-categories-pill-crypto')
        .querySelector('svg'),
    ).not.toBeInTheDocument();
  });

  it('renders the market list filter shape by default', () => {
    // Figma 12602:45702: a 32px, 8px-radius button, not a full lozenge.
    renderPill();

    const pill = screen.getByTestId('perps-market-categories-pill-crypto');

    expect(pill).toHaveClass('rounded-lg');
    expect(pill).not.toHaveClass('rounded-full');
  });

  it('renders the Products chip shape when asked for it', () => {
    // Figma 13192:28387: a 40px fully-rounded chip carrying a leading glyph.
    renderWithProvider(
      <PerpsMarketCategoryPill
        category="crypto"
        onPress={jest.fn()}
        iconName={IconName.Ethereum}
        variant={PerpsCategoryPillVariant.Chip}
      />,
      mockStore,
    );

    const pill = screen.getByTestId('perps-market-categories-pill-crypto');

    expect(pill).toHaveClass('rounded-full');
    expect(pill).not.toHaveClass('rounded-lg');
  });

  it('renders a clear glyph on the active pill', () => {
    // `Icon` renders nothing when its name resolves to undefined, which would
    // silently drop the only control that clears the filter. Asserted on its
    // own so a missing glyph fails here rather than in a colour assertion.
    renderWithProvider(
      <PerpsMarketCategoryPill
        category="crypto"
        onPress={jest.fn()}
        onClear={jest.fn()}
        isActive
      />,
      mockStore,
    );

    expect(
      screen
        .getByTestId('perps-market-categories-pill-crypto')
        .querySelector('svg'),
    ).toBeInTheDocument();
  });

  it('contrasts both glyphs against the active pill fill', () => {
    // ButtonFilter fills the active pill with `bg-icon-default`, so a glyph
    // left on the default `icon-default` colour is invisible on it.
    renderWithProvider(
      <PerpsMarketCategoryPill
        category="crypto"
        onPress={jest.fn()}
        onClear={jest.fn()}
        iconName={IconName.Ethereum}
        isActive
      />,
      mockStore,
    );

    const glyphs = screen
      .getByTestId('perps-market-categories-pill-crypto')
      .querySelectorAll('svg');

    expect(glyphs).toHaveLength(2);
    for (const glyph of glyphs) {
      expect(glyph).toHaveClass('text-icon-inverse');
      expect(glyph).not.toHaveClass('text-icon-default');
    }
  });

  it('clears the filter instead of reselecting when it is already active', () => {
    const onPress = jest.fn();
    const onClear = jest.fn();
    renderWithProvider(
      <PerpsMarketCategoryPill
        category="crypto"
        onPress={onPress}
        onClear={onClear}
        isActive
      />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-market-categories-pill-crypto'));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
