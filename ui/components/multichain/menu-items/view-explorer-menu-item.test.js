import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ViewExplorerMenuItem } from '.';

const render = () => {
  const store = configureStore(mockState);
  return renderWithProvider(
    <ViewExplorerMenuItem
      metricsLocation="Global Menu"
      closeMenu={jest.fn()}
      address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
    />,
    store,
  );
};

describe('ViewExplorerMenuItem', () => {
  it('renders "View on explorer"', () => {
    global.platform = { openTab: jest.fn() };

    const { getByText, getByTestId } = render();
    expect(getByText('View on explorer')).toBeInTheDocument();

    const openExplorerTabSpy = jest.spyOn(global.platform, 'openTab');
    fireEvent.click(getByTestId('account-list-menu-open-explorer'));
    expect(openExplorerTabSpy).toHaveBeenCalled();
  });
});
