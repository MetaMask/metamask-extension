import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { NetworkConfiguration } from '@metamask/network-controller';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import {
  updateNetwork,
  setActiveNetwork,
  setEditedNetwork,
  toggleNetworkMenu,
} from '../../../../store/actions';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import { stripProtocol } from '../rpc-list-item';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { SelectRpcUrlModal } from './select-rpc-url-modal';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockOnNetworkChange = jest.fn();

jest.mock('../../../../store/actions', () => ({
  updateNetwork: jest.fn(),
  setActiveNetwork: jest.fn(),
  setEditedNetwork: jest.fn(),
  toggleNetworkMenu: jest.fn(),
}));

const mockStore = configureMockStore();
const networkConfiguration = {
  chainId: '0x1',
  name: 'Ethereum Mainnet',
  rpcEndpoints: [
    { url: 'https://mainnet.infura.io/v3/', networkClientId: 'mainnet' },
    { url: 'https://rpc.flashbots.net/', networkClientId: 'flashbots' },
  ],
  defaultRpcEndpointIndex: 0,
} as unknown as NetworkConfiguration;

const mockAccount = createMockInternalAccount();

const store = mockStore({
  metamask: {
    networks: [networkConfiguration],
    activeNetwork: '0x1',
    internalAccounts: {
      accounts: {
        [mockAccount.id]: mockAccount,
      },
      selectedAccount: mockAccount.id,
    },
    networkConfigurationsByChainId: {
      '0x1': networkConfiguration,
    },
  },
});

describe('SelectRpcUrlModal Component', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('renders select rpc url', () => {
    const { container } = renderWithProvider(
      <SelectRpcUrlModal
        networkConfiguration={networkConfiguration}
        onNetworkChange={mockOnNetworkChange}
      />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render the component correctly with network image and name', () => {
    const { getByRole, getByText } = renderWithProvider(
      <SelectRpcUrlModal
        networkConfiguration={networkConfiguration}
        onNetworkChange={mockOnNetworkChange}
      />,
      store,
    );

    const imageSrc =
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        networkConfiguration.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ];

    const networkImage = getByRole('img');

    expect(networkImage).toBeInTheDocument();
    expect(networkImage).toHaveAttribute('src', imageSrc);
    expect(getByText(networkConfiguration.name)).toBeInTheDocument();
  });

  it('should render all RPC endpoints and highlight the selected one', () => {
    const { getByText } = renderWithProvider(
      <SelectRpcUrlModal
        networkConfiguration={networkConfiguration}
        onNetworkChange={mockOnNetworkChange}
      />,
      store,
    );

    networkConfiguration.rpcEndpoints.forEach((rpcEndpoint) => {
      expect(getByText(stripProtocol(rpcEndpoint.url))).toBeInTheDocument();
    });

    const selectedItem = getByText(
      stripProtocol(networkConfiguration.rpcEndpoints[0].url),
    ).closest('.select-rpc-url__item');

    expect(selectedItem).toHaveClass('select-rpc-url__item--selected');
  });

  it('should dispatch the correct actions when an RPC endpoint is clicked', () => {
    const { getByText } = renderWithProvider(
      <SelectRpcUrlModal
        networkConfiguration={networkConfiguration}
        onNetworkChange={mockOnNetworkChange}
      />,
      store,
    );

    const rpcEndpoint = getByText(
      stripProtocol(networkConfiguration.rpcEndpoints[1].url),
    );
    fireEvent.click(rpcEndpoint);
    const network = {
      ...networkConfiguration,
      defaultRpcEndpointIndex: 1,
    };

    expect(mockDispatch).toHaveBeenCalledWith(updateNetwork(network));
    expect(mockDispatch).toHaveBeenCalledWith(setActiveNetwork('flashbots'));
    expect(mockDispatch).toHaveBeenCalledWith(setEditedNetwork());
    expect(mockDispatch).toHaveBeenCalledWith(toggleNetworkMenu());
  });

  it('should render the selected indicator correctly for the default RPC', () => {
    const { container } = renderWithProvider(
      <SelectRpcUrlModal
        networkConfiguration={networkConfiguration}
        onNetworkChange={mockOnNetworkChange}
      />,
      store,
    );

    const selectedPill = container.querySelector(
      '.select-rpc-url__item-selected-pill',
    );
    expect(selectedPill).toBeInTheDocument();
  });

  it('should render the modal with a network image', () => {
    renderWithProvider(
      <SelectRpcUrlModal
        networkConfiguration={networkConfiguration}
        onNetworkChange={mockOnNetworkChange}
      />,
      store,
    );

    const networkImage = screen.getByRole('img');
    expect(networkImage).toBeInTheDocument();
    expect(networkImage).toHaveAttribute(
      'src',
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        networkConfiguration.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ],
    );
  });

  it('should handle click on RPC URL and call onNetworkChange', () => {
    const updatedNetwork = {
      ...networkConfiguration,
      defaultRpcEndpointIndex: 1,
    };

    renderWithProvider(
      <SelectRpcUrlModal
        networkConfiguration={networkConfiguration}
        onNetworkChange={mockOnNetworkChange}
      />,
      store,
    );

    fireEvent.click(
      screen.getByText(stripProtocol(networkConfiguration.rpcEndpoints[1].url)),
    );

    expect(mockDispatch).toHaveBeenCalledWith(updateNetwork(updatedNetwork));
    expect(mockDispatch).toHaveBeenCalledWith(setEditedNetwork());
    expect(mockOnNetworkChange).toHaveBeenCalledWith(
      toEvmCaipChainId(updatedNetwork.chainId),
      'flashbots',
    );
  });
});
