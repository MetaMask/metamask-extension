import { SignatureRequest } from '@metamask/signature-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { SecurityAlertSource } from '../../../../shared/constants/security-provider';

export type SecurityAlertResponse = {
  block?: number;
  description?: string;
  features?: string[];
  providerRequestsCount?: Record<string, number>;
  reason: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: string;
  securityAlertId?: string;
  source?: SecurityAlertSource;
};

export type UpdateSecurityAlertResponse = (
  method: string,
  securityAlertId: string,
  securityAlertResponse: SecurityAlertResponse,
) => Promise<TransactionMeta | SignatureRequest>;

/**
 * Parameters for the security alerts API.
 */
export type GetSecurityAlertsConfig = (url: string) => Promise<{
  newUrl?: string;
  authorization?: string;
}>;
