import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { useSelector } from 'react-redux';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import { RpcEndpointType } from '@metamask/network-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useNftsCollections } from '../../../../hooks/useNftsCollections';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-send-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  getCurrentCurrency,
  getNativeCurrencyImage,
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
} from '../../../../ducks/metamask/metamask';
import { getTopAssets } from '../../../../ducks/swaps/swaps';
import { getRenderableTokenData } from '../../../../hooks/useTokensToSearch';
import * as actions from '../../../../store/actions';
import { getSwapsBlockedTokens } from '../../../../ducks/send';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import { AssetPickerModal } from './asset-picker-modal';
import AssetList from './AssetList';
import { ERC20Asset } from './types';

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
    header: 'sendSelectReceiveAsset',
    onNetworkPickerClick: jest.fn(),
    isOpen: true,
    onClose: onCloseMock,
    asset: {
      address: '0xAddress',
      symbol: 'TOKEN',
      image: 'image.png',
      type: AssetType.token,
    } as ERC20Asset,
    onAssetChange: onAssetChangeMock,
    sendingAsset: {
      image: 'image.png',
      symbol: 'SYMB',
    },
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
        return {
          '0xAddress': { ...defaultProps.asset, symbol: 'TOKEN' },
          '0xtoken1': {
            address: '0xToken1',
            symbol: 'TOKEN1',
            type: AssetType.token,
            image: 'image1.png',
            string: '10',
            decimals: 18,
            balance: '0',
          },
        };
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

      if (selector === getSwapsBlockedTokens) {
        return new Set(['0xtoken1']);
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
          type: AssetType.NFT,
          tokenId: 5,
          image: 'nft image',
        }}
        sendingAsset={undefined}
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
    ).toBe(2);

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

  it('should disable the token if it is in the blocked tokens list', () => {
    renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        sendingAsset={{ image: '', symbol: 'IRRELEVANT' }}
      />,
      store,
    );

    fireEvent.change(screen.getByPlaceholderText('searchTokens'), {
      target: { value: 'TO' },
    });

    expect(
      (AssetList as jest.Mock).mock.calls.slice(-1)[0][0].tokenList.length,
    ).toBe(2);

    fireEvent.change(screen.getByPlaceholderText('searchTokens'), {
      target: { value: 'TOKEN1' },
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

    expect(
      (AssetList as jest.Mock).mock.calls.slice(-1)[0][0].tokenList.length,
    ).toBe(1);

    expect(
      (AssetList as jest.Mock).mock.calls[2][0].isTokenDisabled({
        address: '0xtoken1',
      }),
    ).toBe(true);
  });

  it('should render network picker when onNetworkPickerClick prop is defined', () => {
    const { getByText, getAllByRole } = renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        header="selectNetworkHeader"
        network={{
          nativeCurrency: 'ETH',
          chainId: '0x1',
          defaultBlockExplorerUrlIndex: 0,
          blockExplorerUrls: ['https://explorerurl'],
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'test1',
              url: 'https://rpcurl',
              type: RpcEndpointType.Custom,
            },
          ],
          name: 'Network name',
        }}
      />,
      store,
    );

    const modalTitle = getByText('selectNetworkHeader');
    expect(modalTitle).toBeInTheDocument();

    expect(getAllByRole('img')).toHaveLength(2);
    const modalContent = getByText('Network name');
    expect(modalContent).toBeInTheDocument();
  });

  it('should not render network picker when onNetworkPickerClick prop is not defined', () => {
    const { getByText, getAllByRole } = renderWithProvider(
      <AssetPickerModal
        {...defaultProps}
        onNetworkPickerClick={undefined}
        header="selectNetworkHeader"
        network={{
          nativeCurrency: 'ETH',
          chainId: '0x1',
          defaultBlockExplorerUrlIndex: 0,
          blockExplorerUrls: ['https://explorerurl'],
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'test1',
              url: 'https://rpcurl',
              type: RpcEndpointType.Custom,
            },
          ],
          name: 'Network name',
        }}
      />,
      store,
    );

    const modalTitle = getByText('selectNetworkHeader');
    expect(modalTitle).toBeInTheDocument();

    expect(getAllByRole('img')).toHaveLength(1);
  });
});
