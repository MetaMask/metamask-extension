import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useAssetSelectionMetrics } from '../../../hooks/send/metrics/useAssetSelectionMetrics';
import { useTokenAssetSecurityResults } from '../../../../../hooks/token-asset/useTokenAssetSecurityResults';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { AssetList } from './asset-list';

const mockUpdateAsset = jest.fn();

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../components/component-library/box/box', () => ({
  Box: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="box">{children}</div>
  ),
}));
jest.mock('../../../../../components/component-library/button/button', () => ({
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
}));

jest.mock(
  '../../../../../components/component-library/button/button.types',
  () => ({ ButtonVariant: { Link: 'link' }, ButtonSize: { Sm: 'sm' } }),
);

jest.mock('../../../../../components/component-library/text/text', () => ({
  Text: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="text">{children}</span>
  ),
}));

jest.mock('../../UI/asset/asset', () => ({
  Asset: ({
    asset,
    onClick,
    safetyResult,
  }: {
    asset: { address?: string; chainId?: string; tokenId?: string };
    onClick: () => void;
    safetyResult?: string;
  }) => (
    <button
      data-testid="asset-component"
      data-address={asset.address}
      data-chain-id={asset.chainId}
      data-token-id={asset.tokenId}
      data-safety-result={safetyResult}
      onClick={onClick}
    >
      Asset
    </button>
  ),
}));
jest.mock(
  '../../../../../hooks/token-asset/useTokenAssetSecurityResults',
  () => ({
    useTokenAssetSecurityResults: jest.fn(() => ({})),
  }),
);
jest.mock('../../../hooks/send/useNavigateSendPage');
jest.mock('../../../context/send', () => {
  const ReactActual = jest.requireActual('react');
  return {
    SendContext: ReactActual.createContext({
      updateAsset: (...args: unknown[]) => mockUpdateAsset(...args),
      fromAccount: {},
      from: '',
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateValue: jest.fn(),
      updateHexData: jest.fn(),
      updateNonEVMSubmitError: jest.fn(),
      updateToResolved: jest.fn(),
    }),
    useSendContext: jest.fn(),
  };
});
jest.mock('../../../hooks/send/metrics/useAssetSelectionMetrics');

function mockVirtualizerDOM() {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    value: 800,
  });
}

