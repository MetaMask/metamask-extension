import {
  getBalancesInSingleCall,
  getTokenStandardAndDetailsByChain,
  registerActions,
  TOKEN_RESOLUTION_ACTIONS,
  type TokenResolutionMessenger,
} from '.';

describe('token resolution', () => {
  const callMock = jest.fn<Promise<unknown>, unknown[]>();
  const registerActionHandlerMock = jest.fn<void, [string, unknown]>();
  const selectedAccount = {
    address: '0x1234567890abcdef1234567890ABCDEF12345678',
  };

  const dependencies = {
    getGlobalChainId: jest.fn(() => '0x1'),
    getMetaMaskState: jest.fn(() => ({
      tokensChainsCache: {},
      allTokens: {},
    })),
    getNetworkControllerState: jest.fn(() => ({
      networkConfigurationsByChainId: {
        '0x5': {
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [{ networkClientId: 'network-client-id-5' }],
        },
      },
    })),
    getProvider: jest.fn(() => ({})),
    getSelectedAccount: jest.fn(() => selectedAccount),
  };

  const messenger: TokenResolutionMessenger = {
    call: callMock as TokenResolutionMessenger['call'],
    registerActionHandler:
      registerActionHandlerMock as TokenResolutionMessenger['registerActionHandler'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers all token resolution actions', () => {
    registerActions(messenger, dependencies);

    expect(registerActionHandlerMock.mock.calls).toHaveLength(
      TOKEN_RESOLUTION_ACTIONS.length,
    );
    expect(
      registerActionHandlerMock.mock.calls.map(([action]) => action),
    ).toStrictEqual(TOKEN_RESOLUTION_ACTIONS);
  });

  it('forwards single-call balance requests to the assets contract controller', async () => {
    callMock.mockResolvedValueOnce({ token: '1' });

    await getBalancesInSingleCall(
      messenger,
      selectedAccount.address,
      ['0xToken'],
      'network-client-id-1',
    );

    expect(callMock).toHaveBeenCalledWith(
      'AssetsContractController:getBalancesInSingleCall',
      selectedAccount.address,
      ['0xToken'],
      'network-client-id-1',
    );
  });

  it('passes the derived network client id for chain-scoped token resolution', async () => {
    callMock.mockResolvedValueOnce({
      standard: 'ERC20',
      decimals: 18,
      symbol: 'DAI',
      balance: '1',
    });

    await getTokenStandardAndDetailsByChain(
      messenger,
      dependencies,
      '0xToken',
      selectedAccount.address,
      undefined,
      '0x5',
    );

    expect(callMock).toHaveBeenCalledWith(
      'AssetsContractController:getTokenStandardAndDetails',
      '0xToken',
      selectedAccount.address,
      undefined,
      'network-client-id-5',
    );
  });
});
