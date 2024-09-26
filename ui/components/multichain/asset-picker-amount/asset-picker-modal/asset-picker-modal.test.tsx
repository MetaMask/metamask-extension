import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { useSelector } from 'react-redux';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useNftsCollections } from '../../../../hooks/useNftsCollections';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-send-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  getCurrentChainId,
  getNativeCurrencyImage,
  getPreferences,
  getSelectedAccountCachedBalance,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
  getTokenList,
} from '../../../../selectors';
import {
  getConversionRate,
  getNativeCurrency,
  getTokens,
  getCurrentCurrency,
} from '../../../../ducks/metamask/metamask';
import { getTopAssets } from '../../../../ducks/swaps/swaps';
import { getRenderableTokenData } from '../../../../hooks/useTokensToSearch';
import * as actions from '../../../../store/actions';
import { AssetPickerModal } from './asset-picker-modal';
import { Asset } from './types';
import AssetList from './AssetList';

jest.mock('./AssetList', () => jest.fn(() => <div>AssetList</div>));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../../../hooks/useNftsCollections', () => ({
  useNftsCollections: jest.fn(),
}));

jest.mock('../../../../hooks/useTokenTracker', () => ({
  useTokenTracker: jest.fn(),
}));

jest.mock('../../../../hooks/useTokensToSearch', () => ({
  getRenderableTokenData: jest.fn(),
}));

describe('AssetPickerModal', () => {
  const useSelectorMock = useSelector as jest.Mock;
  const useI18nContextMock = useI18nContext as jest.Mock;
  const useNftsCollectionsMock = useNftsCollections as jest.Mock;
  const useTokenTrackerMock = useTokenTracker as jest.Mock;
  const mockStore = configureStore([thunk]);
  const store = mockStore(mockState);

  const onAssetChangeMock = jest.fn();
  const onCloseMock = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: onCloseMock,
    asset: {
      balance: '0x0',
      details: { address: '0xAddress', decimals: 18, symbol: 'TOKEN' },
      error: null,
      type: 'TOKEN',
    } as unknown as Asset,
    onAssetChange: onAssetChangeMock,
    sendingAssetImage: 'image.png',
    sendingAssetSymbol: 'SYMB',
  };

  beforeEach(() => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCurrentChainId) {
        return '1';
      }
      if (selector === getCurrentCurrency) {
        return 'USD';
      }
      if (selector === getNativeCurrencyImage) {
        return 'native-image.png';
      }
      if (selector === getSelectedAccountCachedBalance) {
        return '1000';
      }
      if (selector === getSelectedInternalAccount) {
        return { address: '0xAddress' };
      }
      if (selector === getShouldHideZeroBalanceTokens) {
        return false;
      }
      if (selector === getTokenExchangeRates) {
        return {};
      }
      if (selector === getTokenList) {
        return { '0xAddress': { ...defaultProps.asset, symbol: 'TOKEN' } };
      }
      if (selector === getConversionRate) {
        return 1;
      }
      if (selector === getNativeCurrency) {
        return 'ETH';
      }
      if (selector === getTokens) {
        return [];
      }
      if (selector === getTopAssets) {
        return [];
      }
      if (selector === getPreferences) {
        return { useNativeCurrencyAsPrimaryCurrency: false };
      }
      return undefined;
    });

    useI18nContextMock.mockReturnValue((key: string) => key);
    useNftsCollectionsMock.mockReturnValue({
      collections: {},
      previouslyOwnedCollection: [],
    });
    useTokenTrackerMock.mockReturnValue({
      tokensWithBalances: [],
    });
    (getRenderableTokenData as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // New tests
  it('renders AssetPickerModal with search input', () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />, store);

    expect(screen.getByTestId('asset-picker-modal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('searchTokens')).toBeInTheDocument();
  });

  it('calls onClose when modal is closed', () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />, store);

    fireEvent.click(screen.getByRole('button', { name: /close/u }));
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('renders no NFTs message when there are no NFTs', () => {
    sinon.stub(actions, 'detectNfts').returns(() => Promise.resolve());
    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        asset={{
          balance: '0x0',
          type: AssetType.NFT,
        }}
        sendingAssetImage={undefined}
        sendingAssetSymbol={undefined}
      />,
      store,
    );

    fireEvent.click(screen.getByText('nfts'));
    expect(screen.getByText('noNFTs')).toBeInTheDocument();
    expect(screen.getByText('learnMoreUpperCase')).toBeInTheDocument();
  });

  it('filters tokens based on search query', () => {
    renderWithProvider(<AssetPickerModal {...defaultProps} />, store);

    fireEvent.change(screen.getByPlaceholderText('searchTokens'), {
      target: { value: 'TO' },
    });

    expect(
      (AssetList as jest.Mock).mock.calls.slice(-1)[0][0].tokenList.length,
    ).toBe(1);

    fireEvent.change(screen.getByPlaceholderText('searchTokens'), {
      target: { value: 'UNAVAILABLE TOKEN' },
    });

    expect((AssetList as jest.Mock).mock.calls[1][0]).not.toEqual(
      expect.objectContaining({
        asset: {
          balance: '0x0',
          details: { address: '0xAddress', decimals: 18, symbol: 'TOKEN' },
          error: null,
          type: 'NATIVE',
        },
      }),
    );
  });

  // Older tests
  it('should render the modal when isOpen is true', () => {
    const { getByText } = renderWithProvider(
      <AssetPickerModal {...defaultProps} />,
      store,
    );

    const modalContent = getByText('sendSelectReceiveAsset');
    expect(modalContent).toBeInTheDocument();
  });

  it('should not render the modal when isOpen is false', () => {
    const { queryByText } = renderWithProvider(
      <AssetPickerModal {...defaultProps} isOpen={false} />,
      store,
    );
    const modalContent = queryByText('sendSelectReceiveAsset');
    expect(modalContent).not.toBeInTheDocument();
  });

  it('should render the modal with the correct title and search placeholder', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <AssetPickerModal {...defaultProps} />,
      store,
    );
    const modalTitle = getByText('sendSelectReceiveAsset');
    const searchPlaceholder = getByPlaceholderText('searchTokens');

    expect(modalTitle).toBeInTheDocument();
    expect(searchPlaceholder).toBeInTheDocument();
  });
});
