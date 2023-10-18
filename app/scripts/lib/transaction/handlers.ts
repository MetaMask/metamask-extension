import type { Provider } from '@metamask/network-controller';
import { FetchGasFeeEstimateOptions } from '@metamask/gas-fee-controller';
import { safelyExecute } from '@metamask/controller-utils';

import {
  TokenStandard,
  TransactionMeta,
} from '../../../../shared/constants/transaction';
import {
  MetaMetricsEventFragment,
  MetaMetricsPageObject,
  MetaMetricsReferrerObject,
} from '../../../../shared/constants/metametrics';
import { type SnapAndHardwareMessenger } from '../snap-keyring/metrics';

import * as metrics from './metrics';

export type TransactionEventRequest = {
  createEventFragment: (
    options: MetaMetricsEventFragment,
  ) => MetaMetricsEventFragment;
  finalizeEventFragment: (
    fragmentId: string,
    options?: {
      abandoned?: boolean;
      page?: MetaMetricsPageObject;
      referrer?: MetaMetricsReferrerObject;
    },
  ) => void;
  getEventFragmentById: (fragmentId: string) => MetaMetricsEventFragment;
  updateEventFragment: (
    fragmentId: string,
    payload: Partial<MetaMetricsEventFragment>,
  ) => void;
  getAccountType: (
    address: string,
  ) => Promise<'hardware' | 'imported' | 'MetaMask'>;
  getDeviceModel: (
    address: string,
  ) => Promise<'ledger' | 'lattice' | 'N/A' | string>;
  // According to the type GasFeeState returned from getEIP1559GasFeeEstimates
  // doesn't include some properties used in buildEventFragmentProperties,
  // hence returning any here to avoid type errors.
  getEIP1559GasFeeEstimates(options?: FetchGasFeeEstimateOptions): Promise<any>;
  getParticipateInMetrics: () => boolean;
  getSelectedAddress: () => string;
  getTokenStandardAndDetails: () => {
    decimals?: string;
    balance?: string;
    symbol?: string;
    standard?: TokenStandard;
  };
  getTransaction: (transactionId: string) => TransactionMeta;
  provider: Provider;
  snapAndHardwareMessenger: SnapAndHardwareMessenger;
  trackEvent: (payload: any) => void;
};

export type TransactionEventPayload = {
  transactionMeta: TransactionMeta;
  actionId?: string;
  error?: string;
  approvalTransactionMeta?: TransactionMeta;
};

/**
 * This function is called when a transaction is added to the controller.
 *
 * @param TransactionEventRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionAdded = async (
  TransactionEventRequest: TransactionEventRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  safelyExecute(
    async () =>
      await metrics.onTransactionAdded(
        TransactionEventRequest,
        transactionEventPayload,
      ),
  );
};

/**
 * This function is called when a transaction is approved by the user.
 *
 * @param TransactionEventRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionApproved = async (
  TransactionEventRequest: TransactionEventRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  safelyExecute(
    async () =>
      await metrics.onTransactionApproved(
        TransactionEventRequest,
        transactionEventPayload,
      ),
  );
};

/**
 * This function is called when a transaction is finalized.
 *
 * @param TransactionEventRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 * @param transactionEventPayload.error - The error message if the transaction failed
 */
export const handleTransactionFinalized = async (
  TransactionEventRequest: TransactionEventRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  safelyExecute(
    async () =>
      await metrics.onTransactionFinalized(
        TransactionEventRequest,
        transactionEventPayload,
      ),
  );
};

/**
 * This function is called when a transaction is dropped.
 *
 * @param TransactionEventRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionDropped = async (
  TransactionEventRequest: TransactionEventRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  safelyExecute(
    async () =>
      await metrics.onTransactionDropped(
        TransactionEventRequest,
        transactionEventPayload,
      ),
  );
};

/**
 * This function is called when a transaction is rejected by the user.
 *
 * @param TransactionEventRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionRejected = async (
  TransactionEventRequest: TransactionEventRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  safelyExecute(
    async () =>
      await metrics.onTransactionRejected(
        TransactionEventRequest,
        transactionEventPayload,
      ),
  );
};

/**
 * This function is called when a transaction is submitted to the network.
 *
 * @param TransactionEventRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionSubmitted = async (
  TransactionEventRequest: TransactionEventRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  safelyExecute(
    async () =>
      await metrics.onTransactionSubmitted(
        TransactionEventRequest,
        transactionEventPayload,
      ),
  );
};

/**
 * This function is called when a post transaction balance is updated.
 *
 * @param TransactionEventRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 * @param transactionEventPayload.approvalTransactionMeta - The updated approval transaction meta
 */
export const handlePostTransactionBalanceUpdate = async (
  TransactionEventRequest: TransactionEventRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  safelyExecute(
    async () =>
      await metrics.onPostTransactionBalanceUpdate(
        TransactionEventRequest,
        transactionEventPayload,
      ),
  );
};