describe('AssetList', () => {
  const mockUseNavigateSendPage = jest.mocked(useNavigateSendPage);
  const mockUseAssetSelectionMetrics = jest.mocked(useAssetSelectionMetrics);
  const mockGoToAmountRecipientPage = jest.fn();
  const mockOnClearFilters = jest.fn();
  const mockCaptureAssetSelected = jest.fn();

  const mockTokens = [
    { address: '0x123', chainId: '1', name: 'Token 1' },
    { address: '0x456', chainId: '1', name: 'Token 2' },
  ];

  const mockNfts = [
    { address: '0x789', chainId: '1', tokenId: '1', name: 'NFT 1' },
  ];

  beforeEach(() => {
    mockVirtualizerDOM();
    mockUseNavigateSendPage.mockReturnValue({
      goToAmountRecipientPage: mockGoToAmountRecipientPage,
      goToPreviousPage: jest.fn(),
    });
    mockUseAssetSelectionMetrics.mockReturnValue({
      captureAssetSelected: mockCaptureAssetSelected,
    } as unknown as ReturnType<typeof useAssetSelectionMetrics>);
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
    expect(getByText(messages.nfts.message)).toBeInTheDocument();
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
    expect(queryByText(messages.nfts.message)).not.toBeInTheDocument();
  });

  it('renders custom emptyStateMessage when filters hide all assets', () => {
    const { getByText } = render(
      <AssetList
        tokens={[]}
        nfts={[]}
        allTokens={mockTokens}
        allNfts={mockNfts}
        emptyStateMessage={messages.noTokensMatchSearch.message}
      />,
    );

    expect(getByText(messages.noTokensMatchSearch.message)).toBeInTheDocument();
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
    expect(mockCaptureAssetSelected).toHaveBeenCalledWith(mockTokens[0]);
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

  it('renders emptyStateMessage when no assets available', () => {
    const { getByText } = render(
      <AssetList
        tokens={[]}
        nfts={[]}
        allTokens={[]}
        allNfts={[]}
        emptyStateMessage={messages.rampsNoTokensAvailable.message}
      />,
    );

    expect(
      getByText(messages.rampsNoTokensAvailable.message),
    ).toBeInTheDocument();
  });

  it('does not select disabled assets', () => {
    const mockOnAssetSelect = jest.fn();
    const disabledToken = {
      address: '0xabc',
      chainId: '1',
      name: 'Disabled',
      disabled: true,
    };

    const { getAllByTestId } = render(
      <AssetList
        tokens={[disabledToken]}
        nfts={[]}
        allTokens={[disabledToken]}
        allNfts={[]}
        onAssetSelect={mockOnAssetSelect}
      />,
    );

    fireEvent.click(getAllByTestId('asset-component')[0]);

    expect(mockOnAssetSelect).not.toHaveBeenCalled();
  });

  describe('hideNfts', () => {
    it('hides NFTs section when hideNfts is true', () => {
      const { getAllByTestId, queryByText } = render(
        <AssetList
          tokens={mockTokens}
          nfts={mockNfts}
          allTokens={mockTokens}
          allNfts={mockNfts}
          hideNfts={true}
        />,
      );

      const assetComponents = getAllByTestId('asset-component');
      expect(assetComponents).toHaveLength(2);
      expect(queryByText(messages.nfts.message)).not.toBeInTheDocument();
    });

    it('shows NFTs section when hideNfts is false', () => {
      const { getAllByTestId, getByText } = render(
        <AssetList
          tokens={mockTokens}
          nfts={mockNfts}
          allTokens={mockTokens}
          allNfts={mockNfts}
          hideNfts={false}
        />,
      );

      const assetComponents = getAllByTestId('asset-component');
      expect(assetComponents).toHaveLength(3);
      expect(getByText(messages.nfts.message)).toBeInTheDocument();
    });

    it('renders empty when hideNfts is true and only NFTs exist', () => {
      const { container } = render(
        <AssetList
          tokens={[]}
          nfts={mockNfts}
          allTokens={[]}
          allNfts={mockNfts}
          hideNfts={true}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('does not show no results message when hideNfts excludes all assets', () => {
      const { queryByText } = render(
        <AssetList
          tokens={[]}
          nfts={mockNfts}
          allTokens={[]}
          allNfts={mockNfts}
          hideNfts={true}
        />,
      );

      expect(
        queryByText('noTokensMatchingYourFilters'),
      ).not.toBeInTheDocument();
    });
  });

  describe('onAssetSelect', () => {
    it('calls only onAssetSelect when provided', () => {
      const mockOnAssetSelect = jest.fn();
      const { getAllByTestId } = render(
        <AssetList
          tokens={mockTokens}
          nfts={[]}
          allTokens={mockTokens}
          allNfts={[]}
          onAssetSelect={mockOnAssetSelect}
        />,
      );

      const assetComponents = getAllByTestId('asset-component');
      fireEvent.click(assetComponents[0]);

      expect(mockOnAssetSelect).toHaveBeenCalledWith(mockTokens[0]);
      expect(mockUpdateAsset).not.toHaveBeenCalled();
      expect(mockGoToAmountRecipientPage).not.toHaveBeenCalled();
      expect(mockCaptureAssetSelected).not.toHaveBeenCalled();
    });

    it('calls onAssetSelect when using default SendContext outside a provider', () => {
      const mockOnAssetSelect = jest.fn();
      const sendContext = (
        jest.requireMock('../../../context/send') as Record<
          string,
          React.Context<{
            updateAsset: (...args: unknown[]) => void;
          }>
        >
      ).SendContext;
      const localUpdateAsset = jest.fn();

      const { getAllByTestId } = render(
        React.createElement(
          sendContext.Provider,
          {
            value: {
              updateAsset: localUpdateAsset,
            },
          },
          <AssetList
            tokens={mockTokens}
            nfts={[]}
            allTokens={mockTokens}
            allNfts={[]}
            onAssetSelect={mockOnAssetSelect}
          />,
        ),
      );

      fireEvent.click(getAllByTestId('asset-component')[0]);

      expect(mockOnAssetSelect).toHaveBeenCalledWith(mockTokens[0]);
      expect(mockUpdateAsset).not.toHaveBeenCalled();
      expect(localUpdateAsset).not.toHaveBeenCalled();
      expect(mockGoToAmountRecipientPage).not.toHaveBeenCalled();
    });

    it('calls default handlers when onAssetSelect is not provided', () => {
      const { getAllByTestId } = render(
        <AssetList
          tokens={mockTokens}
          nfts={[]}
          allTokens={mockTokens}
          allNfts={[]}
        />,
      );

      const assetComponents = getAllByTestId('asset-component');
      fireEvent.click(assetComponents[0]);

      expect(mockUpdateAsset).toHaveBeenCalledWith(mockTokens[0]);
      expect(mockGoToAmountRecipientPage).toHaveBeenCalled();
      expect(mockCaptureAssetSelected).toHaveBeenCalledWith(mockTokens[0]);
    });
  });

  describe('security trust signals', () => {
    const mockUseTokenAssetSecurityResults = jest.mocked(
      useTokenAssetSecurityResults,
    );
    const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const usdcAssetId =
      'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const tokens = [{ address: usdcAddress, chainId: '0x1', name: 'USDC' }];

    beforeEach(() => {
      mockUseTokenAssetSecurityResults.mockReturnValue({});
    });

    it('looks up security results using normalised caip asset ids', () => {
      render(
        <AssetList tokens={tokens} nfts={[]} allTokens={tokens} allNfts={[]} />,
      );

      expect(mockUseTokenAssetSecurityResults).toHaveBeenCalledWith({
        assetIds: [usdcAssetId],
      });
    });

    it('passes the matching security result to the token row', () => {
      mockUseTokenAssetSecurityResults.mockReturnValue({
        [usdcAssetId]: 'Malicious',
      });

      const { getByTestId } = render(
        <AssetList tokens={tokens} nfts={[]} allTokens={tokens} allNfts={[]} />,
      );

      expect(getByTestId('asset-component')).toHaveAttribute(
        'data-safety-result',
        'Malicious',
      );
    });

    it('leaves the security result unset for tokens without a result', () => {
      const { getByTestId } = render(
        <AssetList tokens={tokens} nfts={[]} allTokens={tokens} allNfts={[]} />,
      );

      expect(getByTestId('asset-component')).not.toHaveAttribute(
        'data-safety-result',
      );
    });

    it('skips tokens whose chain id is not a hex or caip chain id', () => {
      render(
        <AssetList
          tokens={mockTokens}
          nfts={[]}
          allTokens={mockTokens}
          allNfts={[]}
        />,
      );

      expect(mockUseTokenAssetSecurityResults).toHaveBeenCalledWith({
        assetIds: [],
      });
    });
  });
});
