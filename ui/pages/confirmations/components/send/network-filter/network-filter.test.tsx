import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getImageForChainId } from '../../../utils/network';
import { useChainNetworkNameAndImageMap } from '../../../hooks/useChainNetworkNameAndImage';
import { useAssetSelectionMetrics } from '../../../hooks/send/metrics/useAssetSelectionMetrics';
import { AssetFilterMethod } from '../../../context/send-metrics';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { ARBITRUM_DISPLAY_NAME } from '../../../../../../shared/constants/network';
import { NetworkFilter } from './network-filter';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));
jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../hooks/send/metrics/useAssetSelectionMetrics');
jest.mock('../../../hooks/useChainNetworkNameAndImage');
jest.mock(
  '../../../../../components/app/assets/asset-list/asset-list-control-bar/home-network-filter-modal',
  () => ({
    NetworkSelectionModal: ({
      isOpen,
      title,
      topItem,
      sections,
    }: {
      isOpen: boolean;
      title: React.ReactNode;
      topItem?: { name: string; onClick: () => void };
      sections: {
        items: { key: string; name: string; onClick: () => void }[];
      }[];
    }) =>
      isOpen ? (
        <div data-testid="shared-network-selection-modal">
          <div data-testid="shared-network-selection-title">{title}</div>
          {topItem ? (
            <button
              data-testid="shared-network-selection-top-item"
              onClick={topItem.onClick}
            >
              {topItem.name}
            </button>
          ) : null}
          {sections.flatMap((section) =>
            section.items.map((item) => (
              <button
                key={item.key}
                data-testid="shared-network-selection-item"
                onClick={item.onClick}
              >
                {item.name}
              </button>
            )),
          )}
        </div>
      ) : null,
  }),
);
jest.mock('../../../../../components/component-library', () => ({
  Box: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="box">{children}</div>
  ),
  ButtonBase: ({
    children,
    onClick,
    startIconName,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    startIconName?: string;
  }) => (
    <button data-testid="send-network-filter-toggle" onClick={onClick}>
      {startIconName ? <div data-testid={`icon-${startIconName}`} /> : null}
      {children}
    </button>
  ),
  ButtonIcon: ({
    onClick,
    iconName,
    ariaLabel,
  }: {
    onClick: () => void;
    iconName: string;
    ariaLabel: string;
  }) => (
    <button
      data-testid="close-recipient-modal-btn"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <div data-testid={`icon-${iconName}`} />
    </button>
  ),
  Modal: ({
    children,
    isOpen,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
  }) => (isOpen ? <div data-testid="modal">{children}</div> : null),
  ModalOverlay: () => <div data-testid="modal-overlay" />,
  ModalContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-content">{children}</div>
  ),
  ModalHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-header">{children}</div>
  ),
  ModalBody: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-body">{children}</div>
  ),
  Text: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="text">{children}</span>
  ),
  Icon: ({ name }: { name: string }) => <div data-testid={`icon-${name}`} />,
  AvatarNetwork: ({ name, src }: { name: string; src: string }) => (
    <div data-testid="avatar-network" data-name={name} data-src={src} />
  ),
  ButtonBaseSize: { Md: 'md', Sm: 'sm' },
  ButtonIconSize: { Sm: 'sm' },
  ModalContentSize: { Md: 'md' },
  IconName: {
    ArrowDown: 'arrow-down',
    Filter: 'filter',
    Global: 'global',
    Close: 'close',
  },
  IconSize: { Sm: 'sm', Md: 'md', Xl: 'xl' },
  AvatarNetworkSize: { Sm: 'sm' },
}));
jest.mock('../../../../../components/multichain', () => ({
  NetworkListItem: ({
    name,
    onClick,
    selected,
    iconSrc,
  }: {
    name: string;
    onClick: () => void;
    selected: boolean;
    iconSrc: string;
  }) => (
    <button
      data-testid="network-list-item"
      data-name={name}
      data-selected={selected}
      data-icon={iconSrc}
      onClick={onClick}
    >
      {name}
    </button>
  ),
}));
jest.mock('../../../utils/network');

