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

const renderSortByButton = (order: 'asc' | 'dsc') => {
  const state = createMockState();
  state.metamask.preferences.tokenSortConfig = {
    key: 'tokenFiatAmount',
    sortCallback: 'stringNumeric',
    order,
  };
  const store = configureMockStore([thunk])(state);
  return renderWithProvider(
    <AssetControls>
      <SortByButton />
    </AssetControls>,
    store,
  );
};

describe('SortByButton', () => {
  it('renders the sort button with a visible label and trailing arrow', async () => {
    const { findByTestId } = renderSortByButton('dsc');

    const button = await findByTestId('sort-by-popover-toggle');
    expect(button).toHaveTextContent('Sort by');
    expect(getArrowPath()).toContain(ARROW_PATH_PREFIX.down);
  });

  it('points the trailing arrow up when the order in force is ascending', async () => {
    renderSortByButton('asc');

    await screen.findByTestId('sort-by-popover-toggle');
    expect(getArrowPath()).toContain(ARROW_PATH_PREFIX.up);
  });

  it('opens the sort popover when clicked', async () => {
    const { findByTestId } = renderSortByButton('dsc');

    fireEvent.click(await findByTestId('sort-by-popover-toggle'));

    expect(
      await screen.findByTestId('sortByAlphabetically__button'),
    ).toHaveTextContent('Alphabetically (A-Z)');
    expect(
      screen.getByTestId('sortByDecliningBalance__button'),
    ).toBeInTheDocument();
  });
});
