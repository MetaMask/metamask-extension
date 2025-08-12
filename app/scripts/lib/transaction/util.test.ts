import { InternalAccount } from '@metamask/keyring-internal-api';
import { TransactionParams } from '@metamask/eth-json-rpc-middleware';
import {
  TransactionController,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { UserOperationController } from '@metamask/user-operation-controller';
import { cloneDeep } from 'lodash';
import {
  generateSecurityAlertId,
  validateRequestWithPPOM,
} from '../ppom/ppom-util';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { scanAddressAndAddToCache } from '../trust-signals/security-alerts-api';
import { mapChainIdToSupportedEVMChain } from '../trust-signals/trust-signals-util';
import { SupportedEVMChain, ResultType } from '../trust-signals/types';
import {
  AddDappTransactionRequest,
  AddTransactionOptions,
  AddTransactionRequest,
  addDappTransaction,
  addTransaction,
} from './util';

jest.mock('../ppom/ppom-util');
jest.mock('../trust-signals/security-alerts-api');
jest.mock('../trust-signals/trust-signals-util');

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

const SECURITY_ALERT_ID_MOCK = '123';

const INTERNAL_ACCOUNT_ADDRESS = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';
const INTERNAL_ACCOUNT = createMockInternalAccount({
  address: INTERNAL_ACCOUNT_ADDRESS,
});

const TRANSACTION_PARAMS_MOCK: TransactionParams = {
  from: '0x1',
};

const TRANSACTION_OPTIONS_MOCK: AddTransactionOptions = {
  actionId: 'mockActionId',
  networkClientId: 'mockNetworkClientId',
  origin: 'mockOrigin',
  requireApproval: false,
  type: TransactionType.simpleSend,
};

const DAPP_REQUEST_MOCK = {
  id: TRANSACTION_OPTIONS_MOCK.actionId,
  method: 'eth_sendTransaction',
  origin: TRANSACTION_OPTIONS_MOCK.origin,
  securityAlertResponse: { test: 'value' },
};

const TRANSACTION_META_MOCK: TransactionMeta = {
  id: 'testId',
  hash: 'testHash',
} as TransactionMeta;

const TRANSACTION_REQUEST_MOCK: AddTransactionRequest = {
  networkClientId: 'mockNetworkClientId',
  selectedAccount: {
    type: 'eip155:eoa',
  } as InternalAccount,
  transactionParams: TRANSACTION_PARAMS_MOCK,
  transactionOptions: TRANSACTION_OPTIONS_MOCK,
  waitForSubmit: false,
  internalAccounts: [],
} as unknown as AddTransactionRequest;

function createTransactionControllerMock() {
  return {
    addTransaction: jest.fn(),
    state: { transactions: [] },
  } as unknown as jest.Mocked<TransactionController>;
}

function createUserOperationControllerMock() {
  return {
    addUserOperationFromTransaction: jest.fn(),
    startPollingByNetworkClientId: jest.fn(),
  } as unknown as jest.Mocked<UserOperationController>;
}

describe('Transaction Utils', () => {
  let request: AddTransactionRequest;
  let dappRequest: AddDappTransactionRequest;
  let transactionController: jest.Mocked<TransactionController>;
  let userOperationController: jest.Mocked<UserOperationController>;
  let getAddressSecurityAlertResponseMock: jest.Mock;
  let addAddressSecurityAlertResponseMock: jest.Mock;
  const validateRequestWithPPOMMock = jest.mocked(validateRequestWithPPOM);
  const generateSecurityAlertIdMock = jest.mocked(generateSecurityAlertId);
  const scanAddressAndAddToCacheMock = jest.mocked(scanAddressAndAddToCache);
  const mapChainIdToSupportedEVMChainMock = jest.mocked(
    mapChainIdToSupportedEVMChain,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    request = cloneDeep(TRANSACTION_REQUEST_MOCK);
    transactionController = createTransactionControllerMock();
    userOperationController = createUserOperationControllerMock();
    getAddressSecurityAlertResponseMock = jest.fn();
    addAddressSecurityAlertResponseMock = jest.fn();

    scanAddressAndAddToCacheMock.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: ResultType.Benign,
      label: 'Safe address',
    });

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.ppomController = {} as any;

    transactionController.addTransaction.mockResolvedValue({
      result: Promise.resolve('testHash'),
      transactionMeta: TRANSACTION_META_MOCK,
    });

    transactionController.state.transactions.push(TRANSACTION_META_MOCK);

    userOperationController.addUserOperationFromTransaction.mockResolvedValue({
      id: TRANSACTION_META_MOCK.id,
      hash: jest.fn().mockResolvedValue({}),
      transactionHash: jest.fn().mockResolvedValue(TRANSACTION_META_MOCK.hash),
    });

    generateSecurityAlertIdMock.mockReturnValue(SECURITY_ALERT_ID_MOCK);

    request.transactionController = transactionController;
    request.userOperationController = userOperationController;
    request.updateSecurityAlertResponse = jest.fn();
    request.getSecurityAlertResponse = getAddressSecurityAlertResponseMock;
    request.addSecurityAlertResponse = addAddressSecurityAlertResponseMock;

    dappRequest = {
      ...request,
      dappRequest: DAPP_REQUEST_MOCK,
    };
  });

  describe('addTransaction', () => {
    describe('if selected account is EOA', () => {
      it('adds transaction', async () => {
        await addTransaction(request);

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledTimes(1);
        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledWith(TRANSACTION_PARAMS_MOCK, {
          ...TRANSACTION_OPTIONS_MOCK,
        });
      });

      it('returns transaction meta', async () => {
        const transactionMeta = await addTransaction(request);
        expect(transactionMeta).toStrictEqual(TRANSACTION_META_MOCK);
      });

      it('does not throw if result promise fails if waitForSubmit is false', async () => {
        transactionController.addTransaction.mockResolvedValue({
          result: Promise.reject(new Error('Test Error')),
          transactionMeta: TRANSACTION_META_MOCK,
        });

        await expect(addTransaction(request)).resolves.toBeTruthy();
      });

      it('throws if result promise fails if waitForSubmit is true', async () => {
        request.waitForSubmit = true;

        transactionController.addTransaction.mockResolvedValue({
          result: Promise.reject(new Error('Test Error')),
          transactionMeta: TRANSACTION_META_MOCK,
        });

        await expect(addTransaction(request)).rejects.toThrow('Test Error');
      });

      it('does not wait for result if waitForSubmit is false', async () => {
        transactionController.addTransaction.mockResolvedValue({
          result: new Promise(() => {
            /* Intentionally not resolved */
          }),
          transactionMeta: TRANSACTION_META_MOCK,
        });

        await expect(addTransaction(request)).resolves.toBeTruthy();
      });

      it('waits for result if waitForSubmit is true', async () => {
        request.waitForSubmit = true;

        let resultResolve;
        let completed = false;

        const resultPromise = new Promise<string>((resolve) => {
          resultResolve = resolve;
        });

        transactionController.addTransaction.mockResolvedValue({
          result: resultPromise,
          transactionMeta: TRANSACTION_META_MOCK,
        });

        addTransaction(request).then(() => {
          completed = true;
        });

        await flushPromises();

        expect(completed).toBe(false);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        resultResolve!(TRANSACTION_META_MOCK.hash);

        await flushPromises();

        expect(completed).toBe(true);
      });
    });

    describe('if selected account is smart contract', () => {
      beforeEach(() => {
        request.selectedAccount.type = 'eip155:erc4337';
      });

      it('adds user operation', async () => {
        await addTransaction(request);

        expect(
          request.userOperationController.addUserOperationFromTransaction,
        ).toHaveBeenCalledTimes(1);
        expect(
          request.userOperationController.addUserOperationFromTransaction,
        ).toHaveBeenCalledWith(TRANSACTION_PARAMS_MOCK, {
          networkClientId: TRANSACTION_REQUEST_MOCK.networkClientId,
          origin: TRANSACTION_OPTIONS_MOCK.origin,
          requireApproval: TRANSACTION_OPTIONS_MOCK.requireApproval,
          swaps: undefined,
          type: TRANSACTION_OPTIONS_MOCK.type,
        });
      });

      it('starts polling', async () => {
        await addTransaction(request);

        expect(
          userOperationController.startPollingByNetworkClientId,
        ).toHaveBeenCalledTimes(1);
        expect(
          userOperationController.startPollingByNetworkClientId,
        ).toHaveBeenCalledWith(TRANSACTION_REQUEST_MOCK.networkClientId);
      });

      it('returns transaction meta', async () => {
        const transactionMeta = await addTransaction(request);
        expect(transactionMeta).toStrictEqual(TRANSACTION_META_MOCK);
      });

      it('does not wait for transaction hash promise if waitForSubmit is false', async () => {
        userOperationController.addUserOperationFromTransaction.mockResolvedValue(
          {
            id: TRANSACTION_META_MOCK.id,
            hash: undefined as never,
            transactionHash: () =>
              new Promise(() => {
                /* Intentionally not resolved */
              }),
          },
        );

        await expect(addTransaction(request)).resolves.toBeTruthy();
      });

      it('waits for transaction hash promise if waitForSubmit is true', async () => {
        request.waitForSubmit = true;

        let transactionHashResolve;
        let completed = false;

        const transactionHashPromise = new Promise<string>((resolve) => {
          transactionHashResolve = resolve;
        });

        userOperationController.addUserOperationFromTransaction.mockResolvedValue(
          {
            id: TRANSACTION_META_MOCK.id,
            hash: () => Promise.resolve(TRANSACTION_META_MOCK.hash),
            transactionHash: () => transactionHashPromise,
          },
        );

        addTransaction(request).then(() => {
          completed = true;
        });

        await flushPromises();

        expect(completed).toBe(false);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transactionHashResolve!(TRANSACTION_META_MOCK.hash);

        await flushPromises();

        expect(completed).toBe(true);
      });

      it('does not throw if transaction hash promise fails and waitForSubmit is false', async () => {
        userOperationController.addUserOperationFromTransaction.mockResolvedValue(
          {
            id: TRANSACTION_META_MOCK.id,
            hash: jest.fn().mockRejectedValue(new Error('Test Error')),
            transactionHash: jest.fn().mockResolvedValue({}),
          },
        );

        await expect(addTransaction(request)).resolves.toBeTruthy();
      });

      it('throws if transaction hash promise fails and waitForSubmit is true', async () => {
        request.waitForSubmit = true;

        userOperationController.addUserOperationFromTransaction.mockResolvedValue(
          {
            id: TRANSACTION_META_MOCK.id,
            hash: undefined as never,
            transactionHash: jest
              .fn()
              .mockRejectedValue(new Error('Test Error')),
          },
        );

        await expect(addTransaction(request)).rejects.toThrow('Test Error');
      });

      it('removes type from swaps metadata', async () => {
        request.transactionOptions.swaps = {
          meta: {
            sourceTokenSymbol: 'ETH',
            type: TransactionType.simpleSend,
          },
        };

        await addTransaction(request);

        expect(
          request.userOperationController.addUserOperationFromTransaction,
        ).toHaveBeenCalledTimes(1);
        expect(
          request.userOperationController.addUserOperationFromTransaction,
        ).toHaveBeenCalledWith(
          TRANSACTION_PARAMS_MOCK,
          expect.objectContaining({
            swaps: {
              sourceTokenSymbol: 'ETH',
            },
          }),
        );
      });

      it('normalises gas fees', async () => {
        request.transactionParams.maxFeePerGas = 'a';
        request.transactionParams.maxPriorityFeePerGas = 'b';

        await addTransaction(request);

        expect(
          request.userOperationController.addUserOperationFromTransaction,
        ).toHaveBeenCalledTimes(1);
        expect(
          request.userOperationController.addUserOperationFromTransaction,
        ).toHaveBeenCalledWith(
          {
            ...TRANSACTION_PARAMS_MOCK,
            maxFeePerGas: '0xa',
            maxPriorityFeePerGas: '0xb',
          },
          expect.anything(),
        );
      });
    });

    describe('validates using security provider', () => {
      it('adds loading response to request options', async () => {
        await addTransaction({
          ...request,
          securityAlertsEnabled: true,
          chainId: '0x1',
        });

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledTimes(1);

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledWith(TRANSACTION_PARAMS_MOCK, {
          ...TRANSACTION_OPTIONS_MOCK,
          securityAlertResponse: {
            reason: BlockaidReason.inProgress,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: BlockaidResultType.Loading,
            securityAlertId: SECURITY_ALERT_ID_MOCK,
          },
        });
      });

      it('unless blockaid is disabled', async () => {
        await addTransaction({
          ...request,
          securityAlertsEnabled: false,
          chainId: '0x1',
        });

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledTimes(1);

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledWith(
          TRANSACTION_PARAMS_MOCK,
          TRANSACTION_OPTIONS_MOCK,
        );

        expect(validateRequestWithPPOMMock).toHaveBeenCalledTimes(0);
      });

      it('send to users own account', async () => {
        const sendRequest = {
          ...request,
          transactionParams: {
            ...request.transactionParams,
            to: INTERNAL_ACCOUNT_ADDRESS,
          },
        };
        await addTransaction({
          ...sendRequest,
          securityAlertsEnabled: false,
          chainId: '0x1',
          internalAccounts: [INTERNAL_ACCOUNT],
        });

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledTimes(1);

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledWith(
          sendRequest.transactionParams,
          TRANSACTION_OPTIONS_MOCK,
        );

        expect(validateRequestWithPPOMMock).toHaveBeenCalledTimes(0);
      });

      it('unless transaction type is swap', async () => {
        const swapRequest = { ...request };
        swapRequest.transactionOptions.type = TransactionType.swap;

        await addTransaction({
          ...swapRequest,
          securityAlertsEnabled: true,
          chainId: '0x1',
        });

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledTimes(1);

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledWith(TRANSACTION_PARAMS_MOCK, {
          ...TRANSACTION_OPTIONS_MOCK,
          type: TransactionType.swap,
        });

        expect(validateRequestWithPPOMMock).toHaveBeenCalledTimes(0);
      });

      it('unless transaction type is swapApproval', async () => {
        const swapRequest = { ...request };
        swapRequest.transactionOptions.type = TransactionType.swapApproval;

        await addTransaction({
          ...swapRequest,
          securityAlertsEnabled: true,
          chainId: '0x1',
        });

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledTimes(1);

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledWith(TRANSACTION_PARAMS_MOCK, {
          ...TRANSACTION_OPTIONS_MOCK,
          type: TransactionType.swapApproval,
        });

        expect(validateRequestWithPPOMMock).toHaveBeenCalledTimes(0);
      });
    });

    describe('adds trust signals', () => {
      beforeEach(() => {
        request.transactionOptions.origin = ORIGIN_METAMASK;
        request.transactionParams.to =
          '0x1234567890123456789012345678901234567890';
        mapChainIdToSupportedEVMChainMock.mockReturnValue(
          SupportedEVMChain.Ethereum,
        );
      });

      it('calls scanAddressAndAddToCache', async () => {
        await addTransaction({
          ...request,
          securityAlertsEnabled: true,
          chainId: CHAIN_IDS.MAINNET,
        });

        expect(scanAddressAndAddToCacheMock).toHaveBeenCalledTimes(1);
        expect(scanAddressAndAddToCacheMock).toHaveBeenCalledWith(
          '0x1234567890123456789012345678901234567890',
          expect.objectContaining({
            getAddressSecurityAlertResponse:
              getAddressSecurityAlertResponseMock,
            addAddressSecurityAlertResponse:
              addAddressSecurityAlertResponseMock,
          }),
          undefined,
          SupportedEVMChain.Ethereum,
        );
      });

      it('does not call scanAddressAndAddToCache when security alerts are disabled', async () => {
        await addTransaction({
          ...request,
          securityAlertsEnabled: false,
          chainId: CHAIN_IDS.MAINNET,
        });

        expect(scanAddressAndAddToCacheMock).not.toHaveBeenCalled();
      });

      it('does not call scanAddressAndAddToCache when origin is not ORIGIN_METAMASK', async () => {
        request.transactionOptions.origin = 'https://example.com';

        await addTransaction({
          ...request,
          securityAlertsEnabled: true,
          chainId: CHAIN_IDS.MAINNET,
        });

        expect(scanAddressAndAddToCacheMock).not.toHaveBeenCalled();
      });

      it('does not call scanAddressAndAddToCache when to address is not a string', async () => {
        request.transactionParams.to = undefined;

        await addTransaction({
          ...request,
          securityAlertsEnabled: true,
          chainId: CHAIN_IDS.MAINNET,
        });

        expect(scanAddressAndAddToCacheMock).not.toHaveBeenCalled();
      });

      it('does not call scanAddressAndAddToCache when chain is not supported', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapChainIdToSupportedEVMChainMock.mockReturnValue(undefined as any);

        let transactionMeta = await addTransaction({
          ...request,
          securityAlertsEnabled: true,
          chainId: '0xfake-chain-id',
        });

        expect(mapChainIdToSupportedEVMChainMock).toHaveBeenCalledWith(
          '0xfake-chain-id',
        );
        expect(scanAddressAndAddToCacheMock).not.toHaveBeenCalled();
        expect(transactionMeta).toStrictEqual(TRANSACTION_META_MOCK);

        // Test that addTransaction continues even if mapChainIdToSupportedEVMChain throws an error
        mapChainIdToSupportedEVMChainMock.mockImplementation(() => {
          throw new Error('Invalid chain ID');
        });

        transactionMeta = await addTransaction({
          ...request,
          securityAlertsEnabled: true,
          chainId: CHAIN_IDS.MAINNET,
        });

        expect(mapChainIdToSupportedEVMChainMock).toHaveBeenCalledTimes(2);
        expect(transactionMeta).toStrictEqual(TRANSACTION_META_MOCK);
        expect(scanAddressAndAddToCacheMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('addDappTransaction', () => {
    describe('if selected account is EOA', () => {
      it('adds transaction', async () => {
        await addDappTransaction(dappRequest);

        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledTimes(1);
        expect(
          request.transactionController.addTransaction,
        ).toHaveBeenCalledWith(TRANSACTION_PARAMS_MOCK, {
          ...TRANSACTION_OPTIONS_MOCK,
          method: DAPP_REQUEST_MOCK.method,
          requireApproval: true,
          securityAlertResponse: DAPP_REQUEST_MOCK.securityAlertResponse,
          type: undefined,
        });
      });

      it('returns transaction hash', async () => {
        const transactionHash = await addDappTransaction(dappRequest);
        expect(transactionHash).toStrictEqual(TRANSACTION_META_MOCK.hash);
      });

      it('throws if result promise fails', async () => {
        transactionController.addTransaction.mockResolvedValue({
          result: Promise.reject(new Error('Test Error')),
          transactionMeta: TRANSACTION_META_MOCK,
        });

        await expect(addDappTransaction(dappRequest)).rejects.toThrow(
          'Test Error',
        );
      });
    });

    describe('if selected account is smart contract', () => {
      beforeEach(() => {
        request.selectedAccount.type = 'eip155:erc4337';
      });

      it('adds user operation', async () => {
        await addDappTransaction(dappRequest);

        expect(
          request.userOperationController.addUserOperationFromTransaction,
        ).toHaveBeenCalledTimes(1);
        expect(
          request.userOperationController.addUserOperationFromTransaction,
        ).toHaveBeenCalledWith(TRANSACTION_PARAMS_MOCK, {
          networkClientId: TRANSACTION_REQUEST_MOCK.networkClientId,
          origin: TRANSACTION_OPTIONS_MOCK.origin,
          requireApproval: true,
          swaps: undefined,
          type: undefined,
        });
      });

      it('starts polling', async () => {
        await addDappTransaction(dappRequest);

        expect(
          userOperationController.startPollingByNetworkClientId,
        ).toHaveBeenCalledTimes(1);
        expect(
          userOperationController.startPollingByNetworkClientId,
        ).toHaveBeenCalledWith(TRANSACTION_REQUEST_MOCK.networkClientId);
      });

      it('returns transaction hash', async () => {
        const transactionHash = await addDappTransaction(dappRequest);
        expect(transactionHash).toStrictEqual(TRANSACTION_META_MOCK.hash);
      });

      it('throws if transaction hash promise fails', async () => {
        userOperationController.addUserOperationFromTransaction.mockResolvedValue(
          {
            id: TRANSACTION_META_MOCK.id,
            hash: jest.fn().mockResolvedValue({}),
            transactionHash: jest
              .fn()
              .mockRejectedValue(new Error('Test Error')),
          },
        );

        await expect(addDappTransaction(dappRequest)).rejects.toThrow(
          'Test Error',
        );
      });
    });
  });
});
