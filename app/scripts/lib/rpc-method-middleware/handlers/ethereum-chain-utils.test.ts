import * as Multichain from '@metamask/chain-agnostic-permission';
import { errorCodes, rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { Hex } from '@metamask/utils';
import * as EthChainUtils from './ethereum-chain-utils';

describe('Ethereum Chain Utils', () => {
  const createMockedSwitchChain = (mks = {}) => {
    const end = jest.fn();
    const mocks = {
      origin: 'www.test.com',
      isAddFlow: false,
      isSwitchFlow: false,
      autoApprove: false,
      setActiveNetwork: jest.fn(),
      getCaveat: jest.fn(),
      requestPermittedChainsPermissionIncrementalForOrigin: jest.fn(),
      setEnabledNetworks: jest.fn(),
      getEnabledNetworks: jest.fn().mockReturnValue({ eip155: {} }),
      setTokenNetworkFilter: jest.fn(),
      rejectApprovalRequestsForOrigin: jest.fn(),
      requestUserApproval: jest.fn(),
      hasApprovalRequestsForOrigin: jest.fn(),
      toNetworkConfiguration: {},
      fromNetworkConfiguration: {},
      ...mks,
    };
    const response: { result?: true } = {};
    const switchChain = (chainId: Hex, networkClientId: string) =>
      EthChainUtils.switchChain(response, end, chainId, networkClientId, mocks);

    return {
      mocks,
      response,
      end,
      switchChain,
    };
  };

  describe('switchChain', () => {
    it('gets the CAIP-25 caveat', async () => {
      const { mocks, switchChain } = createMockedSwitchChain();
      await switchChain('0x1', 'mainnet');

      expect(mocks.getCaveat).toHaveBeenCalledWith({
        target: Caip25EndowmentPermissionName,
        caveatType: Caip25CaveatType,
      });
    });

    it('calls rejectApprovalRequestsForOrigin if passed', async () => {
      const { mocks, switchChain } = createMockedSwitchChain();
      await switchChain('0x1', 'mainnet');

      expect(mocks.rejectApprovalRequestsForOrigin).toHaveBeenCalledTimes(1);
    });

    describe('with no existing CAIP-25 permission', () => {
      it('requests a switch chain approval without autoApprove if autoApprove: false', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.autoApprove = false;
        await switchChain('0x1', 'mainnet');

        expect(
          mocks.requestPermittedChainsPermissionIncrementalForOrigin,
        ).toHaveBeenCalledWith({ chainId: '0x1', autoApprove: false });
      });

      it('switches to the chain', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        await switchChain('0x1', 'mainnet');

        expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
        expect(mocks.setTokenNetworkFilter).toHaveBeenCalledWith('0x1');
        expect(mocks.setEnabledNetworks).toHaveBeenCalledWith(
          ['0x1'],
          'eip155',
        );
      });

      it('should throw an error if the switch chain approval is rejected', async () => {
        const { mocks, end, switchChain } = createMockedSwitchChain();
        mocks.requestPermittedChainsPermissionIncrementalForOrigin.mockRejectedValueOnce(
          {
            code: errorCodes.provider.userRejectedRequest,
          },
        );

        await switchChain('0x1', 'mainnet');

        expect(
          mocks.requestPermittedChainsPermissionIncrementalForOrigin,
        ).toHaveBeenCalled();
        expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
        expect(end).toHaveBeenCalledWith({
          code: errorCodes.provider.userRejectedRequest,
        });
      });
    });

    describe('with an existing CAIP-25 permission granted from the legacy flow (isMultichainOrigin: false) and the chainId is not already permissioned', () => {
      it('requests a switch chain approval with autoApprove and switches to it if autoApprove: true', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.autoApprove = true;
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: false,
          },
        });
        await switchChain('0x1', 'mainnet');

        expect(
          mocks.requestPermittedChainsPermissionIncrementalForOrigin,
        ).toHaveBeenCalledWith({ chainId: '0x1', autoApprove: true });
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
        expect(mocks.setTokenNetworkFilter).toHaveBeenCalledWith('0x1');
        expect(mocks.setEnabledNetworks).toHaveBeenCalledWith(
          ['0x1'],
          'eip155',
        );
      });

      it('requests permittedChains approval without autoApprove then switches to it if autoApprove: false', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.autoApprove = false;
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: false,
          },
        });
        await switchChain('0x1', 'mainnet');

        expect(
          mocks.requestPermittedChainsPermissionIncrementalForOrigin,
        ).toHaveBeenCalledWith({ chainId: '0x1', autoApprove: false });
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
        expect(mocks.setTokenNetworkFilter).toHaveBeenCalledWith('0x1');
        expect(mocks.setEnabledNetworks).toHaveBeenCalledWith(
          ['0x1'],
          'eip155',
        );
      });

      it('check for user approval is user already has access on the chain', async () => {
        jest
          .spyOn(Multichain, 'getPermittedEthChainIds')
          .mockReturnValue(['0x1']);
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.hasApprovalRequestsForOrigin.mockReturnValue(true);
        mocks.autoApprove = false;
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: false,
          },
        });
        await switchChain('0x1', 'testnet');

        expect(mocks.requestUserApproval).toHaveBeenCalledTimes(1);
      });

      it('should throw errors if the permittedChains grant fails', async () => {
        const { mocks, end, switchChain } = createMockedSwitchChain();
        mocks.requestPermittedChainsPermissionIncrementalForOrigin.mockRejectedValueOnce(
          new Error('failed to auto grant permittedChains'),
        );
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: false,
          },
        });
        await switchChain('0x1', 'mainnet');

        expect(
          mocks.requestPermittedChainsPermissionIncrementalForOrigin,
        ).toHaveBeenCalled();
        expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
        expect(end).toHaveBeenCalledWith(
          new Error('failed to auto grant permittedChains'),
        );
      });
    });

    describe('with an existing CAIP-25 permission granted from the multichain flow (isMultichainOrigin: true) and the chainId is not already permissioned', () => {
      it('requests permittedChains approval', async () => {
        const { mocks, switchChain } = createMockedSwitchChain({
          isSwitchFlow: true,
        });
        mocks.requestPermittedChainsPermissionIncrementalForOrigin.mockRejectedValue(
          new Error(
            "Cannot switch to or add permissions for chainId '0x1' because permissions were granted over the Multichain API.",
          ),
        );
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        });
        await switchChain('0x1', 'mainnet');

        expect(
          mocks.requestPermittedChainsPermissionIncrementalForOrigin,
        ).toHaveBeenCalledWith({
          chainId: '0x1',
          autoApprove: false,
          metadata: {
            isSwitchEthereumChain: true,
          },
        });
      });

      it('does not switch the active network', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        });
        mocks.requestPermittedChainsPermissionIncrementalForOrigin.mockRejectedValue(
          new Error(
            "Cannot switch to or add permissions for chainId '0x1' because permissions were granted over the Multichain API.",
          ),
        );

        await switchChain('0x1', 'mainnet');

        expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
        expect(mocks.setTokenNetworkFilter).not.toHaveBeenCalled();
        expect(mocks.setEnabledNetworks).not.toHaveBeenCalled();
      });

      it('return error about not being able to switch chain', async () => {
        const { mocks, end, switchChain } = createMockedSwitchChain();
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        });
        mocks.requestPermittedChainsPermissionIncrementalForOrigin.mockRejectedValue(
          new Error(
            "Cannot switch to or add permissions for chainId '0x1' because permissions were granted over the Multichain API.",
          ),
        );

        await switchChain('0x1', 'mainnet');

        expect(end).toHaveBeenCalledWith(
          new Error(
            "Cannot switch to or add permissions for chainId '0x1' because permissions were granted over the Multichain API.",
          ),
        );
      });
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    describe.each([
      ['legacy', false],
      ['multichain', true],
    ])(
      'with an existing CAIP-25 permission granted from the %s flow (isMultichainOrigin: %s) and the chainId is already permissioned',
      (_type: string, isMultichainOrigin: boolean) => {
        it('does not request permittedChains approval', async () => {
          const { mocks, switchChain } = createMockedSwitchChain();
          mocks.getCaveat.mockReturnValue({
            value: {
              requiredScopes: {
                'eip155:1': {
                  accounts: [],
                },
              },
              optionalScopes: {},
              isMultichainOrigin,
            },
          });
          await switchChain('0x1', 'mainnet');

          expect(
            mocks.requestPermittedChainsPermissionIncrementalForOrigin,
          ).not.toHaveBeenCalled();
        });

        it('switches the active network', async () => {
          const { mocks, switchChain } = createMockedSwitchChain();
          mocks.getCaveat.mockReturnValue({
            value: {
              requiredScopes: {
                'eip155:1': {
                  accounts: [],
                },
              },
              optionalScopes: {},
              isMultichainOrigin,
            },
          });
          await switchChain('0x1', 'mainnet');

          expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
          expect(mocks.setTokenNetworkFilter).toHaveBeenCalledWith('0x1');
          expect(mocks.setEnabledNetworks).toHaveBeenCalledWith(
            ['0x1'],
            'eip155',
          );
        });
      },
    );
  });

  describe('validateAddEthereumChainParams', () => {
    it('throws an error if an unexpected parameter is provided', () => {
      const unexpectedParam = 'unexpected';

      expect(() => {
        EthChainUtils.validateAddEthereumChainParams({
          chainId: '0x1',
          chainName: 'Mainnet',
          rpcUrls: ['https://test.com/rpc'],
          nativeCurrency: {
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://explorer.test.com/'],
          [unexpectedParam]: 'parameter',
        });
      }).toThrow(
        rpcErrors.invalidParams({
          message: `Received unexpected keys on object parameter. Unsupported keys:\n${unexpectedParam}`,
        }),
      );
    });

    it('returns a flattened version of params if it is valid', () => {
      expect(
        EthChainUtils.validateAddEthereumChainParams({
          chainId: '0x1',
          chainName: 'Mainnet',
          rpcUrls: ['https://test.com/rpc'],
          nativeCurrency: {
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://explorer.test.com/'],
        }),
      ).toStrictEqual({
        chainId: '0x1',
        chainName: 'Mainnet',
        firstValidBlockExplorerUrl: 'https://explorer.test.com/',
        firstValidRPCUrl: 'https://test.com/rpc',
        ticker: 'ETH',
      });
    });
  });

  describe('validateSwitchEthereumChainParams', () => {
    it('throws an error if an unexpected parameter is provided', () => {
      const unexpectedParam = 'unexpected';

      expect(() => {
        EthChainUtils.validateSwitchEthereumChainParams({
          params: [
            {
              chainId: '0x1',
              [unexpectedParam]: 'parameter',
            },
          ],
        });
      }).toThrow(
        rpcErrors.invalidParams({
          message: `Received unexpected keys on object parameter. Unsupported keys:\n${unexpectedParam}`,
        }),
      );
    });

    it('throws an error for invalid chainId', async () => {
      expect(() => {
        EthChainUtils.validateSwitchEthereumChainParams({
          params: [
            {
              chainId: 'invalid_chain_id',
            },
          ],
        });
      }).toThrow(
        rpcErrors.invalidParams({
          message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\ninvalid_chain_id`,
        }),
      );
    });

    it('returns the chainId if it is valid', () => {
      expect(
        EthChainUtils.validateSwitchEthereumChainParams({
          params: [
            {
              chainId: '0x1',
            },
          ],
        }),
      ).toStrictEqual('0x1');
    });
  });
});
