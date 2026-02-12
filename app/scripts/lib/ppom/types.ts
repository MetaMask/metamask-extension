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
 * Getter for the Security Alerts API configuration. This allows to modify the
 * URL and authorization header.
 *
 * @param url - The URL of the Security Alerts API.
 * @returns A promise that resolves to the new URL and authorization header.
 */
export type GetSecurityAlertsConfig = (url: string) => Promise<{
  newUrl?: string;
  authorization?: string;
}>;
