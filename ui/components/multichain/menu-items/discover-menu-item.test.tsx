import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { DiscoverMenuItem } from './discover-menu-item';

const render = (closeMenu = jest.fn()) => {
  const defaultState = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
    },
  };
  const store = configureStore(defaultState);
  return {
    ...renderWithProvider(
      <DiscoverMenuItem metricsLocation="Global Menu" closeMenu={closeMenu} />,
      store,
    ),
    closeMenu,
  };
};

describe('DiscoverMenuItem', () => {
  it('renders discover menu item', () => {
    // @ts-expect-error mocking platform
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };

    const { getByTestId } = render();
    expect(getByTestId('portfolio-menu-item')).toBeInTheDocument();
  });

  it('opens portfolio and closes menu on click', () => {
    // @ts-expect-error mocking platform
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };

    const { getByTestId, closeMenu } = render();
    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    fireEvent.click(getByTestId('portfolio-menu-item'));

    expect(openTabSpy).toHaveBeenCalled();
    expect(openTabSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('explore/tokens'),
      }),
    );
    expect(closeMenu).toHaveBeenCalled();
  });
});
