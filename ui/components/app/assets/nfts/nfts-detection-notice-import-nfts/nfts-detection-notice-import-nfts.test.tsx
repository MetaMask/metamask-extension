import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { ASSETS_ROUTE } from '../../../../../helpers/constants/routes';
import { toggleBasicFunctionality } from '../../../../../store/actions';
import NftsDetectionNoticeImportNFTs from './nfts-detection-notice-import-nfts';

jest.mock('../../../../../store/actions', () => ({
  toggleBasicFunctionality: jest.fn((value: boolean) => ({
    type: 'toggleBasicFunctionality',
    value,
  })),
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const createStore = (isBasicFunctionalityConsolidatedEnabled: boolean) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        isBasicFunctionalityConsolidatedEnabled,
      },
    },
  });

describe('NftsDetectionNoticeImportNFTs', () => {
  beforeEach(() => {
    mockUseNavigate.mockClear();
    jest.mocked(toggleBasicFunctionality).mockClear();
  });

  it('points to Display NFT Media in Assets settings when Basic Functionality is not consolidated', () => {
    const onActionButtonClick = jest.fn();
    renderWithProvider(
      <NftsDetectionNoticeImportNFTs
        onActionButtonClick={onActionButtonClick}
      />,
      createStore(false),
    );

    expect(
      screen.getByText(
        messages.newNFTDetectedInImportNFTsMessageStrongText.message,
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByText(
        messages.selectEnableDisplayMediaPrivacyPreference.message,
      ),
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${ASSETS_ROUTE}#display-nft-media`,
    );
    expect(onActionButtonClick).toHaveBeenCalled();
  });

  it('turns Basic Functionality on without leaving the NFT page when it is consolidated', () => {
    const onActionButtonClick = jest.fn();
    const store = createStore(true);
    renderWithProvider(
      <NftsDetectionNoticeImportNFTs
        onActionButtonClick={onActionButtonClick}
      />,
      store,
    );

    fireEvent.click(
      screen.getByText(messages.turnOnBasicFunctionality.message),
    );

    expect(toggleBasicFunctionality).toHaveBeenCalledWith(true);
    expect(store.getActions()).toContainEqual({
      type: 'toggleBasicFunctionality',
      value: true,
    });
    expect(mockUseNavigate).not.toHaveBeenCalled();
    expect(onActionButtonClick).not.toHaveBeenCalled();
  });
});
