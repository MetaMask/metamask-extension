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

const mockToastSuccess = jest.fn();

jest.mock('../../../../../store/actions', () => ({
  toggleBasicFunctionality: jest.fn((value: boolean) => ({
    type: 'toggleBasicFunctionality',
    value,
  })),
}));

jest.mock('../../../../ui/toast/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
  ToastContent: ({ title }: { title: React.ReactNode }) => title,
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const createStore = (
  isBasicFunctionalityConsolidatedEnabled: boolean,
  useExternalServices = false,
) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      useExternalServices,
      preferences: {
        ...mockState.metamask.preferences,
        isBasicFunctionalityConsolidatedEnabled,
      },
    },
  });

describe('NftsDetectionNoticeImportNFTs', () => {
  beforeEach(() => {
    mockUseNavigate.mockClear();
    mockToastSuccess.mockClear();
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

    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(
      screen.getByRole('button', {
        name: messages.turnOnBasicFunctionality.message,
      }),
    );

    expect(toggleBasicFunctionality).toHaveBeenCalledWith(true);
    expect(store.getActions()).toContainEqual({
      type: 'toggleBasicFunctionality',
      value: true,
    });
    const enabledToast = mockToastSuccess.mock
      .calls[0][0] as React.ReactElement<{
      title: string;
    }>;
    expect(enabledToast.props.title).toBe(
      messages.basicFunctionalityIsOn.message,
    );
    expect(mockUseNavigate).not.toHaveBeenCalled();
    expect(onActionButtonClick).not.toHaveBeenCalled();
  });

  it('shows a success toast without changing Basic Functionality when it is already on', () => {
    const onActionButtonClick = jest.fn();
    const store = createStore(true, true);
    renderWithProvider(
      <NftsDetectionNoticeImportNFTs
        onActionButtonClick={onActionButtonClick}
      />,
      store,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.turnOnBasicFunctionality.message,
      }),
    );

    const alreadyOnToast = mockToastSuccess.mock
      .calls[0][0] as React.ReactElement<{
      title: string;
    }>;
    expect(alreadyOnToast.props.title).toBe(
      messages.basicFunctionalityIsOn.message,
    );
    expect(toggleBasicFunctionality).not.toHaveBeenCalled();
    expect(mockUseNavigate).not.toHaveBeenCalled();
    expect(onActionButtonClick).not.toHaveBeenCalled();
  });
});
