import { Messenger } from '@metamask/base-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { HandlerType } from '@metamask/snaps-utils';
import {
  TransactionStatus,
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import InstitutionalWalletSnap from '@metamask/institutional-wallet-snap/dist/preinstalled-snap.json';
import {
  InstitutionalSnapController,
  InstitutionalSnapControllerMessenger,
  AllowedActions,
  InstitutionalSnapControllerPublishHookAction,
  InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction,
} from './InstitutionalSnapController';

describe('InstitutionalSnapController', () => {
  let controller: InstitutionalSnapController;
  let messenger: InstitutionalSnapControllerMessenger;

  const mockTransactionMeta: TransactionMeta = {
    id: '123',
    chainId: '0x1',
    txParams: {
      from: '0x123',
      to: '0x456',
      value: '0x1',
      data: '0x',
    },
    networkClientId: '1',
    status: TransactionStatus.unapproved,
    time: Date.now(),
  };

  const mockSnapResponse = {
    keyringRequest: {
      id: '123',
      scope: 'scope',
      account: '0x123',
      request: {
        method: 'method',
        params: [
          {
            chainId: '1',
            nonce: '0x1',
            maxPriorityFeePerGas: '0x1',
            maxFeePerGas: '0x1',
            gasLimit: '0x1',
            to: '0x456',
            value: '0x1',
            data: '0x',
            accessList: [],
            from: '0x123',
            type: '0x2',
          },
        ],
      },
    },
    type: 'type',
    fulfilled: true,
    rejected: false,
    lastUpdated: 123456789,
    transaction: {
      custodianTransactionId: 'custodian-123',
      transactionStatus: {
        finished: true,
        success: true,
        displayText: 'Success',
        submitted: true,
        reason: '',
        signed: true,
      },
      from: '0x123',
      custodianPublishesTransaction: true,
      maxFeePerGas: '0x1',
      maxPriorityFeePerGas: '0x1',
      gasLimit: '0x1',
      nonce: '0x1',
      to: '0x456',
      transactionHash: '0xhash',
      type: '0x2',
    },
    result: {
      v: '0x1',
      r: '0x2',
      s: '0x3',
    },
  };

  beforeEach(() => {
    const baseMessenger = new Messenger<
      | AllowedActions
      | InstitutionalSnapControllerPublishHookAction
      | InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction,
      never
    >();

    messenger = baseMessenger.getRestricted({
      name: 'InstitutionalSnapController',
      allowedActions: [
        'SnapController:handleRequest',
        'AccountsController:getAccountByAddress',
        'TransactionController:updateCustodialTransaction',
      ],
      allowedEvents: [],
    }) as InstitutionalSnapControllerMessenger;

    // Mock messenger calls
    messenger.registerActionHandler = jest.fn();
    messenger.call = jest.fn().mockImplementation((method, ..._args) => {
      switch (method) {
        case 'SnapController:handleRequest':
          return mockSnapResponse;
        case 'AccountsController:getAccountByAddress':
          return {
            options: {
              custodian: {
                deferPublication: true,
              },
            },
          };
        case 'TransactionController:updateCustodialTransaction':
          return {};
        default:
          return {};
      }
    });

    controller = new InstitutionalSnapController({ messenger });
  });

  describe('constructor', () => {
    it('should initialize correctly', () => {
      expect(messenger.registerActionHandler).toHaveBeenCalledTimes(3);
      expect(messenger.registerActionHandler).toHaveBeenCalledWith(
        'InstitutionalSnapController:getState',
        expect.any(Function),
      );
      expect(messenger.registerActionHandler).toHaveBeenCalledWith(
        'InstitutionalSnapController:publishHook',
        expect.any(Function),
      );

      expect(messenger.registerActionHandler).toHaveBeenCalledWith(
        'InstitutionalSnapController:beforeCheckPendingTransactionHook',
        expect.any(Function),
      );
    });
  });

  describe('deferPublicationHook', () => {
    it('should handle deferred publication', async () => {
      const result = await controller.deferPublicationHook(mockTransactionMeta);

      expect(result).toBe(false);
      expect(messenger.call).toHaveBeenCalledWith(
        'SnapController:handleRequest',
        expect.objectContaining({
          snapId: InstitutionalWalletSnap.snapId,
          origin: ORIGIN_METAMASK,
          handler: HandlerType.OnRpcRequest,
          request: {
            method: 'transactions.getMutableTransactionParameters',
            params: expect.any(Object),
          },
        }),
      );

      expect(messenger.call).toHaveBeenCalledWith(
        'TransactionController:updateCustodialTransaction',
        expect.objectContaining({
          transactionId: mockTransactionMeta.id,
          status: TransactionStatus.submitted,
          hash: mockSnapResponse.transaction.transactionHash,
          nonce: mockSnapResponse.transaction.nonce,
          gasLimit: mockSnapResponse.transaction.gasLimit,
          maxFeePerGas: mockSnapResponse.transaction.maxFeePerGas,
          maxPriorityFeePerGas:
            mockSnapResponse.transaction.maxPriorityFeePerGas,
          type: mockSnapResponse.transaction.type as TransactionEnvelopeType,
        }),
      );
    });

    it('should handle non-deferred publication', async () => {
      messenger.call = jest.fn().mockImplementation((method) => {
        if (method === 'AccountsController:getAccountByAddress') {
          return {
            options: {
              custodian: {
                deferPublication: false,
              },
            },
          };
        }
        return {};
      });

      const result = await controller.deferPublicationHook(mockTransactionMeta);
      expect(result).toBe(true);
    });
  });

  describe('beforeCheckPendingTransactionHook', () => {
    it('should return false for deferred transactions', async () => {
      const result =
        await controller.beforeCheckPendingTransactionHook(mockTransactionMeta);
      expect(result).toBe(false);
    });

    it('should return true for non-deferred transactions', async () => {
      messenger.call = jest.fn().mockImplementation((method) => {
        if (method === 'AccountsController:getAccountByAddress') {
          return {
            options: {
              custodian: {
                deferPublication: false,
              },
            },
          };
        }
        return {};
      });

      const result =
        await controller.beforeCheckPendingTransactionHook(mockTransactionMeta);
      expect(result).toBe(true);
    });
  });
});
