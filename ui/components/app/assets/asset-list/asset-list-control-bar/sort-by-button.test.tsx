import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { AssetControls } from './asset-controls';
import { SortByButton } from './sort-by-button';
import { createMockState } from './control-bar-test-utils';

// Arrow path prefixes from the MMDS Icon glyphs, mirroring the assertions in
// the SelectButton tests of @metamask/design-system-react.
const ARROW_PATH_PREFIX = {
  up: 'M20.03 15.53',
  down: 'm20.03 9.53',
} as const;

const getArrowPath = () =>
  screen
    .getByTestId('sort-by-direction-arrow')
    .querySelector('path')
    ?.getAttribute('d');

const BALANCE_SORT_CONFIG = {
  key: 'tokenFiatAmount',
  sortCallback: 'stringNumeric',
  order: 'dsc' as const,
};

const ALPHABETICAL_SORT_CONFIG = {
  key: 'title',
  sortCallback: 'alphaNumeric',
  order: 'asc' as const,
};

const renderSortByButton = (
  tokenSortConfig:
    | typeof BALANCE_SORT_CONFIG
    | typeof ALPHABETICAL_SORT_CONFIG = BALANCE_SORT_CONFIG,
) => {
  const state = createMockState();
  state.metamask.preferences.tokenSortConfig = tokenSortConfig;
  const store = configureMockStore([thunk])(state);
  return renderWithProvider(
    <AssetControls>
      <SortByButton />
    </AssetControls>,
    store,
  );
};

describe('SortByButton', () => {
  it('labels the button with the sort in force and points the arrow down while descending', async () => {
    const { findByTestId } = renderSortByButton();

    const button = await findByTestId('sort-by-popover-toggle');
    expect(button).toHaveTextContent('Declining balance ($ high-low)');
    expect(getArrowPath()).toContain(ARROW_PATH_PREFIX.down);
  });

  it('labels the button Alphabetically while the alphabetical sort is in force', async () => {
    const { findByTestId } = renderSortByButton(ALPHABETICAL_SORT_CONFIG);

    const button = await findByTestId('sort-by-popover-toggle');
    expect(button).toHaveTextContent('Alphabetically (A-Z)');
  });

  it('names the button with purpose, value and direction while ascending', async () => {
    renderSortByButton(ALPHABETICAL_SORT_CONFIG);

    expect(await screen.findByTestId('sort-by-popover-toggle')).toHaveAttribute(
      'aria-label',
      'Sort by, Alphabetically (A-Z), sorted ascending',
    );
  });

  it('names the button with purpose, value and direction while descending', async () => {
    renderSortByButton();

    expect(await screen.findByTestId('sort-by-popover-toggle')).toHaveAttribute(
      'aria-label',
      'Sort by, Declining balance ($ high-low), sorted descending',
    );
  });

  it('points the trailing arrow up when the order in force is ascending', async () => {
    renderSortByButton(ALPHABETICAL_SORT_CONFIG);

    await screen.findByTestId('sort-by-popover-toggle');
    expect(getArrowPath()).toContain(ARROW_PATH_PREFIX.up);
  });

  it('opens the sort popover when clicked', async () => {
    const { findByTestId } = renderSortByButton();

    fireEvent.click(await findByTestId('sort-by-popover-toggle'));

    expect(
      await screen.findByTestId('sortByAlphabetically__button'),
    ).toHaveTextContent('Alphabetically (A-Z)');
    expect(
      screen.getByTestId('sortByDecliningBalance__button'),
    ).toBeInTheDocument();
  });
});
