import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, fireEvent } from '@testing-library/react';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-send-state.json';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';
import { AssetPickerModalNetwork } from './asset-picker-modal-network';

const mockOnClose = jest.fn();
const mockOnNetworkChange = jest.fn();
const mockOnBack = jest.fn();

describe('AssetPickerModalNetwork', () => {
  const mockStore = configureStore([thunk]);
  const store = mockStore(mockState);

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onBack: mockOnBack,
    network: undefined,
    networks: [],
    onNetworkChange: mockOnNetworkChange,
  };

  const networkProps = {
    network: {
      chainId: '0x1',
      nativeCurrency: 'ETH',
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
      name: 'network',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    networks: [
      {
        chainId: '0x1',
        nativeCurrency: 'ETH',
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
        name: 'Network name 3',
      },
      {
        chainId: '0xa',
        nativeCurrency: 'ETH',
        defaultBlockExplorerUrlIndex: 0,
        blockExplorerUrls: ['https://explorerurl'],
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          {
            networkClientId: 'test2',
            url: 'https://rpcurl',
            type: RpcEndpointType.Custom,
          },
        ],
        name: 'Network name 4',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with no network list by default', () => {
    const { baseElement } = renderWithProvider(
      <AssetPickerModalNetwork {...defaultProps} />,
      store,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should not show selected network when network prop is not passed in', () => {
    const { baseElement } = renderWithProvider(
      <AssetPickerModalNetwork
        {...defaultProps}
        networks={networkProps.networks}
      />,
      store,
    );
    expect(baseElement).toMatchSnapshot();
  });

  it('should use passed in network as default when network prop is passed in', () => {
    const { baseElement } = renderWithProvider(
      <AssetPickerModalNetwork {...defaultProps} {...networkProps} />,
      store,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should call onClose and onBack when header buttons are clicked', () => {
    renderWithProvider(
      <AssetPickerModalNetwork {...defaultProps} {...networkProps} />,
      store,
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should call onBack and onClickHandler when network is selected', () => {
    renderWithProvider(
      <AssetPickerModalNetwork {...defaultProps} {...networkProps} />,
      store,
    );

    fireEvent.click(screen.getByText(NETWORK_TO_NAME_MAP['0x1']));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
    expect(mockOnNetworkChange).toHaveBeenCalledTimes(1);
  });
});
