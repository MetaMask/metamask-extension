import { ethErrors } from 'eth-rpc-errors';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import { PermissionNames } from '../../../controllers/permissions';
import { CaveatTypes } from '../../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../multichain-api/caip25permissions';
import addEthereumChain from './add-ethereum-chain';

const NON_INFURA_CHAIN_ID = '0x123456789';

const createMockMainnetConfiguration = () => ({
  chainId: CHAIN_IDS.MAINNET,
  nickname: 'Ethereum Mainnet',
  rpcUrl: 'https://mainnet.infura.io/v3/',
  type: NETWORK_TYPES.MAINNET,
  ticker: 'ETH',
  rpcPrefs: {
    blockExplorerUrl: 'https://etherscan.io',
  },
});

const createMockOptimismConfiguration = () => ({
  chainId: CHAIN_IDS.OPTIMISM,
  nickname: 'Optimism',
  rpcUrl: 'https://optimism.llamarpc.com',
  rpcPrefs: {
    blockExplorerUrl: 'https://optimistic.etherscan.io',
  },
  ticker: 'ETH',
});

const createMockNonInfuraConfiguration = () => ({
  chainId: NON_INFURA_CHAIN_ID,
  rpcUrl: 'https://custom.network',
  ticker: 'CUST',
  nickname: 'Custom Network',
  rpcPrefs: {
    blockExplorerUrl: 'https://custom.blockexplorer',
  },
});

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const mocks = {
    getCurrentChainIdForDomain: jest.fn().mockReturnValue(NON_INFURA_CHAIN_ID),
    findNetworkConfigurationBy: jest
      .fn()
      .mockReturnValue(createMockMainnetConfiguration()),
    setActiveNetwork: jest.fn(),
    getCurrentRpcUrl: jest
      .fn()
      .mockReturnValue(createMockMainnetConfiguration().rpcUrl),
    requestUserApproval: jest.fn().mockResolvedValue(123),
    requestPermittedChainsPermission: jest.fn(),
    getCaveat: jest.fn(),
    upsertNetworkConfiguration: jest.fn().mockResolvedValue(123),
    startApprovalFlow: () => ({ id: 'approvalFlowId' }),
    endApprovalFlow: jest.fn(),
    requestPermissionApprovalForOrigin: jest.fn(),
    updateCaveat: jest.fn(),
  };
  const response = {};
  const handler = (request) =>
    addEthereumChain.implementation(request, response, next, end, mocks);

  return {
    mocks,
    response,
    next,
    end,
    handler,
  };
};

