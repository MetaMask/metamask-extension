import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { selectAssetsHaveLoadedForSelectedAccountGroup } from '../../../../selectors/assets';
import { getSelectedAccountGroup } from '../../../../selectors/multichain-accounts/account-tree';
import {
  AssetsHaveLoadedProvider,
  useAssetsHaveLoaded,
} from './useAssetsHaveLoaded';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const Probe = () => {
  const assetsHaveLoaded = useAssetsHaveLoaded();

  return <div data-testid="assets-have-loaded">{String(assetsHaveLoaded)}</div>;
};

describe('AssetsHaveLoadedProvider', () => {
  it('keeps an account group settled during later background refreshes', () => {
    let selectedAccountGroup = 'entropy:wallet/group-1';
    let currentLoadHasSettled = false;

    jest.mocked(useSelector).mockImplementation((selector) => {
      if (selector === getSelectedAccountGroup) {
        return selectedAccountGroup;
      }
      if (selector === selectAssetsHaveLoadedForSelectedAccountGroup) {
        return currentLoadHasSettled;
      }
      return undefined;
    });

    const view = render(
      <AssetsHaveLoadedProvider>
        <Probe />
      </AssetsHaveLoadedProvider>,
    );

    expect(screen.getByTestId('assets-have-loaded')).toHaveTextContent('false');

    currentLoadHasSettled = true;
    view.rerender(
      <AssetsHaveLoadedProvider>
        <Probe />
      </AssetsHaveLoadedProvider>,
    );
    expect(screen.getByTestId('assets-have-loaded')).toHaveTextContent('true');

    currentLoadHasSettled = false;
    view.rerender(
      <AssetsHaveLoadedProvider>
        <Probe />
      </AssetsHaveLoadedProvider>,
    );
    expect(screen.getByTestId('assets-have-loaded')).toHaveTextContent('true');

    selectedAccountGroup = 'entropy:wallet/group-2';
    view.rerender(
      <AssetsHaveLoadedProvider>
        <Probe />
      </AssetsHaveLoadedProvider>,
    );
    expect(screen.getByTestId('assets-have-loaded')).toHaveTextContent('false');
  });
});
