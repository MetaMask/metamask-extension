import { SignatureRequest } from '@metamask/signature-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { SecurityAlertSource } from '../../../../shared/constants/security-provider';

export type SecurityAlertResponse = {
  block?: number;
  description?: string;
  features?: string[];
  providerRequestsCount?: Record<string, number>;
  reason: string;
  result_type: string;
  securityAlertId?: string;
  source?: SecurityAlertSource;
};

export type UpdateSecurityAlertResponse = (
  method: string,
  securityAlertId: string,
  securityAlertResponse: SecurityAlertResponse,
) => Promise<TransactionMeta | SignatureRequest>;