describe('addEthereumChainHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new network configuration for the given chainid if no networkConfigurations with the same chainId exists', async () => {
    const { mocks, handler } = createMockedHandler();
    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: createMockNonInfuraConfiguration().chainId,
          chainName: createMockNonInfuraConfiguration().nickname,
          rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
          nativeCurrency: {
            symbol: createMockNonInfuraConfiguration().ticker,
            decimals: 18,
          },
          blockExplorerUrls: [
            createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
          ],
        },
      ],
    });

    expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledWith(
      createMockNonInfuraConfiguration(),
      { referrer: 'example.com', source: 'dapp' },
    );
  });

  it('does not create a new networkConfiguration for the given chainId if a networkConfiguration already exists with the same chainId and rpcUrl', async () => {
    const { handler, mocks } = createMockedHandler();
    mocks.findNetworkConfigurationBy.mockReturnValue(
      createMockMainnetConfiguration(),
    );
    mocks.upsertNetworkConfiguration.mockResolvedValue(123456);
    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: CHAIN_IDS.MAINNET,
          chainName: 'Ethereum Mainnet',
          rpcUrls: createMockMainnetConfiguration().rpcUrls,
          nativeCurrency: {
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://etherscan.io'],
        },
      ],
    });

    expect(mocks.upsertNetworkConfiguration).not.toHaveBeenCalled();
  });

  it('create a new networkConfiguration for the given chainId if a networkConfiguration already exists with the same chainId but different rpcUrl', async () => {
    const { handler, mocks } = createMockedHandler();
    mocks.upsertNetworkConfiguration.mockResolvedValue(123456);
    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: CHAIN_IDS.MAINNET,
          chainName: 'Ethereum Mainnet',
          rpcUrls: ['https://eth.llamarpc.com'],
          nativeCurrency: {
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://etherscan.io'],
        },
      ],
    });

    expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledTimes(1);
  });

  it('gets the CAIP-25 caveat', async () => {
    const { mocks, handler } = createMockedHandler();
    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: CHAIN_IDS.MAINNET,
          chainName: 'Ethereum Mainnet',
          rpcUrls: ['https://eth.llamarpc.com'],
          nativeCurrency: {
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://etherscan.io'],
        },
      ],
    });

    expect(mocks.getCaveat).toHaveBeenCalledWith({
      target: Caip25EndowmentPermissionName,
      caveatType: Caip25CaveatType,
    });
  });

  it('should return an error if an unexpected parameter is provided', async () => {
    const { end, handler } = createMockedHandler();

    const unexpectedParam = 'unexpected';

    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: createMockNonInfuraConfiguration().chainId,
          chainName: createMockNonInfuraConfiguration().nickname,
          rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
          nativeCurrency: {
            symbol: createMockNonInfuraConfiguration().ticker,
            decimals: 18,
          },
          blockExplorerUrls: [
            createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
          ],
          [unexpectedParam]: 'parameter',
        },
      ],
    });

    expect(end).toHaveBeenCalledWith(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${unexpectedParam}`,
      }),
    );
  });

  it('should return an error if nativeCurrency.symbol does not match an existing network with the same chainId', async () => {
    const { handler, end } = createMockedHandler();

    await handler({
      origin: 'example.com',
      params: [
        {
          chainId: CHAIN_IDS.MAINNET,
          chainName: 'Ethereum Mainnet',
          rpcUrls: ['https://mainnet.infura.io/v3/'],
          nativeCurrency: {
            symbol: 'WRONG',
            decimals: 18,
          },
          blockExplorerUrls: ['https://etherscan.io'],
        },
      ],
    });

    expect(end).toHaveBeenCalledWith(
      ethErrors.rpc.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\nWRONG`,
      }),
    );
  });

  it('should return error for invalid chainId', async () => {
    const { handler, end } = createMockedHandler();

    await handler({
      origin: 'example.com',
      params: [{ chainId: 'invalid_chain_id' }],
    });

    expect(end).toHaveBeenCalledWith(
      ethErrors.rpc.invalidParams({
        message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\ninvalid_chain_id`,
      }),
    );
  });

  describe('with no existing CAIP-25 permission', () => {
    it('requests a switch chain approval and switches to it', async () => {
      const { handler, mocks } = createMockedHandler();
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: CHAIN_IDS.OPTIMISM,
            chainName: 'Optimism Mainnet',
            rpcUrls: ['https://optimism.llamarpc.com'],
            nativeCurrency: {
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://optimistic.etherscan.io'],
            iconUrls: ['https://optimism.icon.com'],
          },
        ],
      });

      // called twice, once for the add and once for the switch
      expect(mocks.requestUserApproval).toHaveBeenCalledTimes(2);
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(123);
    });

    it('should handle errors if the switch chain approval is rejected', async () => {
      const { handler, end, mocks } = createMockedHandler();
      mocks.requestUserApproval
        .mockResolvedValueOnce(123)
        .mockRejectedValueOnce(new Error('approval rejected'));

      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: CHAIN_IDS.OPTIMISM,
            chainName: 'Optimism Mainnet',
            rpcUrls: ['https://optimism.llamarpc.com'],
            nativeCurrency: {
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://optimistic.etherscan.io'],
            iconUrls: ['https://optimism.icon.com'],
          },
        ],
      });

      expect(mocks.requestUserApproval).toHaveBeenCalledTimes(2);
      expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
      expect(end).toHaveBeenCalledWith(new Error('approval rejected'));
    });

    it('requests switch chain approval and switches to it if a networkConfiguration for the given chainId but with a different rpcUrl exists', async () => {
      const { handler, mocks } = createMockedHandler();
      mocks.upsertNetworkConfiguration.mockResolvedValue(123456);
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: CHAIN_IDS.MAINNET,
            chainName: 'Ethereum Mainnet',
            rpcUrls: ['https://eth.llamarpc.com'],
            nativeCurrency: {
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://etherscan.io'],
          },
        ],
      });

      // called twice, once for the add and once for the switch
      expect(mocks.requestUserApproval).toHaveBeenCalledTimes(2);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(123456);
    });

    it('requests chain switch approval and should switch to the existing networkConfiguration if a networkConfiguration with the same chainId and rpcUrl exists', async () => {
      const { handler, mocks } = createMockedHandler();
      mocks.getCurrentRpcUrl.mockReturnValue(
        createMockNonInfuraConfiguration().rpcUrl,
      );
      mocks.getCurrentChainIdForDomain.mockReturnValue(
        createMockNonInfuraConfiguration().chainId,
      );
      mocks.findNetworkConfigurationBy.mockImplementation(({ chainId }) => {
        switch (chainId) {
          case createMockNonInfuraConfiguration().chainId:
            return createMockNonInfuraConfiguration();
          case createMockOptimismConfiguration().chainId:
            return createMockOptimismConfiguration();
          default:
            return undefined;
        }
      });
      mocks.upsertNetworkConfiguration.mockResolvedValue(123);
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: createMockOptimismConfiguration().chainId,
            chainName: createMockOptimismConfiguration().nickname,
            rpcUrls: [createMockOptimismConfiguration().rpcUrl],
            nativeCurrency: {
              symbol: createMockOptimismConfiguration().ticker,
              decimals: 18,
            },
            blockExplorerUrls: [
              createMockOptimismConfiguration().rpcPrefs.blockExplorerUrl,
            ],
          },
        ],
      });

      expect(mocks.requestUserApproval).toHaveBeenCalledTimes(1);
      expect(mocks.requestUserApproval).toHaveBeenCalledWith({
        origin: 'example.com',
        requestData: {
          fromNetworkConfiguration: createMockNonInfuraConfiguration(),
          toNetworkConfiguration: {
            chainId: '0xa',
            nickname: 'Optimism',
            rpcPrefs: {
              blockExplorerUrl: 'https://optimistic.etherscan.io',
            },
            rpcUrl: 'https://optimism.llamarpc.com',
            ticker: 'ETH',
          },
        },
        type: 'wallet_switchEthereumChain',
      });
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
        createMockOptimismConfiguration().id,
      );
    });
  });

  describe('with an existing CAIP-25 permission granted from the legacy flow (isMultichainOrigin: false) and the chainId is not already permissioned', () => {
    it('requests permittedChains approval and switches to it', async () => {
      const { mocks, handler } = createMockedHandler();
      mocks.getCaveat.mockReturnValue({
        value: {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        },
      });
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: createMockNonInfuraConfiguration().chainId,
            chainName: createMockNonInfuraConfiguration().nickname,
            rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
            nativeCurrency: {
              symbol: createMockNonInfuraConfiguration().ticker,
              decimals: 18,
            },
            blockExplorerUrls: [
              createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
            ],
          },
        ],
      });

      expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledTimes(1);
      expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
        [PermissionNames.permittedChains]: {
          caveats: [
            {
              type: CaveatTypes.restrictNetworkSwitching,
              value: [createMockNonInfuraConfiguration().chainId],
            },
          ],
        },
      });
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(123);
    });

    it('should handle errors if the permittedChains approval is rejected', async () => {
      const { handler, end, mocks } = createMockedHandler();
      mocks.requestPermissionApprovalForOrigin.mockRejectedValueOnce(
        new Error('approval rejected'),
      );
      mocks.getCaveat.mockReturnValue({
        value: {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        },
      });
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: createMockNonInfuraConfiguration().chainId,
            chainName: createMockNonInfuraConfiguration().nickname,
            rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
            nativeCurrency: {
              symbol: createMockNonInfuraConfiguration().ticker,
              decimals: 18,
            },
            blockExplorerUrls: [
              createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
            ],
          },
        ],
      });

      expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
      expect(end).toHaveBeenCalledWith(new Error('approval rejected'));
    });

    it('requests permittedChain approval and switches to it if a networkConfiguration for the given chainId but with a different rpcUrl exists', async () => {
      const { mocks, handler } = createMockedHandler();
      mocks.getCaveat.mockReturnValue({
        value: {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        },
      });
      mocks.findNetworkConfigurationBy.mockReturnValue(
        createMockNonInfuraConfiguration(),
      );
      mocks.getCurrentChainIdForDomain.mockReturnValue(CHAIN_IDS.MAINNET);

      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: NON_INFURA_CHAIN_ID,
            chainName: 'Custom Network',
            rpcUrls: ['https://new-custom.network'],
            nativeCurrency: {
              symbol: 'CUST',
              decimals: 18,
            },
            blockExplorerUrls: ['https://custom.blockexplorer'],
          },
        ],
      });

      expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledTimes(1);
      expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
        [PermissionNames.permittedChains]: {
          caveats: [
            {
              type: CaveatTypes.restrictNetworkSwitching,
              value: [NON_INFURA_CHAIN_ID],
            },
          ],
        },
      });
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
    });

    it('requests permittedChain approval and should should switch to the existing networkConfiguration if a networkConfiguration with the same chainId and rpcUrl exists', async () => {
      const { mocks, handler } = createMockedHandler();
      mocks.getCaveat.mockReturnValue({
        value: {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        },
      });
      mocks.getCurrentRpcUrl.mockReturnValue('https://eth.llamarpc.com');
      mocks.findNetworkConfigurationBy.mockReturnValue(
        createMockOptimismConfiguration(),
      );

      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: createMockOptimismConfiguration().chainId,
            chainName: createMockOptimismConfiguration().nickname,
            rpcUrls: [createMockOptimismConfiguration().rpcUrl],
            nativeCurrency: {
              symbol: createMockOptimismConfiguration().ticker,
              decimals: 18,
            },
            blockExplorerUrls: [
              createMockOptimismConfiguration().rpcPrefs.blockExplorerUrl,
            ],
          },
        ],
      });

      expect(mocks.requestUserApproval).not.toHaveBeenCalled();

      expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledTimes(1);
      expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
        [PermissionNames.permittedChains]: {
          caveats: [
            { type: CaveatTypes.restrictNetworkSwitching, value: ['0xa'] },
          ],
        },
      });
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
        createMockOptimismConfiguration().id,
      );
    });
  });

  describe('with an existing CAIP-25 permission granted from the multichain flow (isMultichainOrigin: true) and the chainId is not already permissioned', () => {
    it('does not request permittedChains approval', async () => {
      const { mocks, handler } = createMockedHandler();
      mocks.getCaveat.mockReturnValue({
        value: {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: true,
        },
      });
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: createMockNonInfuraConfiguration().chainId,
            chainName: createMockNonInfuraConfiguration().nickname,
            rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
            nativeCurrency: {
              symbol: createMockNonInfuraConfiguration().ticker,
              decimals: 18,
            },
            blockExplorerUrls: [
              createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
            ],
          },
        ],
      });

      expect(mocks.requestPermissionApprovalForOrigin).not.toHaveBeenCalled();
    });

    it('does not switch the active network', async () => {
      const { mocks, handler } = createMockedHandler();
      mocks.getCaveat.mockReturnValue({
        value: {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: true,
        },
      });
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: createMockNonInfuraConfiguration().chainId,
            chainName: createMockNonInfuraConfiguration().nickname,
            rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
            nativeCurrency: {
              symbol: createMockNonInfuraConfiguration().ticker,
              decimals: 18,
            },
            blockExplorerUrls: [
              createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
            ],
          },
        ],
      });

      expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
    });

    it('return error about not being able to switch chain', async () => {
      const { handler, end, mocks } = createMockedHandler();
      mocks.getCaveat.mockReturnValue({
        value: {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: true,
        },
      });
      await handler({
        origin: 'example.com',
        params: [
          {
            chainId: createMockNonInfuraConfiguration().chainId,
            chainName: createMockNonInfuraConfiguration().nickname,
            rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
            nativeCurrency: {
              symbol: createMockNonInfuraConfiguration().ticker,
              decimals: 18,
            },
            blockExplorerUrls: [
              createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
            ],
          },
        ],
      });

      expect(end).toHaveBeenCalledWith(
        new Error(
          'cannot switch to chain that was not permissioned in the multichain flow',
        ),
      );
    });
  });

  describe.each([
    ['legacy', false],
    ['multichain', true],
  ])(
    'with an existing CAIP-25 permission granted from the %s flow (isMultichainOrigin: %s) and the chainId is already permissioned',
    (_, isMultichainOrigin) => {
      const nonInfuraScopeString = `eip155:${parseInt(
        createMockNonInfuraConfiguration().chainId,
        16,
      )}`;

      it('does not request permittedChains approval but does switch to it', async () => {
        const { mocks, handler } = createMockedHandler();
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {
              [nonInfuraScopeString]: {
                methods: [],
                notifications: [],
              },
            },
            optionalScopes: {},
            isMultichainOrigin,
          },
        });
        await handler({
          origin: 'example.com',
          params: [
            {
              chainId: createMockNonInfuraConfiguration().chainId,
              chainName: createMockNonInfuraConfiguration().nickname,
              rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
              nativeCurrency: {
                symbol: createMockNonInfuraConfiguration().ticker,
                decimals: 18,
              },
              blockExplorerUrls: [
                createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
              ],
            },
          ],
        });

        expect(mocks.requestPermissionApprovalForOrigin).not.toHaveBeenCalled();
        expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith(123);
      });

      it('does not request permittedChain approval but does switch to it if a networkConfiguration for the given chainId but with a different rpcUrl exists', async () => {
        const { mocks, handler } = createMockedHandler();
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {
              [nonInfuraScopeString]: {
                methods: [],
                notifications: [],
              },
            },
            optionalScopes: {},
            isMultichainOrigin,
          },
        });
        mocks.findNetworkConfigurationBy.mockReturnValue(
          createMockNonInfuraConfiguration(),
        );
        mocks.getCurrentChainIdForDomain.mockReturnValue(CHAIN_IDS.MAINNET);

        await handler({
          origin: 'example.com',
          params: [
            {
              chainId: NON_INFURA_CHAIN_ID,
              chainName: 'Custom Network',
              rpcUrls: ['https://new-custom.network'],
              nativeCurrency: {
                symbol: 'CUST',
                decimals: 18,
              },
              blockExplorerUrls: ['https://custom.blockexplorer'],
            },
          ],
        });

        expect(mocks.requestPermissionApprovalForOrigin).not.toHaveBeenCalled();
        expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      });

      it('does not request permittedChain approval but should should switch to the existing networkConfiguration if a networkConfiguration with the same chainId and rpcUrl exists', async () => {
        const optimismScopeString = `eip155:${parseInt(
          createMockOptimismConfiguration().chainId,
          16,
        )}`;
        const { mocks, handler } = createMockedHandler();
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {
              [optimismScopeString]: {
                methods: [],
                notifications: [],
              },
            },
            optionalScopes: {},
            isMultichainOrigin,
          },
        });
        mocks.getCurrentRpcUrl.mockReturnValue('https://eth.llamarpc.com');
        mocks.findNetworkConfigurationBy.mockReturnValue(
          createMockOptimismConfiguration(),
        );

        await handler({
          origin: 'example.com',
          params: [
            {
              chainId: createMockOptimismConfiguration().chainId,
              chainName: createMockOptimismConfiguration().nickname,
              rpcUrls: [createMockOptimismConfiguration().rpcUrl],
              nativeCurrency: {
                symbol: createMockOptimismConfiguration().ticker,
                decimals: 18,
              },
              blockExplorerUrls: [
                createMockOptimismConfiguration().rpcPrefs.blockExplorerUrl,
              ],
            },
          ],
        });

        expect(mocks.requestUserApproval).not.toHaveBeenCalled();

        expect(mocks.requestPermissionApprovalForOrigin).not.toHaveBeenCalled();
        expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
          createMockOptimismConfiguration().id,
        );
      });
    },
  );
});
