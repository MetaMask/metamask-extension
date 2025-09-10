import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { InternalAccount } from '@metamask/keyring-internal-api';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useSendContext } from '../../../context/send';
import { AssetList } from './asset-list';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../../../components/component-library', () => ({
  Box: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  Text: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="text">{children}</span>
  ),
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick: () => void;
    [key: string]: unknown;
  }) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  ButtonVariant: { Link: 'link' },
  ButtonSize: { Sm: 'sm' },
}));
jest.mock('../../UI/asset', () => ({
  Asset: ({
    asset,
    onClick,
  }: {
    asset: { address?: string; chainId?: string; tokenId?: string };
    onClick: () => void;
  }) => (
    <button
      data-testid="asset-component"
      data-address={asset.address}
      data-chain-id={asset.chainId}
      data-token-id={asset.tokenId}
      onClick={onClick}
    >
      Asset
    </button>
  ),
}));
jest.mock('../../../hooks/send/useNavigateSendPage');
jest.mock('../../../context/send');

describe('AssetList', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockUseNavigateSendPage = jest.mocked(useNavigateSendPage);
  const mockUseSendContext = jest.mocked(useSendContext);
  const mockGoToAmountRecipientPage = jest.fn();
  const mockUpdateAsset = jest.fn();
  const mockOnClearFilters = jest.fn();

  const mockTokens = [
    { address: '0x123', chainId: '1', name: 'Token 1' },
    { address: '0x456', chainId: '1', name: 'Token 2' },
  ];

  const mockNfts = [
    { address: '0x789', chainId: '1', tokenId: '1', name: 'NFT 1' },
  ];

  beforeEach(() => {
    mockUseI18nContext.mockReturnValue((key: string) => key);
    mockUseNavigateSendPage.mockReturnValue({
      goToAmountRecipientPage: mockGoToAmountRecipientPage,
      goToPreviousPage: jest.fn(),
    });
    mockUseSendContext.mockReturnValue({
      updateAsset: mockUpdateAsset,
      fromAccount: {} as InternalAccount,
      from: '' as string,
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateValue: jest.fn(),
    } as unknown as ReturnType<typeof useSendContext>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders tokens and nfts when available', () => {
    const { getAllByTestId, getByText } = render(
      <AssetList
        tokens={mockTokens}
        nfts={mockNfts}
        allTokens={mockTokens}
        allNfts={mockNfts}
        onClearFilters={mockOnClearFilters}
      />,
    );

    const assetComponents = getAllByTestId('asset-component');
    expect(assetComponents).toHaveLength(3);
    expect(getByText('NFTs')).toBeInTheDocument();
  });

  it('renders only tokens when no nfts', () => {
    const { getAllByTestId, queryByText } = render(
      <AssetList
        tokens={mockTokens}
        nfts={[]}
        allTokens={mockTokens}
        allNfts={[]}
        onClearFilters={mockOnClearFilters}
      />,
    );

    const assetComponents = getAllByTestId('asset-component');
    expect(assetComponents).toHaveLength(2);
    expect(queryByText('NFTs')).not.toBeInTheDocument();
  });

  it('renders no results message when no filtered assets but has all assets', () => {
    const { getByText, getByTestId } = render(
      <AssetList
        tokens={[]}
        nfts={[]}
        allTokens={mockTokens}
        allNfts={mockNfts}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(getByText('noTokensMatchingYourFilters')).toBeInTheDocument();
    expect(getByTestId('clear-filters-button')).toBeInTheDocument();
  });

  it('does not render clear filters button when onClearFilters not provided', () => {
    const { getByText, queryByTestId } = render(
      <AssetList
        tokens={[]}
        nfts={[]}
        allTokens={mockTokens}
        allNfts={mockNfts}
      />,
    );

    expect(getByText('noTokensMatchingYourFilters')).toBeInTheDocument();
    expect(queryByTestId('clear-filters-button')).not.toBeInTheDocument();
  });

  it('calls onClearFilters when clear button is clicked', () => {
    const { getByTestId } = render(
      <AssetList
        tokens={[]}
        nfts={[]}
        allTokens={mockTokens}
        allNfts={mockNfts}
        onClearFilters={mockOnClearFilters}
      />,
    );

    fireEvent.click(getByTestId('clear-filters-button'));

    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('calls updateAsset and navigation when asset is clicked', () => {
    const { getAllByTestId } = render(
      <AssetList
        tokens={mockTokens}
        nfts={[]}
        allTokens={mockTokens}
        allNfts={[]}
        onClearFilters={mockOnClearFilters}
      />,
    );

    const assetComponents = getAllByTestId('asset-component');
    fireEvent.click(assetComponents[0]);

    expect(mockUpdateAsset).toHaveBeenCalledWith(mockTokens[0]);
    expect(mockGoToAmountRecipientPage).toHaveBeenCalled();
  });

  it('renders empty when no assets available', () => {
    const { container } = render(
      <AssetList
        tokens={[]}
        nfts={[]}
        allTokens={[]}
        allNfts={[]}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
