import { ApprovalController } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { ControllerInitFunction } from '../types';
import { ApprovalControllerMessenger } from '../messengers';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../../shared/constants/app';

/**
 * Initialize the approval controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.showUserConfirmation
 * @returns The initialized controller.
 */
export const ApprovalControllerInit: ControllerInitFunction<
  ApprovalController,
  ApprovalControllerMessenger
> = ({ controllerMessenger, showUserConfirmation }) => {
  const controller = new ApprovalController({
    messenger: controllerMessenger,
    showApprovalRequest: showUserConfirmation,
    typesExcludedFromRateLimiting: [
      ApprovalType.PersonalSign,
      ApprovalType.EthSignTypedData,
      ApprovalType.Transaction,
      ApprovalType.WatchAsset,
      ApprovalType.EthGetEncryptionPublicKey,
      ApprovalType.EthDecrypt,

      // Exclude Smart TX Status Page from rate limiting to allow sequential
      // transactions.
      SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
    ],
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
