import React from 'react';
import { fireEvent } from '@testing-library/react';
import { CaipChainId, Hex } from '@metamask/utils';
import { BoxSpacing } from '@metamask/design-system-react';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../../selectors/selectors.types';
import { PermissionsCell } from './permissions-cell';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('PermissionsCell', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const mockNonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] =
    [
      {
        name: 'Ethereum Mainnet',
        chainId: '0x1' as Hex,
        caipChainId: 'eip155:1' as CaipChainId,
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            type: RpcEndpointType.Custom,
            url: 'https://mainnet.infura.io/v3/test',
          },
        ],
      },
      {
        name: 'Polygon',
        chainId: '0x89' as Hex,
        caipChainId: 'eip155:137' as CaipChainId,
        blockExplorerUrls: ['https://polygonscan.com'],
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        nativeCurrency: 'MATIC',
        rpcEndpoints: [
          {
            networkClientId: 'polygon',
            type: RpcEndpointType.Custom,
            url: 'https://polygon-rpc.com',
          },
        ],
      },
    ];

  const mockTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] =
    [
      {
        name: 'Sepolia',
        chainId: '0xaa36a7' as Hex,
        caipChainId: 'eip155:11155111' as CaipChainId,
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'sepolia',
            type: RpcEndpointType.Custom,
            url: 'https://sepolia.infura.io/v3/test',
          },
        ],
      },
    ];

  const defaultProps = {
    nonTestNetworks: mockNonTestNetworks,
    testNetworks: mockTestNetworks,
    totalCount: 5,
    chainIds: ['0x1', '0x89'],
    paddingTop: 0 as BoxSpacing,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    const { container, getByTestId } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
    const cell = getByTestId('gator-permissions-cell');
    expect(cell).toBeDefined();
  });

  it('renders the PermissionsCellConnectionListItem', () => {
    const { getByTestId } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    const listItem = getByTestId('permissions-cell-connection-list-item');
    expect(listItem).toBeDefined();
  });

  it('displays token transfer information correctly', () => {
    const { getByText } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    expect(getByText('Token transfer')).toBeInTheDocument();
    expect(getByText('5 tokens')).toBeInTheDocument();
  });

  it('displays singular form when count is 1', () => {
    const props = { ...defaultProps, totalCount: 1 };
    const { getByText } = renderWithProvider(
      <PermissionsCell {...props} />,
      store,
    );

    expect(getByText('1 token')).toBeInTheDocument();
  });

  it('navigates to token transfer route when clicked', () => {
    const { getByTestId } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    const listItem = getByTestId('permissions-cell-connection-list-item');
    fireEvent.click(listItem);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      '/gator-permissions/token-transfer',
    );
  });

  it('returns null when totalCount is 0', () => {
    const props = { ...defaultProps, totalCount: 0 };
    const { container } = renderWithProvider(
      <PermissionsCell {...props} />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });
});
