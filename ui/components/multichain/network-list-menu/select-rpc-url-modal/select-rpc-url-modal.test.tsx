import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import {
  // TODO: Add this API with network controller v21 upgrade
  // updateNetwork,
  setActiveNetwork,
  setEditedNetwork,
  toggleNetworkMenu,
} from '../../../../store/actions';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import { stripProtocol } from '../rpc-list-item';
import { SelectRpcUrlModal } from './select-rpc-url-modal'; // Adjust the path as needed

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../../store/actions', () => ({
  // TODO: Add this API with network controller v21 upgrade
  // updateNetwork: jest.fn(),
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
};

const store = mockStore({
  metamask: {
    networks: [networkConfiguration],
    activeNetwork: '0x1',
  },
});

describe('SelectRpcUrlModal Component', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('renders select rpc url', () => {
    const { container } = renderWithProvider(
      <SelectRpcUrlModal networkConfiguration={networkConfiguration} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render the component correctly with network image and name', () => {
    const { getByRole, getByText } = renderWithProvider(
      <SelectRpcUrlModal networkConfiguration={networkConfiguration} />,
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
      <SelectRpcUrlModal networkConfiguration={networkConfiguration} />,
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
      <SelectRpcUrlModal networkConfiguration={networkConfiguration} />,
      store,
    );

    const rpcEndpoint = getByText(
      stripProtocol(networkConfiguration.rpcEndpoints[1].url),
    );
    fireEvent.click(rpcEndpoint);

    // TODO: Add this API with network controller v21 upgrade
    // expect(mockDispatch).toHaveBeenCalledWith(
    //   updateNetwork({
    //     ...networkConfiguration,
    //     defaultRpcEndpointIndex: 1,
    //   }),
    // );
    expect(mockDispatch).toHaveBeenCalledWith(setActiveNetwork('flashbots'));
    expect(mockDispatch).toHaveBeenCalledWith(setEditedNetwork());
    expect(mockDispatch).toHaveBeenCalledWith(toggleNetworkMenu());
  });

  it('should render the selected indicator correctly for the default RPC', () => {
    const { container } = renderWithProvider(
      <SelectRpcUrlModal networkConfiguration={networkConfiguration} />,
      store,
    );

    const selectedPill = container.querySelector(
      '.select-rpc-url__item-selected-pill',
    );
    expect(selectedPill).toBeInTheDocument();
  });

  it('should render the modal with a network image', () => {
    renderWithProvider(
      <SelectRpcUrlModal networkConfiguration={networkConfiguration} />,
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

  it('should handle click on RPC URL and update the network', () => {
    renderWithProvider(
      <SelectRpcUrlModal networkConfiguration={networkConfiguration} />,
      store,
    );

    fireEvent.click(
      screen.getByText(stripProtocol(networkConfiguration.rpcEndpoints[1].url)),
    );

    // TODO: Add this API with network controller v21 upgrade
    // expect(mockDispatch).toHaveBeenCalledWith(
    //   updateNetwork({
    //     ...networkConfiguration,
    //     defaultRpcEndpointIndex: 1,
    //   }),
    // );
    expect(mockDispatch).toHaveBeenCalledWith(
      setActiveNetwork(networkConfiguration.rpcEndpoints[1].networkClientId),
    );
    expect(mockDispatch).toHaveBeenCalledWith(setEditedNetwork());
    expect(mockDispatch).toHaveBeenCalledWith(toggleNetworkMenu());
  });
});
