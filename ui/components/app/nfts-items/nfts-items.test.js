import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { updateCollectibleDropDownState } from '../../../store/actions';
import CollectiblesItems from '.';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ search: '' })),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  updateCollectibleDropDownState: jest.fn().mockReturnValue(jest.fn()),
}));

describe('Collectibles Item Component', () => {
  const collectibles =
    mockState.metamask.allNftContracts[mockState.metamask.selectedAddress][5];
  const props = {
    collections: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        collectibles,
        collectionImage: '',
        collectionName: 'Collectible Collection',
      },
    },
    previouslyOwnedCollection: {
      collectibles: [],
    },
  };

  const mockStore = configureMockStore([thunk])(mockState);

  it('should expand collectible collection showing individual collectibles', async () => {
    const { queryByTestId, queryAllByTestId, rerender } = renderWithProvider(
      <CollectiblesItems {...props} />,
      mockStore,
    );

    const collectionExpanderButton = queryByTestId(
      'collection-expander-button',
    );

    expect(queryAllByTestId('collectible-wrapper')).toHaveLength(0);

    fireEvent.click(collectionExpanderButton);

    expect(updateCollectibleDropDownState).toHaveBeenCalledWith({
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x5': {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': true,
          '0x495f947276749Ce646f68AC8c248420045cb7b5e': false,
        },
      },
    });

    rerender(<CollectiblesItems {...props} />, mockStore);

    expect(queryAllByTestId('collectible-wrapper')).toHaveLength(8);
  });

  it('should collectible click image', () => {
    const { queryAllByTestId } = renderWithProvider(
      <CollectiblesItems {...props} />,
      mockStore,
    );

    const collectibleImages = queryAllByTestId('collectible-image');

    fireEvent.click(collectibleImages[0]);

    const firstCollectible = collectibles[0];
    const collectibleRoute = `/asset/${firstCollectible.address}/${firstCollectible.tokenId}`;

    expect(mockHistoryPush).toHaveBeenCalledWith(collectibleRoute);
  });
});
