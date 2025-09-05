import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getImageForChainId } from '../../../utils/network';
import { NetworkFilter } from './network-filter';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../../../../shared/constants/bridge', () => ({
  NETWORK_TO_SHORT_NETWORK_NAME_MAP: {
    '1': 'Ethereum',
    '137': 'Polygon',
    '42161': 'Arbitrum',
  },
}));
jest.mock('../../../../../components/component-library', () => ({
  Box: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  ButtonBase: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }) => (
    <button
      data-testid="send-network-filter-toggle"
      onClick={onClick}
      {...props}
    >
      {children}
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
  ButtonBaseSize: { Md: 'md' },
  ModalContentSize: { Md: 'md' },
  IconName: { ArrowDown: 'arrow-down', Global: 'global' },
  IconSize: { Sm: 'sm', Xl: 'xl' },
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
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockGetImageForChainId = jest.mocked(getImageForChainId);
  const mockOnChainIdChange = jest.fn();

  const mockTokens = [
    { chainId: '1', fiat: { balance: 100 } },
    { chainId: '137', fiat: { balance: 50 } },
    { chainId: '42161', fiat: { balance: 75 } },
  ];

  const mockNfts = [{ chainId: '1' }, { chainId: '137' }];

  beforeEach(() => {
    mockUseI18nContext.mockReturnValue((key: string) => key);
    mockGetImageForChainId.mockReturnValue('mock-image-url');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter button with "All networks" by default', () => {
    const { getByTestId, getByText } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    expect(getByTestId('send-network-filter-toggle')).toBeInTheDocument();
    expect(getByText('All networks')).toBeInTheDocument();
    expect(getByTestId('icon-global')).toBeInTheDocument();
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
    expect(getByText('Ethereum')).toBeInTheDocument();
    expect(getByTestId('avatar-network')).toBeInTheDocument();
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

    expect(getByTestId('modal')).toBeInTheDocument();
    expect(getByTestId('modal-header')).toBeInTheDocument();
    expect(getByTestId('modal-body')).toBeInTheDocument();
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

    const networkItems = getAllByTestId('network-list-item');
    expect(networkItems).toHaveLength(4);
    expect(networkItems[0]).toHaveAttribute('data-name', 'allNetworks');
    expect(networkItems[1]).toHaveAttribute('data-name', 'Ethereum');
    expect(networkItems[2]).toHaveAttribute('data-name', 'Arbitrum');
    expect(networkItems[3]).toHaveAttribute('data-name', 'Polygon');
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
    const networkItems = getAllByTestId('network-list-item');

    fireEvent.click(networkItems[1]);

    expect(mockOnChainIdChange).toHaveBeenCalledWith('1');
  });

  it('calls onChainIdChange with null when "All networks" is selected', () => {
    const { getByTestId, getAllByTestId } = render(
      <NetworkFilter
        tokens={mockTokens}
        nfts={mockNfts}
        selectedChainId="1"
        onChainIdChange={mockOnChainIdChange}
      />,
    );

    fireEvent.click(getByTestId('send-network-filter-toggle'));
    const networkItems = getAllByTestId('network-list-item');

    fireEvent.click(networkItems[0]);

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
    const networkItems = getAllByTestId('network-list-item');

    expect(networkItems[1]).toHaveAttribute('data-name', 'Ethereum');
    expect(networkItems[2]).toHaveAttribute('data-name', 'Arbitrum');
    expect(networkItems[3]).toHaveAttribute('data-name', 'Polygon');
  });
});
