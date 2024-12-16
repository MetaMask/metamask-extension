import { errorCodes, rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import { Hex } from '@metamask/utils';
import { CaveatTypes } from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';
import * as EthChainUtils from './ethereum-chain-utils';

describe('Ethereum Chain Utils', () => {
  const createMockedSwitchChain = () => {
    const end = jest.fn();
    const mocks = {
      isAddFlow: false,
      setActiveNetwork: jest.fn(),
      endApprovalFlow: jest.fn(),
      getCaveat: jest.fn(),
      requestPermissionApprovalForOrigin: jest.fn(),
      updateCaveat: jest.fn(),
      grantPermissions: jest.fn(),
    };
    const response: { result?: true } = {};
    const switchChain = (
      chainId: Hex,
      networkClientId: string,
      approvalFlowId?: string,
    ) =>
      EthChainUtils.switchChain(
        response,
        end,
        chainId,
        networkClientId,
        approvalFlowId,
        mocks,
      );

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
      await switchChain('0x1', 'mainnet', 'approvalFlowId');

      expect(mocks.getCaveat).toHaveBeenCalledWith({
        target: Caip25EndowmentPermissionName,
        caveatType: Caip25CaveatType,
      });
    });

    it('passes through unexpected errors if approvalFlowId is not provided', async () => {
      const { mocks, end, switchChain } = createMockedSwitchChain();
      mocks.requestPermissionApprovalForOrigin.mockRejectedValueOnce(
        new Error('unexpected error'),
      );

      await switchChain('0x1', 'mainnet', undefined);

      expect(end).toHaveBeenCalledWith(new Error('unexpected error'));
    });

    it('passes through unexpected errors if approvalFlowId is provided', async () => {
      const { mocks, end, switchChain } = createMockedSwitchChain();
      mocks.requestPermissionApprovalForOrigin.mockRejectedValueOnce(
        new Error('unexpected error'),
      );

      await switchChain('0x1', 'mainnet', 'approvalFlowId');

      expect(end).toHaveBeenCalledWith(new Error('unexpected error'));
    });

    it('ignores userRejectedRequest errors when approvalFlowId is provided', async () => {
      const { mocks, end, response, switchChain } = createMockedSwitchChain();
      mocks.requestPermissionApprovalForOrigin.mockRejectedValueOnce({
        code: errorCodes.provider.userRejectedRequest,
      });

      await switchChain('0x1', 'mainnet', 'approvalFlowId');

      expect(response.result).toStrictEqual(null);
      expect(end).toHaveBeenCalledWith();
    });

    it('ends the approval flow when approvalFlowId is provided', async () => {
      const { mocks, switchChain } = createMockedSwitchChain();

      await switchChain('0x1', 'mainnet', 'approvalFlowId');

      expect(mocks.endApprovalFlow).toHaveBeenCalledWith({
        id: 'approvalFlowId',
      });
    });

    describe('with no existing CAIP-25 permission', () => {
      it('requests a switch chain approval if isAddFlow: false', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.isAddFlow = false;
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
          [PermissionNames.permittedChains]: {
            caveats: [
              {
                type: CaveatTypes.restrictNetworkSwitching,
                value: ['0x1'],
              },
            ],
          },
        });
      });

      it('grants a new CAIP-25 permission with the chain', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.grantPermissions).toHaveBeenCalledWith({
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1': {
                      accounts: [],
                    },
                  },
                  isMultichainOrigin: false,
                },
              },
            ],
          },
        });
      });

      it('switches to the chain', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
      });

      it('should handle errors if the switch chain approval is rejected', async () => {
        const { mocks, end, switchChain } = createMockedSwitchChain();
        mocks.requestPermissionApprovalForOrigin.mockRejectedValueOnce({
          code: errorCodes.provider.userRejectedRequest,
        });

        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalled();
        expect(mocks.grantPermissions).not.toHaveBeenCalled();
        expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
        expect(end).toHaveBeenCalledWith();
      });
    });

    describe('with an existing CAIP-25 permission granted from the legacy flow (isMultichainOrigin: false) and the chainId is not already permissioned', () => {
      it('skips permittedChains approval and switches to it if isAddFlow: true', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.isAddFlow = true;
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: false,
          },
        });
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.requestPermissionApprovalForOrigin).not.toHaveBeenCalled();
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
      });

      it('requests permittedChains approval then switches to it if isAddFlow: false', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.isAddFlow = false;
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: false,
          },
        });
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalled();
        expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
          [PermissionNames.permittedChains]: {
            caveats: [
              {
                type: CaveatTypes.restrictNetworkSwitching,
                value: ['0x1'],
              },
            ],
          },
        });
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
      });

      it('updates the CAIP-25 caveat with the chain added', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: false,
          },
        });
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.updateCaveat).toHaveBeenCalledWith(
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
          {
            requiredScopes: {},
            optionalScopes: {
              'eip155:1': {
                accounts: [],
              },
            },
            isMultichainOrigin: false,
          },
        );
      });

      it('should handle errors if the permittedChains approval is rejected', async () => {
        const { mocks, end, switchChain } = createMockedSwitchChain();
        mocks.requestPermissionApprovalForOrigin.mockRejectedValueOnce({
          code: errorCodes.provider.userRejectedRequest,
        });
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: false,
          },
        });
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.requestPermissionApprovalForOrigin).toHaveBeenCalled();
        expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
        expect(end).toHaveBeenCalledWith();
      });
    });

    describe('with an existing CAIP-25 permission granted from the multichain flow (isMultichainOrigin: true) and the chainId is not already permissioned', () => {
      it('does not request permittedChains approval', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        mocks.getCaveat.mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        });
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.requestPermissionApprovalForOrigin).not.toHaveBeenCalled();
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
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

        expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
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
        await switchChain('0x1', 'mainnet', 'approvalFlowId');

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
          await switchChain('0x1', 'mainnet', 'approvalFlowId');

          expect(
            mocks.requestPermissionApprovalForOrigin,
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
          await switchChain('0x1', 'mainnet', 'approvalFlowId');

          expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
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
