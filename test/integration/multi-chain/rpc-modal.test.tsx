import mockMetaMaskState from '../data/integration-init-state.json';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import {
  createMockImplementation,
  mockGetChains,
  mockNetworkBaseLlama,
} from '../helpers';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...mockRequests,
    }),
  );
};

describe('Metamask home page', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockNetworkBaseLlama();
    mockGetChains();
    setupSubmitRequestToBackgroundMocks();
  });

  it('displays the multi rpc modal when the showMultiRpcModal preference is true', async () => {
    process.env.IN_TEST = '';
    const mockedMetamaskState = {
      ...mockMetaMaskState,
      preferences: {
        ...mockMetaMaskState.preferences,
        showMultiRpcModal: true,
      },
    };

    const mockedRequests = {
      getState: mockedMetamaskState,
      getTokenStandardAndDetails: { decimal: '10' },
    };

    setupSubmitRequestToBackgroundMocks(mockedRequests);

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetamaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const multiRpcModal = screen.getByTestId('multi-rpc-edit-modal');
    expect(multiRpcModal).toBeInTheDocument();
    expect(multiRpcModal).toHaveTextContent('Network RPCs Updated');
    expect(multiRpcModal).toHaveTextContent(
      'We now support multiple RPCs for a single network. Your most recent RPC has been selected as the default one to resolve conflicting information.',
    );
    expect(screen.getByTestId('mm-modal-confirm')).toBeInTheDocument();
  });

  it('sets preference showMultiRpcModal to false on accept', async () => {
    process.env.IN_TEST = '';
    mockedBackgroundConnection.callBackgroundMethod.mockImplementation(
      createMockImplementation({ setPreference: {} }),
    );

    const mockedMetamaskState = {
      ...mockMetaMaskState,
      preferences: {
        ...mockMetaMaskState.preferences,
        showMultiRpcModal: true,
      },
    };

    const mockedRequests = {
      getState: mockedMetamaskState,
      getTokenStandardAndDetails: { decimal: '10' },
    };

    setupSubmitRequestToBackgroundMocks(mockedRequests);

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetamaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(screen.getByTestId('multi-rpc-edit-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mm-modal-confirm'));

    await waitFor(() => {
      expect(
        mockedBackgroundConnection.callBackgroundMethod,
      ).toHaveBeenCalledWith(
        'setPreference',
        ['showMultiRpcModal', false],
        expect.anything(),
      );
    });
  });

  it('edits the name of an RPC network', async () => {
    const mockedRequests = {
      getState: mockMetaMaskState,
      getTokenStandardAndDetails: { decimal: '10' },
    };

    setupSubmitRequestToBackgroundMocks(mockedRequests);

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(screen.getByTestId('network-display'));
    expect(
      screen.queryByTestId('multichain-network-list-menu'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('network-list-item-options-button-0x2105'),
    );
    fireEvent.click(screen.getByTestId('network-list-item-options-edit'));

    expect(screen.queryByTestId('network-form-name-input')).toBeInTheDocument();

    const networkNameInput = screen.getByTestId('network-form-network-name');
    expect(networkNameInput).toHaveValue('Base Mainnet');
    fireEvent.input(networkNameInput, { target: { value: 'New Base Name' } });
    fireEvent.click(screen.getByTestId('network-form-save'));

    let updateNetworkCall;

    await waitFor(() => {
      updateNetworkCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'updateNetwork',
        );
      expect(updateNetworkCall?.[0]).toBe('updateNetwork');
    });

    expect(updateNetworkCall?.[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chainId: '0x2105',
          name: 'New Base Name',
          nativeCurrency: 'ETH',
          rpcEndpoints: expect.arrayContaining([
            expect.objectContaining({
              networkClientId: '225ae6de-deda-4078-9f6c-4a4fb758ae00',
              url: 'https://base.meowrpc.com',
              type: 'custom',
              name: 'Base Meow',
            }),
            expect.objectContaining({
              networkClientId: '78d85c4e-eeb0-4b81-ae5b-52d0fca7e5e3',
              url: 'https://base-pokt.nodies.app',
              type: 'custom',
              name: 'Base',
            }),
            expect.objectContaining({
              networkClientId: 'b3742c56-a2be-48ef-8811-6e9d265b420b',
              url: 'https://base.llamarpc.com',
              type: 'custom',
              name: 'Base LlamaNodes',
            }),
          ]),
          defaultRpcEndpointIndex: 2,
          blockExplorerUrls: expect.arrayContaining(['https://basescan.org']),
          defaultBlockExplorerUrlIndex: 0,
        }),
        expect.objectContaining({
          replacementSelectedRpcEndpointIndex: 2,
        }),
      ]),
    );
  });

  it('sends the network menu opened metric when the menu is opened', async () => {
    const mockedRequests = {
      getState: mockMetaMaskState,
      getTokenStandardAndDetails: { decimal: '10' },
    };

    setupSubmitRequestToBackgroundMocks(mockedRequests);

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(screen.getByTestId('network-display'));

    let networkMenuOpenedMetricsEvent;

    await waitFor(() => {
      networkMenuOpenedMetricsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'trackMetaMetricsEvent',
        );
      expect(networkMenuOpenedMetricsEvent?.[0]).toBe('trackMetaMetricsEvent');
    });

    expect(networkMenuOpenedMetricsEvent?.[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'Network Menu Opened',
          category: 'Navigation',
          properties: { location: 'App header', chain_id: 'eip155:11155111' },
          environmentType: 'background',
          page: { path: '/', title: 'Home', url: '/' },
          referrer: undefined,
        }),
      ]),
    );
  });
});
