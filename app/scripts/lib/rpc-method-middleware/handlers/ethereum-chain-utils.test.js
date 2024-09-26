import { ApprovalType } from '@metamask/controller-utils';
import { errorCodes } from 'eth-rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../multichain-api/caip25permissions';
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
      requestUserApproval: jest.fn().mockResolvedValue(123),
      getCaveat: jest.fn(),
      requestPermissionApprovalForOrigin: jest.fn(),
      updateCaveat: jest.fn(),
    };
    const response = {};
    const switchChain = (
      origin,
      chainId,
      requestData,
      networkClientId,
      approvalFlowId,
    ) =>
      EthChainUtils.switchChain(
        response,
        end,
        origin,
        chainId,
        requestData,
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
      await switchChain(
        'example.com',
        '0x1',
        { foo: 'bar' },
        'mainnet',
        'approvalFlowId',
      );

      expect(mocks.getCaveat).toHaveBeenCalledWith({
        target: Caip25EndowmentPermissionName,
        caveatType: Caip25CaveatType,
      });
    });

    it('passes through unexpected errors if approvalFlowId is not provided', async () => {
      const { mocks, end, switchChain } = createMockedSwitchChain();
      mocks.requestUserApproval.mockRejectedValueOnce(
        new Error('unexpected error'),
      );

      await switchChain('example.com', '0x1', { foo: 'bar' }, 'mainnet', null);

      expect(end).toHaveBeenCalledWith(new Error('unexpected error'));
    });

    it('passes through unexpected errors if approvalFlowId is provided', async () => {
      const { mocks, end, switchChain } = createMockedSwitchChain();
      mocks.requestUserApproval.mockRejectedValueOnce(
        new Error('unexpected error'),
      );

      await switchChain(
        'example.com',
        '0x1',
        { foo: 'bar' },
        'mainnet',
        'approvalFlowId',
      );

      expect(end).toHaveBeenCalledWith(new Error('unexpected error'));
    });

    it('ignores userRejectedRequest errors when approvalFlowId is provided', async () => {
      const { mocks, end, response, switchChain } = createMockedSwitchChain();
      mocks.requestUserApproval.mockRejectedValueOnce({
        code: errorCodes.provider.userRejectedRequest,
      });

      await switchChain(
        'example.com',
        '0x1',
        { foo: 'bar' },
        'mainnet',
        'approvalFlowId',
      );

      expect(response.result).toStrictEqual(null);
      expect(end).toHaveBeenCalledWith();
    });

    it('ends the approval flow when approvalFlowId is provided', async () => {
      const { mocks, switchChain } = createMockedSwitchChain();

      await switchChain(
        'example.com',
        '0x1',
        { foo: 'bar' },
        'mainnet',
        'approvalFlowId',
      );

      expect(mocks.endApprovalFlow).toHaveBeenCalledWith({
        id: 'approvalFlowId',
      });
    });

    describe('with no existing CAIP-25 permission', () => {
      it('requests a switch chain approval and switches to it', async () => {
        const { mocks, switchChain } = createMockedSwitchChain();
        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

        expect(mocks.requestUserApproval).toHaveBeenCalledWith({
          origin: 'example.com',
          type: ApprovalType.SwitchEthereumChain,
          requestData: { foo: 'bar' },
        });
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
      });

      it('should handle errors if the switch chain approval is rejected', async () => {
        const { mocks, end, switchChain } = createMockedSwitchChain();
        mocks.requestUserApproval.mockRejectedValueOnce({
          code: errorCodes.provider.userRejectedRequest,
        });

        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

        expect(mocks.requestUserApproval).toHaveBeenCalled();
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
        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

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
        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

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
        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

        expect(mocks.updateCaveat).toHaveBeenCalledWith(
          'example.com',
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
          {
            requiredScopes: {},
            optionalScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
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
        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

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
        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

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
        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

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
        await switchChain(
          'example.com',
          '0x1',
          { foo: 'bar' },
          'mainnet',
          'approvalFlowId',
        );

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
        it('does not request permittedChains approval', async () => {
          const { mocks, switchChain } = createMockedSwitchChain();
          mocks.getCaveat.mockReturnValue({
            value: {
              requiredScopes: {
                'eip155:1': {
                  methods: [],
                  notifications: [],
                },
              },
              optionalScopes: {},
              isMultichainOrigin,
            },
          });
          await switchChain(
            'example.com',
            '0x1',
            { foo: 'bar' },
            'mainnet',
            'approvalFlowId',
          );

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
                  methods: [],
                  notifications: [],
                },
              },
              optionalScopes: {},
              isMultichainOrigin,
            },
          });
          await switchChain(
            'example.com',
            '0x1',
            { foo: 'bar' },
            'mainnet',
            'approvalFlowId',
          );

          expect(mocks.setActiveNetwork).toHaveBeenCalledWith('mainnet');
        });
      },
    );
  });
});
