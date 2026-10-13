import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import {
  ASSETS_ROUTE,
  PRIVACY_ROUTE,
} from '../../../../../helpers/constants/routes';
import NftsDetectionNoticeImportNFTs from './nfts-detection-notice-import-nfts';

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

  it('points to Basic Functionality in Privacy settings when Basic Functionality is consolidated', () => {
    const onActionButtonClick = jest.fn();
    renderWithProvider(
      <NftsDetectionNoticeImportNFTs
        onActionButtonClick={onActionButtonClick}
      />,
      createStore(true),
    );

    expect(
      screen.getByText(
        messages.newNFTDetectedInImportNFTsBasicFunctionalityStrongText.message,
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByText(messages.turnOnBasicFunctionality.message),
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${PRIVACY_ROUTE}#basic-functionality`,
    );
    expect(onActionButtonClick).toHaveBeenCalled();
  });
});