describe('NetworkFilter', () => {
  const mockUseSelector = jest.mocked(useSelector);
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockGetImageForChainId = jest.mocked(getImageForChainId);
  const mockOnChainIdChange = jest.fn();
  const mockUseAssetSelectionMetrics = jest.mocked(useAssetSelectionMetrics);
  const mockUseChainNetworkNameAndImageMap = jest.mocked(
    useChainNetworkNameAndImageMap,
  );
  const mockAddAssetFilterMethod = jest.fn();
  const mockRemoveAssetFilterMethod = jest.fn();

  const mockTokens = [
    { chainId: '1', fiat: { balance: 100 } },
    { chainId: '137', fiat: { balance: 50 } },
    { chainId: '42161', fiat: { balance: 75 } },
  ];

  const mockNfts = [{ chainId: '1' }, { chainId: '137' }];

  beforeEach(() => {
    mockUseSelector.mockReturnValue(true);
    mockUseI18nContext.mockReturnValue(
      (key: string) =>
        (messages as Record<string, { message: string } | undefined>)[key]
          ?.message ?? key,
    );
    mockGetImageForChainId.mockReturnValue('mock-image-url');
    mockUseAssetSelectionMetrics.mockReturnValue({
      addAssetFilterMethod: mockAddAssetFilterMethod,
      removeAssetFilterMethod: mockRemoveAssetFilterMethod,
    } as unknown as ReturnType<typeof useAssetSelectionMetrics>);
    mockUseChainNetworkNameAndImageMap.mockReturnValue(
      new Map([
        [
          '1',
          {
            networkName: messages.networkNameEthereum.message,
            networkImage: 'eth.svg',
          },
        ],
        [
          '137',
          {
            networkName: messages.networkNamePolygon.message,
            networkImage: 'polygon.svg',
          },
        ],
        [
          '42161',
          {
            networkName: ARBITRUM_DISPLAY_NAME,
            networkImage: 'arbitrum.svg',
          },
        ],
      ]),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter button with the all networks label by default', () => {
    const { getByTestId, getByText } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    expect(getByTestId('send-network-filter-toggle')).toBeInTheDocument();
    expect(getByText(messages.allNetworks.message)).toBeInTheDocument();
    expect(getByTestId('icon-filter')).toBeInTheDocument();
  });

  it('renders filter button with selected network name', () => {
    const { getByTestId, getByText } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        selectedChainId="1"
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    expect(getByTestId('send-network-filter-toggle')).toBeInTheDocument();
    expect(getByText(messages.networkNameEthereum.message)).toBeInTheDocument();
    expect(getByTestId('icon-filter')).toBeInTheDocument();
  });

  it('opens modal when filter button is clicked', () => {
    const { getByTestId, queryByTestId } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    expect(queryByTestId('modal')).not.toBeInTheDocument();

    fireEvent.click(getByTestId('send-network-filter-toggle'));

    expect(getByTestId('shared-network-selection-modal')).toBeInTheDocument();
    expect(getByTestId('shared-network-selection-title')).toBeInTheDocument();
  });

  it('renders network list items in modal', () => {
    const { getByTestId, getAllByTestId } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    fireEvent.click(getByTestId('send-network-filter-toggle'));

    const networkItems = getAllByTestId('shared-network-selection-item');
    expect(networkItems).toHaveLength(3);
    expect(networkItems[0]).toHaveTextContent(
      messages.networkNameEthereum.message,
    );
    expect(networkItems[1]).toHaveTextContent(ARBITRUM_DISPLAY_NAME);
    expect(networkItems[2]).toHaveTextContent(
      messages.networkNamePolygon.message,
    );
    expect(getByTestId('shared-network-selection-top-item')).toHaveTextContent(
      messages.allNetworks.message,
    );
  });

  it('calls onChainIdChange when network is selected', () => {
    const { getByTestId, getAllByTestId } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    fireEvent.click(getByTestId('send-network-filter-toggle'));
    const networkItems = getAllByTestId('shared-network-selection-item');

    fireEvent.click(networkItems[0]);

    expect(mockOnChainIdChange).toHaveBeenCalledWith('1');
  });

  it('calls onChainIdChange with null when the all networks option is selected', () => {
    const { getByTestId, getAllByTestId } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        selectedChainId="1"
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    fireEvent.click(getByTestId('send-network-filter-toggle'));
    fireEvent.click(getByTestId('shared-network-selection-top-item'));

    expect(mockOnChainIdChange).toHaveBeenCalledWith(null);
  });

  it('sorts networks by total token fiat balance descending', () => {
    const { getByTestId, getAllByTestId } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    fireEvent.click(getByTestId('send-network-filter-toggle'));
    const networkItems = getAllByTestId('shared-network-selection-item');

    expect(networkItems[0]).toHaveTextContent(
      messages.networkNameEthereum.message,
    );
    expect(networkItems[1]).toHaveTextContent(ARBITRUM_DISPLAY_NAME);
    expect(networkItems[2]).toHaveTextContent(
      messages.networkNamePolygon.message,
    );
  });

  describe('metrics', () => {
    it('calls addAssetFilterMethod when network is changed', () => {
      const { getByTestId, getAllByTestId } = render(
        <NetworkFilter
          tokens={mockTokens}
          nfts={mockNfts}
          selectedChainId="1"
          onChainIdChange={mockOnChainIdChange}
        />,
      );

      fireEvent.click(getByTestId('send-network-filter-toggle'));
      fireEvent.click(getByTestId('shared-network-selection-top-item'));

      expect(mockRemoveAssetFilterMethod).toHaveBeenCalledWith(
        AssetFilterMethod.Network,
      );
    });
  });
});
